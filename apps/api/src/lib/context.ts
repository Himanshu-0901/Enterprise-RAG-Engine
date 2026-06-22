import type { Database, DatabaseRouter } from "@rag-llm/db";
import type { EmbeddingProvider, LlmProvider } from "@rag-llm/rag";
import type { ServerEnv } from "@rag-llm/shared";
import type { IngestionQueue } from "../services/ingestion-queue";

export type AuthRole = "admin" | "editor" | "end_user" | "platform_admin";

export type ApiContext = {
  Variables: {
    authRole: AuthRole;
    authSessionId?: string;
    db: Database;
    dbRouter: DatabaseRouter;
    embeddingProvider: EmbeddingProvider;
    env: ServerEnv;
    ingestionQueue: IngestionQueue;
    llmProvider: LlmProvider;
    shardBucket: number;
    shardKey: string;
    tenantId: string;
    userId: string;
  };
};
