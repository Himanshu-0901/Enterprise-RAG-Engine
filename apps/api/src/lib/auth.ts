import {
  findActiveAuthSessionByHash,
  findTenantById,
  findTenantMembership
} from "@rag-llm/db";
import { createMiddleware } from "hono/factory";
import { z } from "zod";
import { forbidden, unauthorized } from "./api-error";
import type { ApiContext, AuthRole } from "./context";
import { hashToken } from "../services/auth-credentials";

const authHeaderSchema = z.object({
  tenantId: z.string().uuid(),
  userId: z.string().uuid()
});

export const requireTenantRole = (allowedRoles: AuthRole[]) =>
  createMiddleware<ApiContext>(async (context, next) => {
    const bearerToken = context.req.header("authorization")?.match(/^Bearer (.+)$/i)?.[1];

    if (bearerToken) {
      const session = await findActiveAuthSessionByHash(
        context.get("db"),
        await hashToken(bearerToken)
      );

      if (!session || session.membership.status !== "active") {
        throw unauthorized("Invalid or expired session");
      }

      if (!allowedRoles.includes(session.membership.role)) {
        throw forbidden("User role is not allowed for this action");
      }

      const route = await context
        .get("dbRouter")
        .resolveTenant(session.session.tenantId);
      const tenant = await findTenantById(route.db, session.session.tenantId);

      if (tenant?.status === "suspended" && session.membership.role !== "platform_admin") {
        throw forbidden("Tenant is suspended");
      }

      context.set("authRole", session.membership.role);
      context.set("authSessionId", session.session.id);
      context.set("db", route.db);
      context.set("shardBucket", route.bucket);
      context.set("shardKey", route.shardKey);
      context.set("tenantId", session.session.tenantId);
      context.set("userId", session.session.userId);

      await next();
      return;
    }

    const parsedHeaders = authHeaderSchema.safeParse({
      tenantId: context.req.header("x-tenant-id"),
      userId: context.req.header("x-user-id")
    });

    if (!parsedHeaders.success) {
      throw unauthorized("Missing or invalid tenant authentication headers");
    }

    const route = await context
      .get("dbRouter")
      .resolveTenant(parsedHeaders.data.tenantId);
    const membership = await findTenantMembership(
      route.db,
      parsedHeaders.data.tenantId,
      parsedHeaders.data.userId
    );

    if (!membership || membership.status !== "active") {
      throw forbidden("User is not an active member of this tenant");
    }

    if (!allowedRoles.includes(membership.role)) {
      throw forbidden("User role is not allowed for this action");
    }

    const tenant = await findTenantById(route.db, membership.tenantId);

    if (tenant?.status === "suspended" && membership.role !== "platform_admin") {
      throw forbidden("Tenant is suspended");
    }

    context.set("authRole", membership.role);
    context.set("authSessionId", undefined);
    context.set("db", route.db);
    context.set("shardBucket", route.bucket);
    context.set("shardKey", route.shardKey);
    context.set("tenantId", membership.tenantId);
    context.set("userId", membership.userId);

    await next();
  });
