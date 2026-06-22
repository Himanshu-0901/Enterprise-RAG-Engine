export const EMBEDDING_DIMENSIONS = 1_536;

export type EmbeddingProviderName = "deterministic" | "openai";

export type EmbeddingProviderConfig = {
  apiKey: string;
  dimensions: number;
  model: string;
  provider: EmbeddingProviderName;
};

export type EmbeddingProvider = {
  embedText(input: string): Promise<number[]>;
  embedBatch(inputs: string[]): Promise<number[][]>;
};

type OpenAIEmbeddingItem = {
  embedding?: unknown;
  index?: unknown;
};

type OpenAIEmbeddingResponse = {
  data?: unknown;
  error?: { message?: string };
};

const normalizeTerms = (value: string): string[] =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length > 2);

const hashTerm = (term: string): number => {
  let hash = 2_166_136_261;

  for (const character of term) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16_777_619);
  }

  return hash >>> 0;
};

export const createDeterministicEmbedding = (
  content: string,
  dimensions = EMBEDDING_DIMENSIONS
): number[] => {
  const embedding = Array.from({ length: dimensions }, () => 0);
  const terms = normalizeTerms(content);

  for (const term of terms) {
    const hash = hashTerm(term);
    const index = hash % dimensions;
    embedding[index] = (embedding[index] ?? 0) + (hash % 2 === 0 ? 1 : -1);
  }

  const magnitude = Math.sqrt(
    embedding.reduce((sum, value) => sum + value * value, 0)
  );

  if (magnitude === 0) {
    return embedding;
  }

  return embedding.map((value) => Number((value / magnitude).toFixed(6)));
};

const validateEmbedding = (value: unknown, dimensions: number): number[] => {
  if (!Array.isArray(value)) {
    throw new Error("Embedding response did not include a numeric vector");
  }

  if (value.length !== dimensions) {
    throw new Error(
      `Embedding dimensions mismatch. Expected ${dimensions}, received ${value.length}`
    );
  }

  if (!value.every((item): item is number => typeof item === "number")) {
    throw new Error("Embedding response included non-numeric values");
  }

  return value;
};

const createDeterministicProvider = (dimensions: number): EmbeddingProvider => ({
  embedText: async (input) => createDeterministicEmbedding(input, dimensions),
  embedBatch: async (inputs) =>
    inputs.map((input) => createDeterministicEmbedding(input, dimensions))
});

const createOpenAIProvider = (config: EmbeddingProviderConfig): EmbeddingProvider => {
  const embedBatch = async (inputs: string[]): Promise<number[][]> => {
    if (config.apiKey === "replace-me") {
      throw new Error("OPENAI_API_KEY must be configured for OpenAI embeddings");
    }

    const response = await fetch("https://api.openai.com/v1/embeddings", {
      body: JSON.stringify({
        dimensions: config.dimensions,
        encoding_format: "float",
        input: inputs,
        model: config.model
      }),
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json"
      },
      method: "POST"
    });
    const payload = (await response.json()) as OpenAIEmbeddingResponse;

    if (!response.ok) {
      throw new Error(
        payload.error?.message ?? `OpenAI embeddings request failed: ${response.status}`
      );
    }

    if (!Array.isArray(payload.data)) {
      throw new Error("OpenAI embeddings response did not include data");
    }

    const items = payload.data as OpenAIEmbeddingItem[];
    return [...items]
      .sort(
        (left, right) => Number(left.index ?? 0) - Number(right.index ?? 0)
      )
      .map((item) => validateEmbedding(item.embedding, config.dimensions));
  };

  return {
    embedBatch,
    embedText: async (input) => {
      const [embedding] = await embedBatch([input]);

      if (!embedding) {
        throw new Error("OpenAI embeddings response was empty");
      }

      return embedding;
    }
  };
};

export const createEmbeddingProvider = (
  config: EmbeddingProviderConfig
): EmbeddingProvider => {
  if (config.provider === "openai") {
    return createOpenAIProvider(config);
  }

  return createDeterministicProvider(config.dimensions);
};
