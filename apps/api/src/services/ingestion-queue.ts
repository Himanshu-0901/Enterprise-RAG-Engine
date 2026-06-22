import { Queue } from "bullmq";
import {
  DOCUMENT_INGESTION_QUEUE,
  type DocumentIngestionJob
} from "@rag-llm/shared";

export type IngestionQueue = {
  close: () => Promise<void>;
  enqueueDocument: (job: DocumentIngestionJob) => Promise<void>;
};

const redisConnectionFromUrl = (redisUrl: string) => {
  const url = new URL(redisUrl);

  return {
    host: url.hostname,
    password: url.password || undefined,
    port: Number(url.port || 6379)
  };
};

export const createIngestionQueue = (redisUrl: string): IngestionQueue => {
  const queue = new Queue<DocumentIngestionJob>(DOCUMENT_INGESTION_QUEUE, {
    connection: redisConnectionFromUrl(redisUrl)
  });

  return {
    close: () => queue.close(),
    enqueueDocument: async (job) => {
      await queue.add("ingest-document", job, {
        attempts: 3,
        backoff: { delay: 2_000, type: "exponential" },
        removeOnComplete: 100,
        removeOnFail: 100
      });
    }
  };
};
