import { createDatabaseRouter, parsePhysicalShardConfig } from "@rag-llm/db";
import { createEmbeddingProvider, createLlmProvider } from "@rag-llm/rag";
import { loadServerEnv } from "@rag-llm/shared";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { ApiError } from "./api-error";
import type { ApiContext } from "./context";
import { analyticsRoutes } from "../routes/analytics";
import { passwordRoutes } from "../routes/auth-password";
import { profileRoutes } from "../routes/auth-profile";
import { authRoutes } from "../routes/auth";
import { chatRoutes } from "../routes/chat";
import { conversationRoutes } from "../routes/conversations";
import { documentRoutes } from "../routes/documents";
import { feedbackRoutes } from "../routes/feedback";
import { healthRoutes } from "../routes/health";
import { billingRoutes } from "../routes/billing";
import { portalRoutes } from "../routes/portal";
import { platformRoutes } from "../routes/platform";
import { settingsRoutes } from "../routes/settings";
import { tenantRoutes } from "../routes/tenants";
import { userRoutes } from "../routes/users";
import { viewerRoutes } from "../routes/viewer";
import { createIngestionQueue } from "../services/ingestion-queue";

export const createApiServer = () => {
  const env = loadServerEnv(process.env);
  const databaseRouter = createDatabaseRouter(
    env.DATABASE_URL,
    parsePhysicalShardConfig(env.DATABASE_SHARDS_JSON)
  );
  const embeddingProvider = createEmbeddingProvider({
    apiKey: env.OPENAI_API_KEY,
    dimensions: env.EMBEDDING_DIMENSIONS,
    model: env.OPENAI_EMBEDDING_MODEL,
    provider: env.EMBEDDING_PROVIDER
  });
  const llmProvider = createLlmProvider({
    anthropicApiKey: env.ANTHROPIC_API_KEY,
    anthropicModel: env.ANTHROPIC_GENERATION_MODEL,
    inputTokenCostPerMillion: env.LLM_INPUT_TOKEN_COST_PER_1M,
    maxOutputTokens: env.LLM_MAX_OUTPUT_TOKENS,
    openAiApiKey: env.OPENAI_API_KEY,
    openAiModel: env.OPENAI_GENERATION_MODEL,
    outputTokenCostPerMillion: env.LLM_OUTPUT_TOKEN_COST_PER_1M,
    provider: env.LLM_PROVIDER
  });
  const ingestionQueue = createIngestionQueue(env.REDIS_URL);
  const app = new Hono<ApiContext>();

  app.use("*", logger());
  app.use("*", cors());
  app.use("*", async (context, next) => {
    context.set("db", databaseRouter.control);
    context.set("dbRouter", databaseRouter);
    context.set("embeddingProvider", embeddingProvider);
    context.set("env", env);
    context.set("ingestionQueue", ingestionQueue);
    context.set("llmProvider", llmProvider);
    await next();
  });

  app.route("/health", healthRoutes);
  app.route("/auth", authRoutes);
  app.route("/auth/password", passwordRoutes);
  app.route("/auth/profile", profileRoutes);
  app.route("/tenants", tenantRoutes);
  app.route("/documents", documentRoutes);
  app.route("/chat", chatRoutes);
  app.route("/conversations", conversationRoutes);
  app.route("/feedback", feedbackRoutes);
  app.route("/billing", billingRoutes);
  app.route("/portal", portalRoutes);
  app.route("/platform", platformRoutes);
  app.route("/users", userRoutes);
  app.route("/settings", settingsRoutes);
  app.route("/analytics", analyticsRoutes);
  app.route("/viewer", viewerRoutes);

  app.onError((error, context) => {
    if (error instanceof ApiError) {
      return context.json(
        { error: { code: error.code, message: error.message } },
        error.status
      );
    }

    console.error(error);
    return context.json(
      { error: { code: "internal_error", message: "Unexpected server error" } },
      500
    );
  });

  return {
    app,
    close: async () => {
      await ingestionQueue.close();
      await databaseRouter.close();
    },
    env
  };
};
