import {
  createCitations,
  createConversation,
  createMessage,
  findTenantUserConversation,
  touchConversation,
  type Database
} from "@rag-llm/db";
import type { EmbeddingProvider, LlmProvider } from "@rag-llm/rag";
import { notFound } from "../lib/api-error";
import { recordChatQuery } from "./activity";
import { generateChatAnswer } from "./chat-generation";
import { retrieveTenantContext } from "./retrieval";

type AnswerChatInput = {
  conversationId?: string;
  db: Database;
  embeddingProvider: EmbeddingProvider;
  llmProvider: LlmProvider;
  question: string;
  tenantId: string;
  userId: string;
};

export const answerChatQuestion = async ({
  conversationId,
  db,
  embeddingProvider,
  llmProvider,
  question,
  tenantId,
  userId
}: AnswerChatInput) => {
  const existingConversation = conversationId
    ? await findTenantUserConversation(db, tenantId, userId, conversationId)
    : undefined;

  if (conversationId && !existingConversation) {
    throw notFound("Conversation not found");
  }

  const retrieval = await retrieveTenantContext({
    db,
    embeddingProvider,
    question,
    tenantId
  });
  const answer = await generateChatAnswer({
    chunks: retrieval.chunks,
    diagnostics: retrieval.diagnostics,
    llmProvider,
    question
  });
  const conversation =
    existingConversation ??
    (await createConversation(db, {
      tenantId,
      title: question.slice(0, 80),
      userId
    }));

  await createMessage(db, {
    content: question,
    conversationId: conversation.id,
    role: "user",
    tenantId
  });
  const assistantMessage = await createMessage(db, {
    content: answer.message.content,
    conversationId: conversation.id,
    role: "assistant",
    tenantId
  });
  const persistedCitations = await createCitations(
    db,
    answer.message.citations.map((citation) => ({
      chunkId: citation.chunkId,
      documentId: citation.documentId,
      messageId: assistantMessage.id,
      pageNumber: citation.pageNumber,
      snippet: citation.snippet,
      tenantId
    }))
  );
  const responseMessage = {
    ...answer.message,
    citations: answer.message.citations.map((citation, index) => ({
      ...citation,
      id: persistedCitations[index]?.id ?? citation.id
    }))
  };

  await touchConversation(db, tenantId, conversation.id);
  await recordChatQuery(
    db,
    { actorUserId: userId, tenantId },
    conversation.id,
    answer.message.citations.length,
    retrieval.diagnostics,
    answer.usage
  );

  return {
    confidence: answer.confidence,
    conversationId: conversation.id,
    message: responseMessage,
    retrieval: retrieval.diagnostics,
    usage: answer.usage
  };
};
