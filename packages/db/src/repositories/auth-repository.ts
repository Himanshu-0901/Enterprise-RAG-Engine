import { and, desc, eq, gt, isNull, ne } from "drizzle-orm";
import type { Database } from "../client";
import { appUsers, authSessions, tenantMemberships } from "../schema";

export type AuthSessionRecord = typeof authSessions.$inferSelect;
export type AuthSessionInsert = typeof authSessions.$inferInsert;

export const createAuthSession = async (
  db: Database,
  input: AuthSessionInsert
): Promise<AuthSessionRecord> => {
  const [session] = await db.insert(authSessions).values(input).returning();

  if (!session) {
    throw new Error("Failed to create auth session");
  }

  return session;
};

export const findActiveAuthSessionByHash = async (
  db: Database,
  tokenHash: string,
  now = new Date()
) => {
  const [row] = await db
    .select({
      membership: tenantMemberships,
      session: authSessions,
      user: appUsers
    })
    .from(authSessions)
    .innerJoin(appUsers, eq(appUsers.id, authSessions.userId))
    .innerJoin(
      tenantMemberships,
      and(
        eq(tenantMemberships.tenantId, authSessions.tenantId),
        eq(tenantMemberships.userId, authSessions.userId)
      )
    )
    .where(
      and(
        eq(authSessions.tokenHash, tokenHash),
        gt(authSessions.expiresAt, now),
        isNull(authSessions.revokedAt)
      )
    );

  return row;
};

export const revokeAuthSession = async (
  db: Database,
  tokenHash: string
): Promise<void> => {
  await db
    .update(authSessions)
    .set({ revokedAt: new Date() })
    .where(eq(authSessions.tokenHash, tokenHash));
};

export const revokeUserAuthSessions = async (
  db: Database,
  userId: string
): Promise<void> => {
  await db
    .update(authSessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(authSessions.userId, userId), isNull(authSessions.revokedAt)));
};

export const listActiveUserAuthSessions = async (
  db: Database,
  input: { tenantId: string; userId: string },
  now = new Date()
): Promise<AuthSessionRecord[]> =>
  db
    .select()
    .from(authSessions)
    .where(
      and(
        eq(authSessions.tenantId, input.tenantId),
        eq(authSessions.userId, input.userId),
        gt(authSessions.expiresAt, now),
        isNull(authSessions.revokedAt)
      )
    )
    .orderBy(desc(authSessions.createdAt));

export const revokeOtherUserAuthSessions = async (
  db: Database,
  input: { currentSessionId: string; tenantId: string; userId: string }
): Promise<void> => {
  await db
    .update(authSessions)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(authSessions.tenantId, input.tenantId),
        eq(authSessions.userId, input.userId),
        ne(authSessions.id, input.currentSessionId),
        isNull(authSessions.revokedAt)
      )
    );
};
