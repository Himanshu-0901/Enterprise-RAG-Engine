import type {
  Citation,
  ChatMessage
} from "@rag-llm/shared";
import type {
  LlmProvider,
  LlmUsage,
  RetrievalCandidate,
  RetrievalDiagnostics
} from "@rag-llm/rag";

export type GeneratedChatAnswer = {
  confidence: RetrievalDiagnostics["confidence"];
  message: ChatMessage;
  usage: LlmUsage;
};

const zeroUsage: LlmUsage = {
  estimatedCostUsd: 0,
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0
};

const now = (): string => new Date().toISOString();

const citationFromChunk = (
  chunk: RetrievalCandidate,
  index: number
): Citation => ({
  chunkId: chunk.id,
  documentId: chunk.documentId,
  documentName: chunk.documentName,
  id: `citation-${chunk.id}-${index}`,
  pageNumber: chunk.pageNumber ?? 1,
  snippet: chunk.content.slice(0, 220)
});

export const generateChatAnswer = async ({
  chunks,
  diagnostics,
  llmProvider,
  question
}: {
  chunks: RetrievalCandidate[];
  diagnostics: RetrievalDiagnostics;
  llmProvider: LlmProvider;
  question: string;
}): Promise<GeneratedChatAnswer> => {
  if (diagnostics.confidence === "low" || chunks.length === 0) {
    return {
      confidence: "low",
      message: {
        citations: [],
        content:
          "I could not find enough relevant source material in this tenant's indexed documents to answer that reliably.",
        createdAt: now(),
        id: `assistant-${Date.now()}`,
        role: "assistant"
      },
      usage: zeroUsage
    };
  }

  const generation = await llmProvider.generateGroundedAnswer({ chunks, question });

  return {
    confidence: diagnostics.confidence,
    message: {
      citations: chunks.map(citationFromChunk),
      content: generation.content,
      createdAt: now(),
      id: `assistant-${Date.now()}`,
      role: "assistant"
    },
    usage: generation.usage
  };
};
