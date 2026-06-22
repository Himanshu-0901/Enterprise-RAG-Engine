import {
  deleteTenantUserConversation,
  findTenantSettings,
  findTenantUserConversation,
  listCitationsForMessages,
  listConversationMessages,
  listFeedbackForMessages,
  listTenantUserConversations,
  renameConversation
} from "@rag-llm/db";
import { Hono } from "hono";
import { z } from "zod";
import { forbidden, notFound } from "../lib/api-error";
import { requireTenantRole } from "../lib/auth";
import type { ApiContext } from "../lib/context";
import { ok, parseJsonBody } from "../lib/http";
import { createConversationExport } from "../services/conversation-export";

const renameConversationSchema = z.object({
  title: z.string().min(1).max(120)
});

export const conversationRoutes = new Hono<ApiContext>();

conversationRoutes.use("*", requireTenantRole(["admin", "editor", "end_user"]));

conversationRoutes.get("/", async (context) => {
  const conversations = await listTenantUserConversations(
    context.get("db"),
    context.get("tenantId"),
    context.get("userId")
  );

  return context.json(ok(conversations));
});

conversationRoutes.get("/:conversationId", async (context) => {
  const db = context.get("db");
  const tenantId = context.get("tenantId");
  const userId = context.get("userId");
  const conversationId = context.req.param("conversationId");
  const conversation = await findTenantUserConversation(
    db,
    tenantId,
    userId,
    conversationId
  );

  if (!conversation) {
    throw notFound("Conversation not found");
  }

  const messages = await listConversationMessages(db, tenantId, conversation.id);
  const citations = await listCitationsForMessages(
    db,
    tenantId,
    messages.map((message) => message.id)
  );
  const feedback = await listFeedbackForMessages(
    db,
    tenantId,
    userId,
    messages.map((message) => message.id)
  );

  return context.json(
    ok({
      conversation,
      messages: messages.map((message) => ({
        ...message,
        citations: citations.filter((citation) => citation.messageId === message.id),
        feedback:
          feedback.find((item) => item.messageId === message.id) ?? null
      }))
    })
  );
});

conversationRoutes.get("/:conversationId/export", async (context) => {
  const db = context.get("db");
  const tenantId = context.get("tenantId");
  const userId = context.get("userId");
  const conversationId = context.req.param("conversationId");
  const [conversation, settings] = await Promise.all([
    findTenantUserConversation(db, tenantId, userId, conversationId),
    findTenantSettings(db, tenantId)
  ]);

  if (!conversation) {
    throw notFound("Conversation not found");
  }

  if (!settings.allowAnswerExport) {
    throw forbidden("Answer exports are disabled for this tenant");
  }

  const messages = await listConversationMessages(db, tenantId, conversation.id);
  const citations = await listCitationsForMessages(
    db,
    tenantId,
    messages.map((message) => message.id)
  );
  const exported = createConversationExport(
    conversation,
    messages.map((message) => ({
      ...message,
      citations: citations.filter((citation) => citation.messageId === message.id)
    }))
  );

  return context.json(ok(exported));
});

conversationRoutes.patch("/:conversationId", async (context) => {
  const body = await parseJsonBody(context, renameConversationSchema);
  const conversation = await renameConversation(
    context.get("db"),
    context.get("tenantId"),
    context.get("userId"),
    context.req.param("conversationId"),
    body.title
  );

  return context.json(ok(conversation));
});

conversationRoutes.delete("/:conversationId", async (context) => {
  await deleteTenantUserConversation(
    context.get("db"),
    context.get("tenantId"),
    context.get("userId"),
    context.req.param("conversationId")
  );

  return context.json(ok({ deleted: true }));
});
