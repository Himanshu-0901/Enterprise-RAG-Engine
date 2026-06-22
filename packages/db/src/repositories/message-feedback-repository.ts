import { and, desc, eq, inArray } from "drizzle-orm";
import type { Database } from "../client";
import { appUsers, conversations, messageFeedback, messages } from "../schema";

export type MessageFeedbackRating = "up" | "down";
export type MessageFeedbackRecord = typeof messageFeedback.$inferSelect;

export type UpsertMessageFeedbackInput = {
  comment: string | null;
  messageId: string;
  rating: MessageFeedbackRating;
  tenantId: string;
  userId: string;
};

export type TenantFeedbackItem = {
  comment: string | null;
  conversationTitle: string;
  createdAt: Date;
  messageContent: string;
  messageId: string;
  rating: MessageFeedbackRating;
  userEmail: string;
};

export const listFeedbackForMessages = async (
  db: Database,
  tenantId: string,
  userId: string,
  messageIds: string[]
): Promise<MessageFeedbackRecord[]> => {
  if (messageIds.length === 0) {
    return [];
  }

  return db
    .select()
    .from(messageFeedback)
    .where(
      and(
        eq(messageFeedback.tenantId, tenantId),
        eq(messageFeedback.userId, userId),
        inArray(messageFeedback.messageId, messageIds)
      )
    );
};

export const upsertMessageFeedback = async (
  db: Database,
  input: UpsertMessageFeedbackInput
): Promise<MessageFeedbackRecord | undefined> => {
  const [message] = await db
    .select({ id: messages.id })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(
      and(
        eq(messages.id, input.messageId),
        eq(messages.tenantId, input.tenantId),
        eq(messages.role, "assistant"),
        eq(conversations.tenantId, input.tenantId),
        eq(conversations.userId, input.userId)
      )
    );

  if (!message) {
    return undefined;
  }

  const [feedback] = await db
    .insert(messageFeedback)
    .values(input)
    .onConflictDoUpdate({
      target: [messageFeedback.messageId, messageFeedback.userId],
      set: {
        comment: input.comment,
        rating: input.rating,
        updatedAt: new Date()
      }
    })
    .returning();

  return feedback;
};

export const listTenantFeedbackItems = async (
  db: Database,
  tenantId: string
): Promise<TenantFeedbackItem[]> =>
  db
    .select({
      comment: messageFeedback.comment,
      conversationTitle: conversations.title,
      createdAt: messageFeedback.createdAt,
      messageContent: messages.content,
      messageId: messageFeedback.messageId,
      rating: messageFeedback.rating,
      userEmail: appUsers.email
    })
    .from(messageFeedback)
    .innerJoin(messages, eq(messageFeedback.messageId, messages.id))
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .innerJoin(appUsers, eq(messageFeedback.userId, appUsers.id))
    .where(
      and(
        eq(messageFeedback.tenantId, tenantId),
        eq(messages.tenantId, tenantId),
        eq(conversations.tenantId, tenantId)
      )
    )
    .orderBy(desc(messageFeedback.updatedAt));
