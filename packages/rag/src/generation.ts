import type { SourceChunk } from "./index";

export type LlmProviderName = "anthropic" | "deterministic" | "openai";

export type LlmProviderConfig = {
  anthropicApiKey: string;
  anthropicModel: string;
  inputTokenCostPerMillion: number;
  maxOutputTokens: number;
  openAiApiKey: string;
  openAiModel: string;
  outputTokenCostPerMillion: number;
  provider: LlmProviderName;
};

export type LlmUsage = {
  estimatedCostUsd: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type GroundedGenerationInput = {
  chunks: SourceChunk[];
  question: string;
};

export type GroundedGenerationResult = {
  content: string;
  usage: LlmUsage;
};

export type LlmProvider = {
  generateGroundedAnswer(input: GroundedGenerationInput): Promise<GroundedGenerationResult>;
  streamGroundedAnswer(
    input: GroundedGenerationInput
  ): AsyncIterable<GroundedGenerationResult>;
};

type OpenAiResponse = {
  error?: { message?: string };
  output_text?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
};

type AnthropicResponse = {
  content?: Array<{ text?: string; type?: string }>;
  error?: { message?: string };
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
};

const estimateTokens = (value: string): number => Math.ceil(value.length / 4);

const cost = (
  usage: Omit<LlmUsage, "estimatedCostUsd">,
  config: LlmProviderConfig
): LlmUsage => ({
  ...usage,
  estimatedCostUsd: Number(
    (
      (usage.inputTokens / 1_000_000) * config.inputTokenCostPerMillion +
      (usage.outputTokens / 1_000_000) * config.outputTokenCostPerMillion
    ).toFixed(6)
  )
});

const sourceText = (chunks: SourceChunk[]): string =>
  chunks
    .map(
      (chunk, index) =>
        `[${index + 1}] ${chunk.documentName}, page ${chunk.pageNumber ?? 1}\n${chunk.content}`
    )
    .join("\n\n");

export const buildGroundedPrompt = (input: GroundedGenerationInput): string =>
  [
    "You are a tenant-scoped knowledge assistant.",
    "Answer only from the provided sources.",
    "Cite every factual sentence with source numbers like [1] or [1][2].",
    "If the sources do not answer the question, say you do not know.",
    "",
    `Question: ${input.question}`,
    "",
    "Sources:",
    sourceText(input.chunks)
  ].join("\n");

const ensureCitations = (content: string, chunks: SourceChunk[]): string => {
  if (chunks.length === 0 || /\[\d+\]/.test(content)) {
    return content;
  }

  return `${content.trim()} [1]`;
};

const deterministicAnswer = (
  input: GroundedGenerationInput,
  config: LlmProviderConfig
): GroundedGenerationResult => {
  const content = ensureCitations(
    `Based on the indexed tenant documents, the relevant grounded context is:\n\n${input.chunks
      .slice(0, 3)
      .map((chunk, index) => `[${index + 1}] ${chunk.content.slice(0, 320)}`)
      .join("\n\n")}`,
    input.chunks
  );
  const inputTokens = estimateTokens(buildGroundedPrompt(input));
  const outputTokens = estimateTokens(content);

  return {
    content,
    usage: cost({ inputTokens, outputTokens, totalTokens: inputTokens + outputTokens }, config)
  };
};

const createDeterministicLlmProvider = (config: LlmProviderConfig): LlmProvider => ({
  generateGroundedAnswer: async (input) => deterministicAnswer(input, config),
  streamGroundedAnswer: async function* (input) {
    yield deterministicAnswer(input, config);
  }
});

const parseOpenAiText = (payload: OpenAiResponse): string => {
  if (payload.output_text?.trim()) {
    return payload.output_text.trim();
  }

  throw new Error("OpenAI response did not include output text");
};

const createOpenAiProvider = (config: LlmProviderConfig): LlmProvider => ({
  generateGroundedAnswer: async (input) => {
    if (config.openAiApiKey === "replace-me") {
      return deterministicAnswer(input, config);
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      body: JSON.stringify({
        input: buildGroundedPrompt(input),
        max_output_tokens: config.maxOutputTokens,
        model: config.openAiModel,
        temperature: 0.1
      }),
      headers: {
        Authorization: `Bearer ${config.openAiApiKey}`,
        "Content-Type": "application/json"
      },
      method: "POST"
    });
    const payload = (await response.json()) as OpenAiResponse;

    if (!response.ok) {
      throw new Error(payload.error?.message ?? `OpenAI request failed: ${response.status}`);
    }

    const content = ensureCitations(parseOpenAiText(payload), input.chunks);
    const inputTokens = payload.usage?.input_tokens ?? estimateTokens(buildGroundedPrompt(input));
    const outputTokens = payload.usage?.output_tokens ?? estimateTokens(content);

    return {
      content,
      usage: cost(
        {
          inputTokens,
          outputTokens,
          totalTokens: payload.usage?.total_tokens ?? inputTokens + outputTokens
        },
        config
      )
    };
  },
  streamGroundedAnswer: async function* (input) {
    yield await this.generateGroundedAnswer(input);
  }
});

const createAnthropicProvider = (config: LlmProviderConfig): LlmProvider => ({
  generateGroundedAnswer: async (input) => {
    if (config.anthropicApiKey === "replace-me") {
      return deterministicAnswer(input, config);
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      body: JSON.stringify({
        max_tokens: config.maxOutputTokens,
        messages: [{ content: buildGroundedPrompt(input), role: "user" }],
        model: config.anthropicModel
      }),
      headers: {
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "x-api-key": config.anthropicApiKey
      },
      method: "POST"
    });
    const payload = (await response.json()) as AnthropicResponse;

    if (!response.ok) {
      throw new Error(payload.error?.message ?? `Anthropic request failed: ${response.status}`);
    }

    const content = ensureCitations(
      payload.content?.map((item) => item.text ?? "").join("").trim() ?? "",
      input.chunks
    );
    const inputTokens = payload.usage?.input_tokens ?? estimateTokens(buildGroundedPrompt(input));
    const outputTokens = payload.usage?.output_tokens ?? estimateTokens(content);

    return {
      content,
      usage: cost({ inputTokens, outputTokens, totalTokens: inputTokens + outputTokens }, config)
    };
  },
  streamGroundedAnswer: async function* (input) {
    yield await this.generateGroundedAnswer(input);
  }
});

export const createLlmProvider = (config: LlmProviderConfig): LlmProvider => {
  if (config.provider === "openai") {
    return createOpenAiProvider(config);
  }

  if (config.provider === "anthropic") {
    return createAnthropicProvider(config);
  }

  return createDeterministicLlmProvider(config);
};
