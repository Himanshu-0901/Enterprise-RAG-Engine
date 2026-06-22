import { and, eq } from "drizzle-orm";
import type { Database } from "../client";
import { appUsers, tenantMemberships } from "../schema";

export type UserRecord = typeof appUsers.$inferSelect;
export type UserInsert = typeof appUsers.$inferInsert;
export type MembershipRecord = typeof tenantMemberships.$inferSelect;
export type MembershipInsert = typeof tenantMemberships.$inferInsert;

export const createUser = async (
  db: Database,
  input: UserInsert
): Promise<UserRecord> => {
  const [user] = await db.insert(appUsers).values(input).returning();

  if (!user) {
    throw new Error("Failed to create user");
  }

  return user;
};

export const findUserByEmail = async (
  db: Database,
  email: string
): Promise<UserRecord | undefined> => {
  const [user] = await db.select().from(appUsers).where(eq(appUsers.email, email));
  return user;
};

export const findUserById = async (
  db: Database,
  userId: string
): Promise<UserRecord | undefined> => {
  const [user] = await db.select().from(appUsers).where(eq(appUsers.id, userId));
  return user;
};

export const updateUserPasswordHash = async (
  db: Database,
  userId: string,
  passwordHash: string
): Promise<UserRecord> => {
  const [user] = await db
    .update(appUsers)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(appUsers.id, userId))
    .returning();

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const updateUserPasswordReset = async (
  db: Database,
  userId: string,
  input: { expiresAt: Date | null; tokenHash: string | null }
): Promise<UserRecord> => {
  const [user] = await db
    .update(appUsers)
    .set({
      passwordResetExpiresAt: input.expiresAt,
      passwordResetTokenHash: input.tokenHash,
      updatedAt: new Date()
    })
    .where(eq(appUsers.id, userId))
    .returning();

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const findUserByPasswordResetHash = async (
  db: Database,
  tokenHash: string
): Promise<UserRecord | undefined> => {
  const [user] = await db
    .select()
    .from(appUsers)
    .where(eq(appUsers.passwordResetTokenHash, tokenHash));
  return user;
};

export const addTenantMembership = async (
  db: Database,
  input: MembershipInsert
) => {
  const [membership] = await db
    .insert(tenantMemberships)
    .values(input)
    .returning();

  if (!membership) {
    throw new Error("Failed to add tenant membership");
  }

  return membership;
};

export const findTenantMembership = async (
  db: Database,
  tenantId: string,
  userId: string
): Promise<MembershipRecord | undefined> => {
  const [membership] = await db
    .select()
    .from(tenantMemberships)
    .where(
      and(
        eq(tenantMemberships.tenantId, tenantId),
        eq(tenantMemberships.userId, userId)
      )
    );

  return membership;
};

export const updateTenantMembership = async (
  db: Database,
  tenantId: string,
  userId: string,
  input: Pick<MembershipRecord, "role" | "status">
): Promise<MembershipRecord> => {
  const [membership] = await db
    .update(tenantMemberships)
    .set({ ...input, updatedAt: new Date() })
    .where(
      and(
        eq(tenantMemberships.tenantId, tenantId),
        eq(tenantMemberships.userId, userId)
      )
    )
    .returning();

  if (!membership) {
    throw new Error("Tenant membership not found");
  }

  return membership;
};

export const updateMembershipInvite = async (
  db: Database,
  tenantId: string,
  userId: string,
  input: { inviteExpiresAt: Date | null; inviteTokenHash: string | null }
): Promise<MembershipRecord> => {
  const [membership] = await db
    .update(tenantMemberships)
    .set({ ...input, updatedAt: new Date() })
    .where(
      and(
        eq(tenantMemberships.tenantId, tenantId),
        eq(tenantMemberships.userId, userId)
      )
    )
    .returning();

  if (!membership) {
    throw new Error("Tenant membership not found");
  }

  return membership;
};

export const findTenantMembershipByUserId = async (
  db: Database,
  tenantId: string,
  userId: string
) => {
  const [row] = await db
    .select({
      membership: tenantMemberships,
      user: appUsers
    })
    .from(tenantMemberships)
    .innerJoin(appUsers, eq(appUsers.id, tenantMemberships.userId))
    .where(
      and(
        eq(tenantMemberships.tenantId, tenantId),
        eq(tenantMemberships.userId, userId)
      )
    );

  return row;
};

export const findMembershipByInviteHash = async (
  db: Database,
  inviteTokenHash: string
) => {
  const [row] = await db
    .select({
      membership: tenantMemberships,
      user: appUsers
    })
    .from(tenantMemberships)
    .innerJoin(appUsers, eq(appUsers.id, tenantMemberships.userId))
    .where(eq(tenantMemberships.inviteTokenHash, inviteTokenHash));

  return row;
};

export const acceptTenantMembershipInvite = async (
  db: Database,
  membershipId: string
): Promise<MembershipRecord> => {
  const [membership] = await db
    .update(tenantMemberships)
    .set({
      acceptedAt: new Date(),
      inviteExpiresAt: null,
      inviteTokenHash: null,
      status: "active",
      updatedAt: new Date()
    })
    .where(eq(tenantMemberships.id, membershipId))
    .returning();

  if (!membership) {
    throw new Error("Tenant membership not found");
  }

  return membership;
};

export const listTenantMembers = async (db: Database, tenantId: string) =>
  db
    .select({
      id: appUsers.id,
      name: appUsers.name,
      email: appUsers.email,
      role: tenantMemberships.role,
      status: tenantMemberships.status,
      lastSeenAt: tenantMemberships.lastSeenAt
    })
    .from(tenantMemberships)
    .innerJoin(appUsers, eq(appUsers.id, tenantMemberships.userId))
    .where(eq(tenantMemberships.tenantId, tenantId));
