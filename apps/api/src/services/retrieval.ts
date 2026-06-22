import {
  searchTenantChunksByEmbedding,
  searchTenantChunksByKeyword,
  type Database
} from "@rag-llm/db";
import {
  buildRetrievalDiagnostics,
  createLexicalReranker,
  fuseHybridResults,
  type EmbeddingProvider,
  type RetrievalCandidate,
  type RetrievalDiagnostics
} from "@rag-llm/rag";

type RetrievalInput = {
  db: Database;
  embeddingProvider: EmbeddingProvider;
  question: string;
  tenantId: string;
};

type RetrievalResult = {
  chunks: RetrievalCandidate[];
  diagnostics: RetrievalDiagnostics;
};

const retrievalLimit = 12;
const answerLimit = 5;

const shouldUseCandidate = (candidate: RetrievalCandidate): boolean =>
  candidate.matchSource !== "vector" || (candidate.lexicalScore ?? 0) >= 0.5;

export const retrieveTenantContext = async ({
  db,
  embeddingProvider,
  question,
  tenantId
}: RetrievalInput): Promise<RetrievalResult> => {
  const queryEmbedding = await embeddingProvider.embedText(question);
  const [vectorResults, keywordResults] = await Promise.all([
    searchTenantChunksByEmbedding(db, tenantId, queryEmbedding, retrievalLimit),
    searchTenantChunksByKeyword(db, tenantId, question, retrievalLimit)
  ]);

  const fused = fuseHybridResults({
    keywordResults,
    limit: retrievalLimit,
    tenantId,
    vectorResults
  });
  const reranked = createLexicalReranker().rerank(question, fused);
  const supported = reranked.filter(shouldUseCandidate);
  const allowVectorFallback = keywordResults.length === 0;
  const chunks = (
    supported.length > 0 || !allowVectorFallback ? supported : reranked
  ).slice(0, answerLimit);

  return {
    chunks,
    diagnostics: buildRetrievalDiagnostics(
      chunks,
      vectorResults.length,
      keywordResults.length
    )
  };
};
