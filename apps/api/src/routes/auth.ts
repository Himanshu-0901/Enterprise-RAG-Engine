import {
  acceptTenantMembershipInvite,
  addTenantMembership,
  createAuthSession,
  createTenant,
  createTenantShardAssignment,
  createUser,
  findMembershipByInviteHash,
  findActiveAuthSessionByHash,
  findTenantBySlug,
  findTenantMembership,
  findUserByEmail,
  getTenantShardBucket,
  recordAuditLog,
  revokeAuthSession,
  updateUserPasswordHash,
  upsertTenantBranding
} from "@rag-llm/db";
import type { UserRecord } from "@rag-llm/db";
import { Hono } from "hono";
import { z } from "zod";
import { badRequest, forbidden, unauthorized } from "../lib/api-error";
import type { ApiContext } from "../lib/context";
import { ok, parseJsonBody } from "../lib/http";
import {
  createSecretToken,
  hashPassword,
  hashToken,
  verifyPassword
} from "../services/auth-credentials";
import { getPlanLimits } from "../services/plan-limits";

const passwordSchema = z.string().min(8).max(128);
const signupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: passwordSchema,
  plan: z.enum(["starter", "pro", "enterprise"]).default("starter"),
  tenantName: z.string().min(1),
  tenantSlug: z.string().min(2).regex(/^[a-z0-9-]+$/)
});
const loginSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  tenantSlug: z.string().min(2)
});
const acceptInviteSchema = z.object({
  name: z.string().min(1).optional(),
  password: passwordSchema,
  token: z.string().min(20)
});

export const authRoutes = new Hono<ApiContext>();

const publicUser = (user: UserRecord) => ({
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

const createSessionResponse = async (
  db: ApiContext["Variables"]["db"],
  input: { role: string; tenantId: string; userId: string }
) => {
  const token = createSecretToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  await createAuthSession(db, {
    expiresAt,
    tenantId: input.tenantId,
    tokenHash: await hashToken(token),
    userId: input.userId
  });

  return {
    expiresAt,
    role: input.role,
    tenantId: input.tenantId,
    token,
    userId: input.userId
  };
};

authRoutes.post("/signup", async (context) => {
  const body = await parseJsonBody(context, signupSchema);
  const db = context.get("db");
  const existingTenant = await findTenantBySlug(db, body.tenantSlug);

  if (existingTenant) {
    throw badRequest("Tenant slug is already taken");
  }

  const plan = body.plan ?? "starter";
  const limits = getPlanLimits(plan);
  const tenant = await createTenant(db, {
    documentLimit: limits.documentLimit,
    monthlyQueryLimit: limits.monthlyQueryLimit,
    name: body.tenantName,
    plan,
    slug: body.tenantSlug
  });
  await createTenantShardAssignment(db, {
    bucket: getTenantShardBucket(tenant.id),
    shardKey: "primary",
    tenantId: tenant.id
  });
  await upsertTenantBranding(db, {
    accentColor: "#3b82f6",
    portalName: `${tenant.name} Assistant`,
    primaryColor: "#0f172a",
    tenantId: tenant.id,
    welcomeMessage: `Ask a question about ${tenant.name}'s documents.`
  });

  const user =
    (await findUserByEmail(db, body.email)) ??
    (await createUser(db, { email: body.email, name: body.name }));
  await updateUserPasswordHash(db, user.id, await hashPassword(body.password));
  const membership = await addTenantMembership(db, {
    role: "admin",
    status: "active",
    tenantId: tenant.id,
    userId: user.id
  });
  await recordAuditLog(db, {
    action: "tenant.signup",
    actorUserId: user.id,
    metadata: { plan: tenant.plan },
    targetId: tenant.id,
    targetType: "tenant",
    tenantId: tenant.id
  });

  return context.json(
    ok({
      membership: publicMembership(membership),
      session: await createSessionResponse(db, {
        role: membership.role,
        tenantId: tenant.id,
        userId: user.id
      }),
      tenant,
      user: publicUser(user)
    }),
    201
  );
});

authRoutes.post("/login", async (context) => {
  const body = await parseJsonBody(context, loginSchema);
  const db = context.get("db");
  const [tenant, user] = await Promise.all([
    findTenantBySlug(db, body.tenantSlug),
    findUserByEmail(db, body.email)
  ]);

  if (!tenant || !user || !(await verifyPassword(body.password, user.passwordHash))) {
    throw unauthorized("Invalid tenant, email, or password");
  }

  const membership = await findTenantMembership(db, tenant.id, user.id);

  if (!membership || membership.status !== "active") {
    throw forbidden("User is not an active member of this tenant");
  }

  return context.json(
    ok({
      session: await createSessionResponse(db, {
        role: membership.role,
        tenantId: tenant.id,
        userId: user.id
      }),
      tenant,
      user: publicUser(user)
    })
  );
});

authRoutes.post("/invites/accept", async (context) => {
  const body = await parseJsonBody(context, acceptInviteSchema);
  const invite = await findMembershipByInviteHash(
    context.get("db"),
    await hashToken(body.token)
  );

  if (!invite?.membership.inviteExpiresAt || invite.membership.inviteExpiresAt < new Date()) {
    throw unauthorized("Invalid or expired invite");
  }

  await updateUserPasswordHash(
    context.get("db"),
    invite.user.id,
    await hashPassword(body.password)
  );
  const membership = await acceptTenantMembershipInvite(
    context.get("db"),
    invite.membership.id
  );

  return context.json(
    ok({
      membership: publicMembership(membership),
      session: await createSessionResponse(context.get("db"), {
        role: membership.role,
        tenantId: membership.tenantId,
        userId: membership.userId
      }),
      user: publicUser(invite.user)
    })
  );
});

authRoutes.post("/logout", async (context) => {
  const token = context.req.header("authorization")?.match(/^Bearer (.+)$/i)?.[1];

  if (!token) {
    throw unauthorized("Missing bearer token");
  }

  const db = context.get("db");
  const tokenHash = await hashToken(token);
  const session = await findActiveAuthSessionByHash(db, tokenHash);

  await revokeAuthSession(db, tokenHash);

  if (session) {
    await recordAuditLog(db, {
      action: "auth.logout",
      actorUserId: session.session.userId,
      targetId: session.session.id,
      targetType: "auth_session",
      tenantId: session.session.tenantId
    });
  }

  return context.json(ok({ revoked: true }));
});
