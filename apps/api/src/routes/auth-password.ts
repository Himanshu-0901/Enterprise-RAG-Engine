import {
  findUserByEmail,
  findUserById,
  findUserByPasswordResetHash,
  recordAuditLog,
  revokeUserAuthSessions,
  updateUserPasswordHash,
  updateUserPasswordReset
} from "@rag-llm/db";
import { Hono } from "hono";
import { z } from "zod";
import { requireTenantRole } from "../lib/auth";
import { badRequest, unauthorized } from "../lib/api-error";
import type { ApiContext } from "../lib/context";
import { ok, parseJsonBody } from "../lib/http";
import {
  createSecretToken,
  hashPassword,
  hashToken,
  verifyPassword
} from "../services/auth-credentials";

const passwordSchema = z.string().min(8).max(128);
const resetRequestSchema = z.object({ email: z.string().email() });
const resetConfirmSchema = z.object({
  password: passwordSchema,
  token: z.string().min(20)
});
const changePasswordSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema
});

export const passwordRoutes = new Hono<ApiContext>();

passwordRoutes.post("/reset/request", async (context) => {
  const body = await parseJsonBody(context, resetRequestSchema);
  const user = await findUserByEmail(context.get("db"), body.email);
  let resetToken: string | null = null;
  let expiresAt: Date | null = null;

  if (user) {
    resetToken = createSecretToken();
    expiresAt = new Date(Date.now() + 1000 * 60 * 30);
    await updateUserPasswordReset(context.get("db"), user.id, {
      expiresAt,
      tokenHash: await hashToken(resetToken)
    });
  }

  return context.json(
    ok({
      expiresAt,
      resetToken: context.get("env").NODE_ENV === "production" ? null : resetToken,
      sent: true
    })
  );
});

passwordRoutes.post("/reset/confirm", async (context) => {
  const body = await parseJsonBody(context, resetConfirmSchema);
  const user = await findUserByPasswordResetHash(
    context.get("db"),
    await hashToken(body.token)
  );

  if (!user?.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
    throw unauthorized("Invalid or expired reset token");
  }

  await updateUserPasswordHash(
    context.get("db"),
    user.id,
    await hashPassword(body.password)
  );
  await updateUserPasswordReset(context.get("db"), user.id, {
    expiresAt: null,
    tokenHash: null
  });
  await revokeUserAuthSessions(context.get("db"), user.id);

  return context.json(ok({ changed: true }));
});

passwordRoutes.post(
  "/change",
  requireTenantRole(["admin", "editor", "end_user", "platform_admin"]),
  async (context) => {
    const body = await parseJsonBody(context, changePasswordSchema);
    const user = await findUserById(context.get("db"), context.get("userId"));

    if (!user || !(await verifyPassword(body.currentPassword, user.passwordHash))) {
      throw badRequest("Current password is incorrect");
    }

    await updateUserPasswordHash(
      context.get("db"),
      user.id,
      await hashPassword(body.newPassword)
    );
    await recordAuditLog(context.get("db"), {
      action: "auth.password_changed",
      actorUserId: user.id,
      targetId: user.id,
      targetType: "user",
      tenantId: context.get("tenantId")
    });

    return context.json(ok({ changed: true }));
  }
);
