import { Worker } from "bullmq";
import { createDatabaseRouter, parsePhysicalShardConfig } from "@rag-llm/db";
import { createDocumentParser, createEmbeddingProvider } from "@rag-llm/rag";
import {
  DOCUMENT_INGESTION_QUEUE,
  loadServerEnv,
  type DocumentIngestionJob
} from "@rag-llm/shared";
import { processDocumentIngestion } from "./services/document-ingestion";
import { runRetentionCleanup } from "./services/retention-cleanup";

const redisConnectionFromUrl = (redisUrl: string) => {
  const url = new URL(redisUrl);

  return {
    host: url.hostname,
    password: url.password || undefined,
    port: Number(url.port || 6379)
  };
};

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
const documentParser = createDocumentParser({
  googleDocumentAi: {
    location: env.GOOGLE_DOCUMENT_AI_LOCATION,
    processorId: env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID,
    projectId: env.GOOGLE_DOCUMENT_AI_PROJECT_ID
  },
  mode: env.DOCUMENT_PARSER
});
const worker = new Worker<DocumentIngestionJob>(
  DOCUMENT_INGESTION_QUEUE,
  async (job) => {
    const route = await databaseRouter.resolveTenant(job.data.tenantId);
    const document = await processDocumentIngestion(
      route.db,
      env,
      embeddingProvider,
      documentParser,
      job.data
    );

    return {
      documentId: document.id,
      shardBucket: route.bucket,
      shardKey: route.shardKey,
      status: document.status
    };
  },
  { connection: redisConnectionFromUrl(env.REDIS_URL), concurrency: 2 }
);

worker.on("completed", (job) => {
  process.stdout.write(`Completed ingestion job ${job.id ?? "unknown"}\n`);
});

worker.on("failed", (job, error) => {
  process.stderr.write(
    `Failed ingestion job ${job?.id ?? "unknown"}: ${error.message}\n`
  );
});

process.stdout.write("Document ingestion worker listening\n");

const cleanupTimer = setInterval(() => {
  void runRetentionCleanup(databaseRouter.control).catch((error) => {
    process.stderr.write(`Retention cleanup failed: ${error.message}\n`);
  });
}, env.RETENTION_CLEANUP_INTERVAL_MINUTES * 60 * 1000);

void runRetentionCleanup(databaseRouter.control).catch((error) => {
  process.stderr.write(`Initial retention cleanup failed: ${error.message}\n`);
});

const shutdown = async () => {
  clearInterval(cleanupTimer);
  await worker.close();
  await databaseRouter.close();
  process.exit(0);
};

process.on("SIGTERM", () => {
  void shutdown();
});

process.on("SIGINT", () => {
  void shutdown();
});
