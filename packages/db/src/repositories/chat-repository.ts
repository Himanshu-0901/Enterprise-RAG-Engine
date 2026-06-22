import { and, asc, desc, eq, inArray, lt, sql } from "drizzle-orm";
import type { Database } from "../client";
import { citations, conversations, documents, messages } from "../schema";

export type ConversationRecord = typeof conversations.$inferSelect;
export type ConversationInsert = typeof conversations.$inferInsert;
export type MessageInsert = typeof messages.$inferInsert;
export type CitationInsert = typeof citations.$inferInsert;
export type MessageRecord = typeof messages.$inferSelect;
export type TenantCitation = {
  chunkId: string;
  documentId: string;
  documentName: string;
  documentStorageKey: string;
  id: string;
  messageId: string;
  pageNumber: number | null;
  snippet: string;
};

export const createConversation = async (
  db: Database,
  input: ConversationInsert
) => {
  const [conversation] = await db.insert(conversations).values(input).returning();

  if (!conversation) {
    throw new Error("Failed to create conversation");
  }

  return conversation;
};

export const listTenantUserConversations = async (
  db: Database,
  tenantId: string,
  userId: string
): Promise<ConversationRecord[]> =>
  db
    .select()
    .from(conversations)
    .where(
      and(eq(conversations.tenantId, tenantId), eq(conversations.userId, userId))
    )
    .orderBy(desc(conversations.updatedAt));

export const findTenantUserConversation = async (
  db: Database,
  tenantId: string,
  userId: string,
  conversationId: string
): Promise<ConversationRecord | undefined> => {
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.tenantId, tenantId),
        eq(conversations.userId, userId)
      )
    );

  return conversation;
};

export const renameConversation = async (
  db: Database,
  tenantId: string,
  userId: string,
  conversationId: string,
  title: string
): Promise<ConversationRecord> => {
  const [conversation] = await db
    .update(conversations)
    .set({ title, updatedAt: new Date() })
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.tenantId, tenantId),
        eq(conversations.userId, userId)
      )
    )
    .returning();

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  return conversation;
};

export const touchConversation = async (
  db: Database,
  tenantId: string,
  conversationId: string
) => {
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(
      and(eq(conversations.id, conversationId), eq(conversations.tenantId, tenantId))
    );
};

export const deleteTenantUserConversation = async (
  db: Database,
  tenantId: string,
  userId: string,
  conversationId: string
): Promise<void> => {
  await db
    .delete(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.tenantId, tenantId),
        eq(conversations.userId, userId)
      )
    );
};

export const deleteTenantConversationsOlderThan = async (
  db: Database,
  tenantId: string,
  cutoff: Date
): Promise<number> => {
  const rows = await db
    .delete(conversations)
    .where(
      and(
        eq(conversations.tenantId, tenantId),
        lt(conversations.updatedAt, cutoff)
      )
    )
    .returning({ id: conversations.id });

  return rows.length;
};

export const countTenantConversationsOlderThan = async (
  db: Database,
  tenantId: string,
  cutoff: Date
): Promise<number> => {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(conversations)
    .where(
      and(
        eq(conversations.tenantId, tenantId),
        lt(conversations.updatedAt, cutoff)
      )
    );

  return row?.count ?? 0;
};

export const createMessage = async (db: Database, input: MessageInsert) => {
  const [message] = await db.insert(messages).values(input).returning();

  if (!message) {
    throw new Error("Failed to create message");
  }

  return message;
};

export const listConversationMessages = async (
  db: Database,
  tenantId: string,
  conversationId: string
): Promise<MessageRecord[]> =>
  db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.tenantId, tenantId),
        eq(messages.conversationId, conversationId)
      )
    )
    .orderBy(asc(messages.createdAt));

export const listCitationsForMessages = async (
  db: Database,
  tenantId: string,
  messageIds: string[]
): Promise<TenantCitation[]> => {
  if (messageIds.length === 0) {
    return [];
  }

  return db
    .select({
      chunkId: citations.chunkId,
      documentId: citations.documentId,
      documentName: documents.name,
      documentStorageKey: documents.storageKey,
      id: citations.id,
      messageId: citations.messageId,
      pageNumber: citations.pageNumber,
      snippet: citations.snippet
    })
    .from(citations)
    .innerJoin(documents, eq(citations.documentId, documents.id))
    .where(
      and(
        eq(citations.tenantId, tenantId),
        eq(documents.tenantId, tenantId),
        inArray(citations.messageId, messageIds)
      )
    );
};

export const findTenantCitation = async (
  db: Database,
  tenantId: string,
  citationId: string
): Promise<TenantCitation | undefined> => {
  const [citation] = await db
    .select({
      chunkId: citations.chunkId,
      documentId: citations.documentId,
      documentName: documents.name,
      documentStorageKey: documents.storageKey,
      id: citations.id,
      messageId: citations.messageId,
      pageNumber: citations.pageNumber,
      snippet: citations.snippet
    })
    .from(citations)
    .innerJoin(documents, eq(citations.documentId, documents.id))
    .where(
      and(
        eq(citations.tenantId, tenantId),
        eq(documents.tenantId, tenantId),
        eq(citations.id, citationId)
      )
    );

  return citation;
};

export const createCitations = async (
  db: Database,
  citationRows: CitationInsert[]
) => {
  if (citationRows.length === 0) {
    return [];
  }

  return db.insert(citations).values(citationRows).returning();
};
