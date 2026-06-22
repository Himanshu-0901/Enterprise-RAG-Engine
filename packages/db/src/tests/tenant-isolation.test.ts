import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { eq } from "drizzle-orm";
import { createDatabaseClient } from "../client";
import {
  createCitations,
  createConversation,
  createDocument,
  createDocumentChunks,
  createMessage,
  createUser,
  findTenantCitation,
  listCitationsForMessages,
  listReadyTenantChunks,
  listTenantDocuments,
  searchTenantChunksByKeyword
} from "../repositories";
import { appUsers, tenants } from "../schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for tenant-isolation tests");
}

test("repositories do not leak documents, chunks, or citations across tenants", async () => {
  const client = createDatabaseClient(databaseUrl);
  const tenantA = await createTenant(client.db, "Tenant A");
  const tenantB = await createTenant(client.db, "Tenant B");

  try {
    const docA = await createDocument(client.db, {
      format: "md",
      name: "Tenant A Handbook",
      status: "ready",
      storageKey: `tenants/${tenantA.id}/a.md`,
      tenantId: tenantA.id
    });
    const docB = await createDocument(client.db, {
      format: "md",
      name: "Tenant B Handbook",
      status: "ready",
      storageKey: `tenants/${tenantB.id}/b.md`,
      tenantId: tenantB.id
    });
    const [chunkA, chunkB] = await Promise.all([
      createDocumentChunks(client.db, [
        chunkInput(tenantA.id, docA.id, "alpha tenant private policy")
      ]).then(([row]) => row),
      createDocumentChunks(client.db, [
        chunkInput(tenantB.id, docB.id, "beta tenant private policy")
      ]).then(([row]) => row)
    ]);

    assert.ok(chunkA);
    assert.ok(chunkB);

    const [docsA, docsB, chunksA, keywordA] = await Promise.all([
      listTenantDocuments(client.db, tenantA.id),
      listTenantDocuments(client.db, tenantB.id),
      listReadyTenantChunks(client.db, tenantA.id),
      searchTenantChunksByKeyword(client.db, tenantA.id, "private policy")
    ]);

    assert.deepEqual(docsA.map((doc) => doc.id), [docA.id]);
    assert.deepEqual(docsB.map((doc) => doc.id), [docB.id]);
    assert.deepEqual(chunksA.map((chunk) => chunk.documentId), [docA.id]);
    assert.ok(keywordA.every((chunk) => chunk.tenantId === tenantA.id));

    await assertCitationsStayTenantScoped(client, tenantA.id, docB.id, chunkB.id);
  } finally {
    await client.db.delete(tenants).where(eq(tenants.id, tenantA.id));
    await client.db.delete(tenants).where(eq(tenants.id, tenantB.id));
    await client.close();
  }
});

const createTenant = async (
  db: ReturnType<typeof createDatabaseClient>["db"],
  name: string
) => {
  const [tenant] = await db
    .insert(tenants)
    .values({ name, slug: `${name.toLowerCase().replaceAll(" ", "-")}-${randomUUID()}` })
    .returning();

  assert.ok(tenant);
  return tenant;
};

const chunkInput = (tenantId: string, documentId: string, content: string) => ({
  chunkIndex: 0,
  content,
  documentId,
  pageNumber: 1,
  tenantId
});

const assertCitationsStayTenantScoped = async (
  client: ReturnType<typeof createDatabaseClient>,
  tenantId: string,
  otherTenantDocumentId: string,
  otherTenantChunkId: string
) => {
  const userId = await createTestUser(client);
  const conversation = await createConversation(client.db, {
    tenantId,
    title: "Isolation check",
    userId
  });
  const message = await createMessage(client.db, {
    content: "answer",
    conversationId: conversation.id,
    role: "assistant",
    tenantId
  });
  const [citation] = await createCitations(client.db, [
    {
      chunkId: otherTenantChunkId,
      documentId: otherTenantDocumentId,
      messageId: message.id,
      pageNumber: 1,
      snippet: "should not leak",
      tenantId
    }
  ]);

  assert.ok(citation);
  assert.equal(await findTenantCitation(client.db, tenantId, citation.id), undefined);
  assert.deepEqual(await listCitationsForMessages(client.db, tenantId, [message.id]), []);
  await client.db.delete(appUsers).where(eq(appUsers.id, userId));
};

const createTestUser = async (
  client: ReturnType<typeof createDatabaseClient>
): Promise<string> => {
  const user = await createUser(client.db, {
    email: `isolation-${randomUUID()}@example.com`,
    name: "Isolation User"
  });

  return user.id;
};
