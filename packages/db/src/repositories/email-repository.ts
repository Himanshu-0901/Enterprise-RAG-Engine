import { desc, eq } from "drizzle-orm";
import type { Database } from "../client";
import { emailMessages } from "../schema";

export type EmailMessageRecord = typeof emailMessages.$inferSelect;
export type EmailMessageInsert = typeof emailMessages.$inferInsert;

export const createEmailMessage = async (
  db: Database,
  input: EmailMessageInsert
): Promise<EmailMessageRecord> => {
  const [message] = await db.insert(emailMessages).values(input).returning();

  if (!message) {
    throw new Error("Failed to record email message");
  }

  return message;
};

export const listTenantEmailMessages = async (
  db: Database,
  tenantId: string,
  limit = 20
): Promise<EmailMessageRecord[]> =>
  db
    .select()
    .from(emailMessages)
    .where(eq(emailMessages.tenantId, tenantId))
    .orderBy(desc(emailMessages.createdAt))
    .limit(limit);
