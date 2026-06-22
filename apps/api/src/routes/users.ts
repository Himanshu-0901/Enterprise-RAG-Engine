import {
  addTenantMembership,
  type Database,
  createUser,
  findTenantById,
  findTenantMembershipByUserId,
  findTenantMembership,
  findUserByEmail,
  listTenantEmailMessages,
  listTenantMembers,
  recordAuditLog,
  updateMembershipInvite,
  updateTenantMembership
} from "@rag-llm/db";
import { Hono } from "hono";
import { z } from "zod";
import { requireTenantRole } from "../lib/auth";
import { badRequest, forbidden, notFound } from "../lib/api-error";
import type { ApiContext } from "../lib/context";
import { ok, parseJsonBody } from "../lib/http";
import { recordUserInvited } from "../services/activity";
import { createSecretToken, hashToken } from "../services/auth-credentials";
import { createEmailProvider } from "../services/email-provider";

const publicUser = (user: { email: string; id: string; name: string }) => ({
  email: user.email,
  id: user.id,
  name: user.name
});

const publicMembership = <T extends { inviteTokenHash?: string | null }>(
  membership: T
) => {
  const safeMembership = { ...membership };
  delete safeMembership.inviteTokenHash;
  return safeMembership;
};

const inviteUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(["admin", "editor", "end_user"])
});

const updateMembershipSchema = z.object({
  role: z.enum(["admin", "editor", "end_user"]).optional(),
  status: z.enum(["invited", "active", "disabled"]).optional()
});

const appUrl = "http://localhost:3001";

export const userRoutes = new Hono<ApiContext>();

userRoutes.use("*", requireTenantRole(["admin"]));

userRoutes.get("/", async (context) => {
  const members = await listTenantMembers(context.get("db"), context.get("tenantId"));
  return context.json(ok(members));
});

userRoutes.get("/email-messages", async (context) => {
  const messages = await listTenantEmailMessages(
    context.get("db"),
    context.get("tenantId")
  );
  return context.json(ok(messages));
});

const createInvite = async (
  input: { db: Database; tenantId: string },
  user: { email: string; id: string },
  tenantName: string
) => {
  const inviteToken = createSecretToken();
  const membership = await updateMembershipInvite(
    input.db,
    input.tenantId,
    user.id,
    {
      inviteExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      inviteTokenHash: await hashToken(inviteToken)
    }
  );
  const inviteUrl = `${appUrl}/?inviteToken=${encodeURIComponent(inviteToken)}`;

  await createEmailProvider(input.db).sendInviteEmail({
    inviteUrl,
    recipientEmail: user.email,
    tenantId: input.tenantId,
    tenantName
  });

  return { inviteToken, inviteUrl, membership };
};

userRoutes.post("/", async (context) => {
  const body = await parseJsonBody(context, inviteUserSchema);
  const db = context.get("db");
  const user =
    (await findUserByEmail(db, body.email)) ??
    (await createUser(db, {
      email: body.email,
      name: body.name
    }));

  const existingMembership = await findTenantMembership(
    db,
    context.get("tenantId"),
    user.id
  );

  if (existingMembership) {
    throw badRequest("User is already a member of this tenant");
  }

  const tenant = await findTenantById(db, context.get("tenantId"));

  if (!tenant) {
    throw notFound("Tenant not found");
  }

  await addTenantMembership(db, {
    role: body.role,
    status: "invited",
    tenantId: context.get("tenantId"),
    userId: user.id
  });
  const invite = await createInvite(
    { db, tenantId: context.get("tenantId") },
    user,
    tenant.name
  );
  await recordUserInvited(
    db,
    { actorUserId: context.get("userId"), tenantId: context.get("tenantId") },
    user.id,
    body.role
  );

  return context.json(
    ok({
      inviteToken: invite.inviteToken,
      inviteUrl: invite.inviteUrl,
      membership: publicMembership(invite.membership),
      user: publicUser(user)
    }),
    201
  );
});

userRoutes.post("/:userId/resend-invite", async (context) => {
  const tenantId = context.get("tenantId");
  const row = await findTenantMembershipByUserId(
    context.get("db"),
    tenantId,
    context.req.param("userId")
  );
  const tenant = await findTenantById(context.get("db"), tenantId);

  if (!row || !tenant) {
    throw notFound("Tenant invite not found");
  }

  if (row.membership.status !== "invited") {
    throw badRequest("Only pending invites can be resent");
  }

  const invite = await createInvite({ db: context.get("db"), tenantId }, row.user, tenant.name);
  await recordAuditLog(context.get("db"), {
    action: "user.invite_resent",
    actorUserId: context.get("userId"),
    targetId: row.user.id,
    targetType: "user",
    tenantId
  });

  return context.json(
    ok({
      inviteToken: invite.inviteToken,
      inviteUrl: invite.inviteUrl,
      membership: publicMembership(invite.membership),
      user: publicUser(row.user)
    })
  );
});

userRoutes.post("/:userId/revoke-invite", async (context) => {
  const row = await findTenantMembershipByUserId(
    context.get("db"),
    context.get("tenantId"),
    context.req.param("userId")
  );

  if (!row) {
    throw notFound("Tenant invite not found");
  }

  if (row.membership.status !== "invited") {
    throw badRequest("Only pending invites can be revoked");
  }

  const membership = await updateTenantMembership(
    context.get("db"),
    context.get("tenantId"),
    row.user.id,
    { role: row.membership.role, status: "disabled" }
  );
  await updateMembershipInvite(context.get("db"), context.get("tenantId"), row.user.id, {
    inviteExpiresAt: null,
    inviteTokenHash: null
  });
  await recordAuditLog(context.get("db"), {
    action: "user.invite_revoked",
    actorUserId: context.get("userId"),
    targetId: row.user.id,
    targetType: "user",
    tenantId: context.get("tenantId")
  });

  return context.json(ok(publicMembership(membership)));
});

userRoutes.patch("/:userId", async (context) => {
  const body = await parseJsonBody(context, updateMembershipSchema);

  if (!body.role && !body.status) {
    throw badRequest("At least one membership field is required");
  }

  const tenantId = context.get("tenantId");
  const userId = context.req.param("userId");
  const membership = await findTenantMembership(context.get("db"), tenantId, userId);

  if (!membership) {
    throw notFound("Tenant member not found");
  }

  if (
    userId === context.get("userId") &&
    (body.status === "disabled" || (body.role && body.role !== "admin"))
  ) {
    throw forbidden("Admins cannot disable or demote their own active session");
  }

  const updatedMembership = await updateTenantMembership(
    context.get("db"),
    tenantId,
    userId,
    {
      role: body.role ?? membership.role,
      status: body.status ?? membership.status
    }
  );
  await recordAuditLog(context.get("db"), {
    action: "user.membership_updated",
    actorUserId: context.get("userId"),
    metadata: {
      role: updatedMembership.role,
      status: updatedMembership.status
    },
    targetId: userId,
    targetType: "user",
    tenantId
  });

  return context.json(ok(publicMembership(updatedMembership)));
});
