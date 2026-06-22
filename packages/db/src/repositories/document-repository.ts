import { and, desc, eq, ne, sql } from "drizzle-orm";
import type { Database } from "../client";
import { documentChunks, documents } from "../schema";

export type DocumentRecord = typeof documents.$inferSelect;
export type DocumentInsert = typeof documents.$inferInsert;
export type DocumentChunkInsert = typeof documentChunks.$inferInsert;
export type TenantSourceChunk = {
  id: string;
  tenantId: string;
  documentId: string;
  documentName: string;
  pageNumber: number | null;
  content: string;
  score?: number;
};

const toVectorLiteral = (embedding: number[]): string => `[${embedding.join(",")}]`;

export const createDocument = async (
  db: Database,
  input: DocumentInsert
): Promise<DocumentRecord> => {
  const [document] = await db.insert(documents).values(input).returning();

  if (!document) {
    throw new Error("Failed to create document");
  }

  return document;
};

export const listTenantDocuments = async (
  db: Database,
  tenantId: string
): Promise<DocumentRecord[]> =>
  db
    .select()
    .from(documents)
    .where(eq(documents.tenantId, tenantId))
    .orderBy(desc(documents.uploadedAt));

export const countTenantActiveDocuments = async (
  db: Database,
  tenantId: string
): Promise<number> => {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(documents)
    .where(
      and(eq(documents.tenantId, tenantId), ne(documents.status, "deleted"))
    );

  return row?.count ?? 0;
};

export const findTenantDocument = async (
  db: Database,
  tenantId: string,
  documentId: string
): Promise<DocumentRecord | undefined> => {
  const [document] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.tenantId, tenantId), eq(documents.id, documentId)));

  return document;
};

export const updateDocumentStatus = async (
  db: Database,
  tenantId: string,
  documentId: string,
  status: DocumentRecord["status"],
  failureReason?: string
): Promise<DocumentRecord> => {
  const [document] = await db
    .update(documents)
    .set({ failureReason, status })
    .where(and(eq(documents.tenantId, tenantId), eq(documents.id, documentId)))
    .returning();

  if (!document) {
    throw new Error("Tenant document not found");
  }

  return document;
};

export const markDocumentIndexed = async (
  db: Database,
  tenantId: string,
  documentId: string,
  chunkCount: number,
  pageCount: number
): Promise<DocumentRecord> => {
  const [document] = await db
    .update(documents)
    .set({
      chunkCount,
      failureReason: null,
      lastIndexedAt: new Date(),
      pageCount,
      status: "ready"
    })
    .where(and(eq(documents.tenantId, tenantId), eq(documents.id, documentId)))
    .returning();

  if (!document) {
    throw new Error("Tenant document not found");
  }

  return document;
};

export const createDocumentChunks = async (
  db: Database,
  chunks: DocumentChunkInsert[]
) => {
  if (chunks.length === 0) {
    return [];
  }

  return db.insert(documentChunks).values(chunks).returning();
};

export const replaceDocumentChunks = async (
  db: Database,
  tenantId: string,
  documentId: string,
  chunks: DocumentChunkInsert[]
) => {
  await db
    .delete(documentChunks)
    .where(
      and(
        eq(documentChunks.tenantId, tenantId),
        eq(documentChunks.documentId, documentId)
      )
    );

  return createDocumentChunks(db, chunks);
};

export const listReadyTenantChunks = async (
  db: Database,
  tenantId: string,
  limit = 100
): Promise<TenantSourceChunk[]> =>
  db
    .select({
      id: documentChunks.id,
      tenantId: documentChunks.tenantId,
      documentId: documentChunks.documentId,
      documentName: documents.name,
      pageNumber: documentChunks.pageNumber,
      content: documentChunks.content
    })
    .from(documentChunks)
    .innerJoin(documents, eq(documentChunks.documentId, documents.id))
    .where(
      and(
        eq(documentChunks.tenantId, tenantId),
        eq(documents.tenantId, tenantId),
        eq(documents.status, "ready")
      )
    )
    .orderBy(desc(documentChunks.createdAt))
    .limit(limit);

export const searchTenantChunksByEmbedding = async (
  db: Database,
  tenantId: string,
  embedding: number[],
  limit = 5
): Promise<TenantSourceChunk[]> => {
  const queryVector = toVectorLiteral(embedding);
  const distance = sql<number>`${documentChunks.embedding} <=> ${queryVector}::vector`;

  const rows = await db
    .select({
      id: documentChunks.id,
      tenantId: documentChunks.tenantId,
      documentId: documentChunks.documentId,
      documentName: documents.name,
      pageNumber: documentChunks.pageNumber,
      content: documentChunks.content,
      score: sql<number>`1 - (${distance})`
    })
    .from(documentChunks)
    .innerJoin(documents, eq(documentChunks.documentId, documents.id))
    .where(
      and(
        eq(documentChunks.tenantId, tenantId),
        eq(documents.tenantId, tenantId),
        eq(documents.status, "ready"),
        sql`${documentChunks.embedding} IS NOT NULL`
      )
    )
    .orderBy(distance)
    .limit(limit);

  return rows.map((row) => ({
    ...row,
    score: Number(row.score)
  }));
};

export const searchTenantChunksByKeyword = async (
  db: Database,
  tenantId: string,
  query: string,
  limit = 10
): Promise<TenantSourceChunk[]> => {
  const documentVector = sql`to_tsvector('english', ${documentChunks.content})`;
  const searchQuery = sql`websearch_to_tsquery('english', ${query})`;
  const rank = sql<number>`ts_rank_cd(${documentVector}, ${searchQuery})`;

  const rows = await db
    .select({
      id: documentChunks.id,
      tenantId: documentChunks.tenantId,
      documentId: documentChunks.documentId,
      documentName: documents.name,
      pageNumber: documentChunks.pageNumber,
      content: documentChunks.content,
      score: rank
    })
    .from(documentChunks)
    .innerJoin(documents, eq(documentChunks.documentId, documents.id))
    .where(
      and(
        eq(documentChunks.tenantId, tenantId),
        eq(documents.tenantId, tenantId),
        eq(documents.status, "ready"),
        sql`${documentVector} @@ ${searchQuery}`
      )
    )
    .orderBy(sql`${rank} DESC`)
    .limit(limit);

  return rows.map((row) => ({
    ...row,
    score: Number(row.score)
  }));
};
