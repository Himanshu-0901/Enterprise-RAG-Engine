import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import {
  createDatabaseClient,
  createDocument,
  createTenant,
  createUser,
  deleteTenant,
  findTenantDocument,
  listReadyTenantChunks
} from "@rag-llm/db";
import type { DocumentParser, EmbeddingProvider } from "@rag-llm/rag";
import { loadServerEnv, type ServerEnv } from "@rag-llm/shared";
import { processDocumentIngestion } from "../services/document-ingestion";

const testEnv = (): ServerEnv =>
  loadServerEnv({
    ANTHROPIC_API_KEY: "test-key",
    DATABASE_URL:
      process.env.DATABASE_URL ?? "postgres://rag:rag@localhost:55432/rag_llm",
    EMBEDDING_PROVIDER: "deterministic",
    LLM_PROVIDER: "deterministic",
    NODE_ENV: "test",
    OPENAI_API_KEY: "test-key",
    REDIS_URL: "redis://localhost:6379",
    S3_ACCESS_KEY_ID: "rag",
    S3_BUCKET: "rag-documents",
    S3_ENDPOINT: "http://localhost:9000",
    S3_REGION: "us-east-1",
    S3_SECRET_ACCESS_KEY: "rag-password"
  });

test("processDocumentIngestion indexes parsed chunks and marks document ready", async () => {
  const client = createDatabaseClient(testEnv().DATABASE_URL);
  const tenant = await createTestTenant(client.db);

  try {
    const user = await createUser(client.db, {
      email: `worker-${randomUUID()}@example.com`,
      name: "Worker Test"
    });
    const document = await createDocument(client.db, {
      format: "md",
      name: "Worker Guide.md",
      status: "queued",
      storageKey: `tenants/${tenant.id}/worker-guide.md`,
      tenantId: tenant.id
    });

    const indexed = await processDocumentIngestion(
      client.db,
      testEnv(),
      embeddingProvider,
      parser,
      {
        actorUserId: user.id,
        content: "# Guide\n\nAlpha policy.\n\nBeta renewal steps.",
        documentId: document.id,
        tenantId: tenant.id
      }
    );

    assert.equal(indexed.status, "ready");
    assert.equal(indexed.pageCount, 2);
    assert.equal(indexed.chunkCount, 2);

    const chunks = await listReadyTenantChunks(client.db, tenant.id);
    assert.deepEqual(
      chunks.map((chunk) => chunk.pageNumber).sort(),
      [1, 2]
    );
    assert.ok(chunks.every((chunk) => chunk.tenantId === tenant.id));
  } finally {
    await deleteTenant(client.db, tenant.id).catch(() => undefined);
    await client.close();
  }
});

test("processDocumentIngestion marks document failed when parsing fails", async () => {
  const client = createDatabaseClient(testEnv().DATABASE_URL);
  const tenant = await createTestTenant(client.db);

  try {
    const user = await createUser(client.db, {
      email: `worker-fail-${randomUUID()}@example.com`,
      name: "Worker Failure Test"
    });
    const document = await createDocument(client.db, {
      format: "txt",
      name: "Broken.txt",
      status: "queued",
      storageKey: `tenants/${tenant.id}/broken.txt`,
      tenantId: tenant.id
    });

    await assert.rejects(
      processDocumentIngestion(client.db, testEnv(), embeddingProvider, failingParser, {
        actorUserId: user.id,
        content: "broken source",
        documentId: document.id,
        tenantId: tenant.id
      }),
      /Parser unavailable/
    );

    const failed = await findTenantDocument(client.db, tenant.id, document.id);
    assert.equal(failed?.status, "failed");
    assert.equal(failed?.failureReason, "Parser unavailable");
  } finally {
    await deleteTenant(client.db, tenant.id).catch(() => undefined);
    await client.close();
  }
});

const createTestTenant = async (
  db: ReturnType<typeof createDatabaseClient>["db"]
) => {
  return createTenant(db, {
    name: "Worker Tenant",
    slug: `worker-${randomUUID()}`
  });
};

const embedding = (seed: number): number[] =>
  Array.from({ length: 1_536 }, (_, index) => (index === seed ? 1 : 0));

const embeddingProvider: EmbeddingProvider = {
  embedBatch: async (inputs) => inputs.map((_, index) => embedding(index)),
  embedText: async () => embedding(0)
};

const parser: DocumentParser = {
  parse: async (input) => {
    assert.equal(input.format, "md");

    return {
      blocks: [
        { pageNumber: 1, text: "Guide", type: "heading" },
        { pageNumber: 1, text: "Alpha policy.", type: "paragraph" },
        { pageNumber: 2, text: "Beta renewal steps.", type: "paragraph" }
      ],
      pageCount: 2,
      parser: "local",
      warnings: []
    };
  }
};

const failingParser: DocumentParser = {
  parse: async () => {
    throw new Error("Parser unavailable");
  }
};
