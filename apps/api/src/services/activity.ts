import {
  recordAuditLog,
  recordUsageEvent,
  type Database
} from "@rag-llm/db";
import type { RetrievalDiagnostics } from "@rag-llm/rag";
import type { LlmUsage } from "@rag-llm/rag";

type ActorInput = {
  actorUserId: string;
  tenantId: string;
};

export const recordDocumentIndexed = async (
  db: Database,
  actor: ActorInput,
  documentId: string,
  chunkCount: number
) => {
  await recordUsageEvent(db, {
    metadata: { chunkCount, documentId },
    quantity: 1,
    tenantId: actor.tenantId,
    type: "document_indexed"
  });

  await recordAuditLog(db, {
    action: "document.indexed",
    actorUserId: actor.actorUserId,
    metadata: { chunkCount },
    targetId: documentId,
    targetType: "document",
    tenantId: actor.tenantId
  });
};

export const recordChatQuery = async (
  db: Database,
  actor: ActorInput,
  conversationId: string,
  citationCount: number,
  retrieval: RetrievalDiagnostics,
  llmUsage: LlmUsage
) => {
  await recordUsageEvent(db, {
    metadata: {
      citationCount,
      confidence: retrieval.confidence,
      conversationId,
      estimatedCostUsd: llmUsage.estimatedCostUsd,
      fusedMatches: retrieval.fusedMatches,
      inputTokens: llmUsage.inputTokens,
      keywordMatches: retrieval.keywordMatches,
      outputTokens: llmUsage.outputTokens,
      rerankedMatches: retrieval.rerankedMatches,
      topScore: retrieval.topScore,
      totalTokens: llmUsage.totalTokens,
      vectorMatches: retrieval.vectorMatches
    },
    quantity: 1,
    tenantId: actor.tenantId,
    type: "query"
  });
};

export const recordCitationClicked = async (
  db: Database,
  actor: ActorInput,
  citation: { documentId: string; id: string; pageNumber: number | null }
) => {
  await recordUsageEvent(db, {
    metadata: {
      citationId: citation.id,
      documentId: citation.documentId,
      pageNumber: citation.pageNumber ?? 1
    },
    quantity: 1,
    tenantId: actor.tenantId,
    type: "citation_clicked"
  });
};

export const recordMessageFeedback = async (
  db: Database,
  actor: ActorInput,
  feedback: { id: string; messageId: string; rating: string }
) => {
  await recordUsageEvent(db, {
    metadata: {
      feedbackId: feedback.id,
      messageId: feedback.messageId,
      rating: feedback.rating
    },
    quantity: 1,
    tenantId: actor.tenantId,
    type: "message_feedback"
  });

  await recordAuditLog(db, {
    action: "message.feedback",
    actorUserId: actor.actorUserId,
    metadata: { rating: feedback.rating },
    targetId: feedback.messageId,
    targetType: "message",
    tenantId: actor.tenantId
  });
};

export const recordUserInvited = async (
  db: Database,
  actor: ActorInput,
  invitedUserId: string,
  role: string
) => {
  await recordUsageEvent(db, {
    metadata: { invitedUserId, role },
    quantity: 1,
    tenantId: actor.tenantId,
    type: "end_user_invited"
  });

  await recordAuditLog(db, {
    action: "user.invited",
    actorUserId: actor.actorUserId,
    metadata: { role },
    targetId: invitedUserId,
    targetType: "user",
    tenantId: actor.tenantId
  });
};
