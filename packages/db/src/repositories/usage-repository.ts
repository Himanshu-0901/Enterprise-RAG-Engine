import { and, desc, eq, gte, sql } from "drizzle-orm";
import type { Database } from "../client";
import { auditLogs, usageEvents } from "../schema";

export type UsageEventInsert = typeof usageEvents.$inferInsert;
export type AuditLogInsert = typeof auditLogs.$inferInsert;
export type UsageEventType = UsageEventInsert["type"];

export const recordUsageEvent = async (
  db: Database,
  input: UsageEventInsert
) => {
  const [event] = await db.insert(usageEvents).values(input).returning();

  if (!event) {
    throw new Error("Failed to record usage event");
  }

  return event;
};

export const listTenantUsageEvents = async (db: Database, tenantId: string) =>
  db
    .select()
    .from(usageEvents)
    .where(eq(usageEvents.tenantId, tenantId))
    .orderBy(desc(usageEvents.createdAt));

export const sumTenantUsageSince = async (
  db: Database,
  tenantId: string,
  type: UsageEventType,
  since: Date
): Promise<number> => {
  const [row] = await db
    .select({ quantity: sql<number>`coalesce(sum(${usageEvents.quantity}), 0)::int` })
    .from(usageEvents)
    .where(
      and(
        eq(usageEvents.tenantId, tenantId),
        eq(usageEvents.type, type),
        gte(usageEvents.createdAt, since)
      )
    );

  return row?.quantity ?? 0;
};

export const recordAuditLog = async (db: Database, input: AuditLogInsert) => {
  const [log] = await db.insert(auditLogs).values(input).returning();

  if (!log) {
    throw new Error("Failed to record audit log");
  }

  return log;
};

export const listTenantAuditLogs = async (db: Database, tenantId: string) =>
  db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.tenantId, tenantId))
    .orderBy(desc(auditLogs.createdAt));

export const listPlatformAuditLogs = async (db: Database) =>
  db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
