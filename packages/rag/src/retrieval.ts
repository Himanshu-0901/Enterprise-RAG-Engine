import type { SourceChunk } from "./index";

export type RetrievalMatchSource = "hybrid" | "keyword" | "vector";

export type RetrievalCandidate = SourceChunk & {
  fusedScore: number;
  keywordRank?: number;
  keywordScore?: number;
  lexicalScore?: number;
  matchSource: RetrievalMatchSource;
  rerankScore: number;
  vectorRank?: number;
  vectorScore?: number;
};

export type RetrievalDiagnostics = {
  confidence: "low" | "medium" | "high";
  fusedMatches: number;
  keywordMatches: number;
  rerankedMatches: number;
  topScore: number;
  vectorMatches: number;
};

export type Reranker = {
  rerank(query: string, candidates: RetrievalCandidate[]): RetrievalCandidate[];
};

const RRF_K = 60;

const tokenize = (value: string): Set<string> =>
  new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((term) => term.length > 2)
  );

const overlapScore = (query: string, content: string): number => {
  const queryTerms = tokenize(query);
  const contentTerms = tokenize(content);

  if (queryTerms.size === 0) {
    return 0;
  }

  let matched = 0;
  for (const term of queryTerms) {
    if (contentTerms.has(term)) {
      matched += 1;
    }
  }

  return matched / queryTerms.size;
};

const matchSource = (candidate: RetrievalCandidate): RetrievalMatchSource => {
  if (candidate.vectorRank !== undefined && candidate.keywordRank !== undefined) {
    return "hybrid";
  }

  return candidate.vectorRank !== undefined ? "vector" : "keyword";
};

export const fuseHybridResults = ({
  keywordResults,
  limit,
  tenantId,
  vectorResults
}: {
  keywordResults: SourceChunk[];
  limit: number;
  tenantId: string;
  vectorResults: SourceChunk[];
}): RetrievalCandidate[] => {
  const candidates = new Map<string, RetrievalCandidate>();

  const applyScore = (
    chunk: SourceChunk,
    rank: number,
    source: "keyword" | "vector"
  ) => {
    if (chunk.tenantId !== tenantId) {
      return;
    }

    const current =
      candidates.get(chunk.id) ??
      ({
        ...chunk,
        fusedScore: 0,
        matchSource: source,
        rerankScore: 0
      } satisfies RetrievalCandidate);

    current.fusedScore += 1 / (RRF_K + rank + 1);

    if (source === "vector") {
      current.vectorRank = rank + 1;
      current.vectorScore = chunk.score;
    } else {
      current.keywordRank = rank + 1;
      current.keywordScore = chunk.score;
    }

    current.matchSource = matchSource(current);
    candidates.set(chunk.id, current);
  };

  vectorResults.forEach((chunk, rank) => applyScore(chunk, rank, "vector"));
  keywordResults.forEach((chunk, rank) => applyScore(chunk, rank, "keyword"));

  return [...candidates.values()]
    .sort((left, right) => right.fusedScore - left.fusedScore)
    .slice(0, limit);
};

export const createLexicalReranker = (): Reranker => ({
  rerank: (query, candidates) =>
    candidates
      .map((candidate) => {
        const lexicalScore = overlapScore(query, candidate.content);

        return {
          ...candidate,
          lexicalScore,
          rerankScore:
            candidate.fusedScore +
            lexicalScore * 0.04 +
            (candidate.matchSource === "hybrid" ? 0.01 : 0)
        };
      })
      .sort((left, right) => right.rerankScore - left.rerankScore)
});

export const buildRetrievalDiagnostics = (
  candidates: RetrievalCandidate[],
  vectorMatches: number,
  keywordMatches: number
): RetrievalDiagnostics => {
  const topScore = Number((candidates[0]?.rerankScore ?? 0).toFixed(4));

  return {
    confidence: topScore >= 0.065 ? "high" : topScore >= 0.035 ? "medium" : "low",
    fusedMatches: candidates.length,
    keywordMatches,
    rerankedMatches: candidates.filter((candidate) => candidate.rerankScore > 0).length,
    topScore,
    vectorMatches
  };
};
