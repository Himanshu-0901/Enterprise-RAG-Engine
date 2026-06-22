import {
  findUserById,
  listActiveUserAuthSessions,
  recordAuditLog,
  revokeOtherUserAuthSessions
} from "@rag-llm/db";
import { Hono } from "hono";
import { requireTenantRole } from "../lib/auth";
import { badRequest, unauthorized } from "../lib/api-error";
import type { ApiContext } from "../lib/context";
import { ok } from "../lib/http";

export const profileRoutes = new Hono<ApiContext>();

profileRoutes.use(
  "*",
  requireTenantRole(["admin", "editor", "end_user", "platform_admin"])
);

profileRoutes.get("/", async (context) => {
  const user = await findUserById(context.get("db"), context.get("userId"));

  if (!user) {
    throw unauthorized("Authenticated user was not found");
  }

  return context.json(
    ok({
      email: user.email,
      id: user.id,
      name: user.name,
      role: context.get("authRole"),
      tenantId: context.get("tenantId"),
      userId: context.get("userId")
    })
  );
});

profileRoutes.get("/sessions", async (context) => {
  const sessions = await listActiveUserAuthSessions(context.get("db"), {
    tenantId: context.get("tenantId"),
    userId: context.get("userId")
  });
  const currentSessionId = context.get("authSessionId");

  return context.json(
    ok(
      sessions.map((session) => ({
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        id: session.id,
        isCurrent: session.id === currentSessionId
      }))
    )
  );
});

profileRoutes.post("/sessions/revoke-others", async (context) => {
  const currentSessionId = context.get("authSessionId");

  if (!currentSessionId) {
    throw badRequest("Bearer session is required to revoke other sessions");
  }

  await revokeOtherUserAuthSessions(context.get("db"), {
    currentSessionId,
    tenantId: context.get("tenantId"),
    userId: context.get("userId")
  });
  await recordAuditLog(context.get("db"), {
    action: "auth.sessions_revoked",
    actorUserId: context.get("userId"),
    targetId: context.get("userId"),
    targetType: "user",
    tenantId: context.get("tenantId")
  });

  return context.json(ok({ revoked: true }));
});
