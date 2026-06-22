import {
  addTenantMembership,
  createTenantShardAssignment,
  createTenant,
  createUser,
  findTenantBranding,
  findTenantById,
  findTenantBySlug,
  getTenantShardBucket,
  findUserByEmail,
  recordAuditLog,
  upsertTenantBranding
} from "@rag-llm/db";
import { Hono } from "hono";
import { z } from "zod";
import { requireTenantRole } from "../lib/auth";
import { notFound } from "../lib/api-error";
import type { ApiContext } from "../lib/context";
import { ok, parseJsonBody } from "../lib/http";
import { getPlanLimits } from "../services/plan-limits";

const createTenantSchema = z.object({
  name: z.string().min(1),
  ownerEmail: z.string().email(),
  ownerName: z.string().min(1),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  plan: z.enum(["starter", "pro", "enterprise"]).default("starter")
});

const brandingSchema = z.object({
  portalName: z.string().min(1),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  logoObjectKey: z.string().min(1).optional(),
  welcomeMessage: z.string().min(1)
});

export const tenantRoutes = new Hono<ApiContext>();

const defaultBrandingForTenant = (tenant: {
  id: string;
  name: string;
}) => ({
  accentColor: "#3b82f6",
  createdAt: new Date(0),
  logoObjectKey: null,
  portalName: `${tenant.name} Assistant`,
  primaryColor: "#0f172a",
  tenantId: tenant.id,
  updatedAt: new Date(0),
  welcomeMessage: `Ask a question about ${tenant.name}'s documents.`
});

tenantRoutes.post("/", async (context) => {
  const body = await parseJsonBody(context, createTenantSchema);
  const db = context.get("db");
  const plan = body.plan ?? "starter";
  const limits = getPlanLimits(plan);
  const tenant = await createTenant(db, {
    documentLimit: limits.documentLimit,
    monthlyQueryLimit: limits.monthlyQueryLimit,
    name: body.name,
    plan,
    slug: body.slug
  });
  const shardAssignment = await createTenantShardAssignment(db, {
    bucket: getTenantShardBucket(tenant.id),
    shardKey: "primary",
    tenantId: tenant.id
  });
  const owner =
    (await findUserByEmail(db, body.ownerEmail)) ??
    (await createUser(db, {
      email: body.ownerEmail,
      name: body.ownerName
    }));

  const membership = await addTenantMembership(db, {
    role: "admin",
    status: "active",
    tenantId: tenant.id,
    userId: owner.id
  });

  return context.json(ok({ membership, owner, shardAssignment, tenant }), 201);
});

tenantRoutes.get(
  "/current/branding",
  requireTenantRole(["admin", "editor", "end_user"]),
  async (context) => {
    const tenantId = context.get("tenantId");
    const tenant = await findTenantById(context.get("db"), tenantId);

    if (!tenant) {
      throw notFound("Tenant not found");
    }

    const branding =
      (await findTenantBranding(context.get("db"), tenantId)) ??
      defaultBrandingForTenant(tenant);

    return context.json(ok(branding));
  }
);

tenantRoutes.put(
  "/current/branding",
  requireTenantRole(["admin"]),
  async (context) => {
    const body = await parseJsonBody(context, brandingSchema);
    const branding = await upsertTenantBranding(context.get("db"), {
      ...body,
      tenantId: context.get("tenantId")
    });

    await recordAuditLog(context.get("db"), {
      action: "tenant_branding.updated",
      actorUserId: context.get("userId"),
      metadata: {
        accentColor: branding.accentColor,
        portalName: branding.portalName,
        primaryColor: branding.primaryColor
      },
      targetId: context.get("tenantId"),
      targetType: "tenant_branding",
      tenantId: context.get("tenantId")
    });

    return context.json(ok(branding));
  }
);

tenantRoutes.get("/slug/:slug", async (context) => {
  const tenant = await findTenantBySlug(context.get("db"), context.req.param("slug"));

  if (!tenant) {
    throw notFound("Tenant not found");
  }

  return context.json(ok(tenant));
});

tenantRoutes.get("/:tenantId", async (context) => {
  const tenant = await findTenantById(
    context.get("db"),
    context.req.param("tenantId")
  );

  if (!tenant) {
    throw notFound("Tenant not found");
  }

  return context.json(ok(tenant));
});
