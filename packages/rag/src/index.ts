import type { ChatMessage, Citation } from "@rag-llm/shared";
export {
  createDeterministicEmbedding,
  createEmbeddingProvider,
  EMBEDDING_DIMENSIONS
} from "./embeddings";
export type {
  EmbeddingProvider,
  EmbeddingProviderConfig,
  EmbeddingProviderName
} from "./embeddings";
export { buildGroundedPrompt, createLlmProvider } from "./generation";
export type {
  GroundedGenerationInput,
  GroundedGenerationResult,
  LlmProvider,
  LlmProviderConfig,
  LlmProviderName,
  LlmUsage
} from "./generation";
export { chunkParsedDocument } from "./parsing/chunking";
export { createDocumentParser } from "./parsing/document-parser";
export type { DocumentParserConfig } from "./parsing/document-parser";
export type {
  DocumentParser,
  ParsedBlock,
  ParsedDocument,
  ParsedTextChunk,
  ParseDocumentInput,
  SupportedDocumentFormat
} from "./parsing/types";
export {
  buildRetrievalDiagnostics,
  createLexicalReranker,
  fuseHybridResults
} from "./retrieval";
export type {
  Reranker,
  RetrievalCandidate,
  RetrievalDiagnostics,
  RetrievalMatchSource
} from "./retrieval";

export type SourceChunk = {
  id: string;
  tenantId: string;
  documentId: string;
  documentName: string;
  pageNumber: number | null;
  content: string;
  score?: number;
};

export type GroundedAnswer = {
  message: ChatMessage;
  confidence: "low" | "medium" | "high";
};

export type GroundedAnswerInput = {
  refusalReason?: string;
  question: string;
  retrievalConfidence?: GroundedAnswer["confidence"];
  tenantId: string;
  chunks: SourceChunk[];
};

export type TextChunk = {
  chunkIndex: number;
  content: string;
};

const now = (): string => new Date().toISOString();

const buildCitation = (chunk: SourceChunk, index: number): Citation => ({
  id: `citation-${chunk.id}-${index}`,
  documentId: chunk.documentId,
  documentName: chunk.documentName,
  pageNumber: chunk.pageNumber ?? 1,
  chunkId: chunk.id,
  snippet: chunk.content.slice(0, 220)
});

export const chunkText = (content: string, maxCharacters = 1_600): TextChunk[] => {
  const paragraphs = content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const chunks: TextChunk[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length <= maxCharacters) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push({ chunkIndex: chunks.length, content: current });
    }
    current = paragraph;
  }

  if (current) {
    chunks.push({ chunkIndex: chunks.length, content: current });
  }

  return chunks;
};

export const generateGroundedAnswer = (
  input: GroundedAnswerInput
): GroundedAnswer => {
  const rankedChunks = input.chunks
    .filter((chunk) => chunk.tenantId === input.tenantId)
    .slice(0, 3)
    .map((chunk) => chunk);

  if (rankedChunks.length === 0) {
    return {
      confidence: "low",
      message: {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content:
          input.refusalReason ??
          "I do not have enough indexed source material for this tenant yet. Upload and index documents before asking production questions.",
        createdAt: now(),
        citations: []
      }
    };
  }

  const citations = rankedChunks.map(buildCitation);
  const sourceSummary = rankedChunks
    .map((chunk, index) => `Source ${index + 1}: ${chunk.content.slice(0, 280)}`)
    .join("\n\n");

  return {
    confidence:
      input.retrievalConfidence ?? (rankedChunks.length > 1 ? "high" : "medium"),
    message: {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: `Based on the indexed tenant documents, here is the relevant grounded context for "${input.question}":\n\n${sourceSummary}`,
      createdAt: now(),
      citations
    }
  };
};
