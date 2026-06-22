import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  WEB_PORT: z.coerce.number().int().positive().default(3000),
  APP_BASE_URL: z.string().url().default("http://localhost:3001"),
  DATABASE_URL: z.string().url(),
  DATABASE_SHARDS_JSON: z.string().default("{}"),
  REDIS_URL: z.string().url(),
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  EMBEDDING_PROVIDER: z
    .enum(["deterministic", "openai"])
    .default("deterministic"),
  EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(1536),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_EMBEDDING_MODEL: z.string().min(1).default("text-embedding-3-small"),
  LLM_PROVIDER: z
    .enum(["deterministic", "openai", "anthropic"])
    .default("deterministic"),
  OPENAI_GENERATION_MODEL: z.string().min(1).default("gpt-4.1-mini"),
  ANTHROPIC_API_KEY: z.string().min(1).default("replace-me"),
  ANTHROPIC_GENERATION_MODEL: z.string().min(1).default("claude-3-5-haiku-latest"),
  LLM_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(700),
  LLM_INPUT_TOKEN_COST_PER_1M: z.coerce.number().min(0).default(0),
  LLM_OUTPUT_TOKEN_COST_PER_1M: z.coerce.number().min(0).default(0),
  DOCUMENT_PARSER: z
    .enum(["google_document_ai", "local"])
    .default("google_document_ai"),
  GOOGLE_DOCUMENT_AI_PROJECT_ID: z.string().optional(),
  GOOGLE_DOCUMENT_AI_LOCATION: z.string().default("us"),
  GOOGLE_DOCUMENT_AI_PROCESSOR_ID: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().min(1).default("replace-me"),
  STRIPE_STARTER_PRICE_ID: z.string().default(""),
  STRIPE_PRO_PRICE_ID: z.string().default(""),
  STRIPE_ENTERPRISE_PRICE_ID: z.string().default(""),
  RETENTION_CLEANUP_INTERVAL_MINUTES: z.coerce.number().int().positive().default(1440)
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export const loadServerEnv = (
  source: Record<string, string | undefined>
): ServerEnv => serverEnvSchema.parse(source);
