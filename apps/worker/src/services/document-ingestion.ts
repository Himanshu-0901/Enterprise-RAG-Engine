import {
  findTenantDocument,
  markDocumentIndexed,
  recordAuditLog,
  recordUsageEvent,
  replaceDocumentChunks,
  updateDocumentStatus,
  type Database
} from "@rag-llm/db";
import {
  chunkParsedDocument,
  type DocumentParser,
  type EmbeddingProvider,
  type SupportedDocumentFormat
} from "@rag-llm/rag";
import type { DocumentIngestionJob, ServerEnv } from "@rag-llm/shared";
import { readObjectBytes } from "./object-storage";

type StoredDocumentInput = {
  bytes: Uint8Array;
  contentType: string;
};

const contentTypes: Record<SupportedDocumentFormat, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  html: "text/html",
  md: "text/markdown",
  pdf: "application/pdf",
  txt: "text/plain"
};

const resolveDocumentInput = async (
  env: ServerEnv,
  job: DocumentIngestionJob
): Promise<StoredDocumentInput> => {
  if (job.content) {
    return {
      bytes: new TextEncoder().encode(job.content),
      contentType: "text/plain"
    };
  }

  if (job.storageKey) {
    return {
      bytes: await readObjectBytes(env, job.storageKey),
      contentType: "application/octet-stream"
    };
  }

  throw new Error("Ingestion job is missing content and storageKey");
};

export const processDocumentIngestion = async (
  db: Database,
  env: ServerEnv,
  embeddingProvider: EmbeddingProvider,
  documentParser: DocumentParser,
  job: DocumentIngestionJob
) => {
  const document = await findTenantDocument(db, job.tenantId, job.documentId);

  if (!document) {
    throw new Error("Document not found for ingestion");
  }

  try {
    await updateDocumentStatus(db, job.tenantId, document.id, "parsing");
    const input = await resolveDocumentInput(env, job);
    const parsedDocument = await documentParser.parse({
      bytes: input.bytes,
      contentType: contentTypes[document.format] ?? input.contentType,
      documentName: document.name,
      format: document.format
    });
    const textChunks = chunkParsedDocument(parsedDocument);
    const embeddings = await embeddingProvider.embedBatch(
      textChunks.map((chunk) => chunk.content)
    );

    const chunks = textChunks.map((chunk, index) => {
      const embedding = embeddings[index];

      if (!embedding) {
        throw new Error(`Missing embedding for chunk ${chunk.chunkIndex}`);
      }

      return {
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        documentId: document.id,
        embedding,
        pageNumber: chunk.pageNumber,
        sectionTitle: chunk.sectionTitle,
        tenantId: job.tenantId
      };
    });

    await updateDocumentStatus(db, job.tenantId, document.id, "indexing");
    await replaceDocumentChunks(db, job.tenantId, document.id, chunks);
    const indexedDocument = await markDocumentIndexed(
      db,
      job.tenantId,
      document.id,
      chunks.length,
      parsedDocument.pageCount
    );

    await recordUsageEvent(db, {
      metadata: {
        chunkCount: chunks.length,
        documentId: document.id,
        pageCount: parsedDocument.pageCount,
        parser: parsedDocument.parser
      },
      quantity: 1,
      tenantId: job.tenantId,
      type: "document_indexed"
    });
    await recordAuditLog(db, {
      action: "document.indexed",
      actorUserId: job.actorUserId,
      metadata: {
        chunkCount: chunks.length,
        pageCount: parsedDocument.pageCount,
        parser: parsedDocument.parser,
        warnings: parsedDocument.warnings.join("; ")
      },
      targetId: document.id,
      targetType: "document",
      tenantId: job.tenantId
    });

    return indexedDocument;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown ingestion error";
    await updateDocumentStatus(db, job.tenantId, document.id, "failed", message);
    throw error;
  }
};
