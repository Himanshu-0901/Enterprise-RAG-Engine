import {
  createDocument,
  findTenantDocument,
  listTenantDocuments,
  recordAuditLog,
  updateDocumentStatus
} from "@rag-llm/db";
import { Hono } from "hono";
import { z } from "zod";
import { requireTenantRole } from "../lib/auth";
import { badRequest, notFound } from "../lib/api-error";
import type { ApiContext } from "../lib/context";
import { ok, parseJsonBody } from "../lib/http";
import { uploadObject } from "../services/object-storage";
import { enforceDocumentQuota } from "../services/quota";
import { readSourceFile } from "../services/source-file";

const createDocumentSchema = z.object({
  name: z.string().min(1),
  format: z.enum(["pdf", "docx", "txt", "md", "html"]),
  storageKey: z.string().min(1).optional(),
  pageCount: z.number().int().min(0).default(0),
  content: z.string().min(1).optional()
});

const updateDocumentStatusSchema = z.object({
  status: z.enum(["queued", "parsing", "indexing", "ready", "failed", "deleted"]),
  failureReason: z.string().optional()
});

const ingestDocumentSchema = z.object({
  content: z.string().min(1)
});

export const documentRoutes = new Hono<ApiContext>();

documentRoutes.use("*", requireTenantRole(["admin", "editor"]));

documentRoutes.get("/", async (context) => {
  const documents = await listTenantDocuments(
    context.get("db"),
    context.get("tenantId")
  );

  return context.json(ok(documents));
});

documentRoutes.post("/", async (context) => {
  const body = await parseJsonBody(context, createDocumentSchema);
  const { content, ...documentInput } = body;
  const tenantId = context.get("tenantId");
  await enforceDocumentQuota(context.get("db"), tenantId);
  const storageKey =
    content && !documentInput.storageKey
      ? `tenants/${tenantId}/documents/${Date.now()}-${documentInput.name}`
      : documentInput.storageKey;

  if (!storageKey) {
    throw badRequest("storageKey is required when content is not provided");
  }

  if (content) {
    await uploadObject(context.get("env"), {
      body: new TextEncoder().encode(content),
      contentType: documentInput.format === "md" ? "text/markdown" : "text/plain",
      key: storageKey
    });
  }

  const document = await createDocument(context.get("db"), {
    ...documentInput,
    storageKey,
    tenantId
  });

  if (!content) {
    return context.json(ok(document), 201);
  }

  await context.get("ingestionQueue").enqueueDocument({
    actorUserId: context.get("userId"),
    documentId: document.id,
    storageKey,
    tenantId
  });

  return context.json(ok(document), 202);
});

documentRoutes.post("/upload", async (context) => {
  const body = await context.req.parseBody();
  const file = body.file;

  if (!(file instanceof File)) {
    throw badRequest("Upload field 'file' is required");
  }

  const tenantId = context.get("tenantId");
  const db = context.get("db");
  await enforceDocumentQuota(db, tenantId);
  const sourceFile = await readSourceFile(file);
  const storageKey = `tenants/${tenantId}/documents/${Date.now()}-${sourceFile.name}`;

  await uploadObject(context.get("env"), {
    body: sourceFile.bytes,
    contentType: sourceFile.contentType,
    key: storageKey
  });

  const document = await createDocument(db, {
    format: sourceFile.format,
    name: sourceFile.name,
    storageKey,
    tenantId
  });
  await context.get("ingestionQueue").enqueueDocument({
    actorUserId: context.get("userId"),
    documentId: document.id,
    storageKey,
    tenantId
  });

  return context.json(ok(document), 202);
});

documentRoutes.get("/:documentId", async (context) => {
  const document = await findTenantDocument(
    context.get("db"),
    context.get("tenantId"),
    context.req.param("documentId")
  );

  if (!document) {
    throw notFound("Document not found");
  }

  return context.json(ok(document));
});

documentRoutes.patch("/:documentId/status", async (context) => {
  const body = await parseJsonBody(context, updateDocumentStatusSchema);
  const document = await updateDocumentStatus(
    context.get("db"),
    context.get("tenantId"),
    context.req.param("documentId"),
    body.status,
    body.failureReason
  );

  return context.json(ok(document));
});

documentRoutes.post("/:documentId/reindex", async (context) => {
  const tenantId = context.get("tenantId");
  const document = await findTenantDocument(
    context.get("db"),
    tenantId,
    context.req.param("documentId")
  );

  if (!document || document.status === "deleted") {
    throw notFound("Document not found");
  }

  const queuedDocument = await updateDocumentStatus(
    context.get("db"),
    tenantId,
    document.id,
    "queued"
  );
  await context.get("ingestionQueue").enqueueDocument({
    actorUserId: context.get("userId"),
    documentId: document.id,
    storageKey: document.storageKey,
    tenantId
  });
  await recordAuditLog(context.get("db"), {
    action: "document.reindexed",
    actorUserId: context.get("userId"),
    metadata: { documentName: document.name },
    targetId: document.id,
    targetType: "document",
    tenantId
  });

  return context.json(ok(queuedDocument), 202);
});

documentRoutes.post("/:documentId/restore", async (context) => {
  const tenantId = context.get("tenantId");
  const document = await findTenantDocument(
    context.get("db"),
    tenantId,
    context.req.param("documentId")
  );

  if (!document) {
    throw notFound("Document not found");
  }

  if (document.status === "deleted") {
    await enforceDocumentQuota(context.get("db"), tenantId);
  }

  const queuedDocument = await updateDocumentStatus(
    context.get("db"),
    tenantId,
    document.id,
    "queued"
  );
  await context.get("ingestionQueue").enqueueDocument({
    actorUserId: context.get("userId"),
    documentId: document.id,
    storageKey: document.storageKey,
    tenantId
  });
  await recordAuditLog(context.get("db"), {
    action: "document.restored",
    actorUserId: context.get("userId"),
    metadata: { documentName: document.name },
    targetId: document.id,
    targetType: "document",
    tenantId
  });

  return context.json(ok(queuedDocument), 202);
});

documentRoutes.delete("/:documentId", async (context) => {
  const tenantId = context.get("tenantId");
  const document = await findTenantDocument(
    context.get("db"),
    tenantId,
    context.req.param("documentId")
  );

  if (!document) {
    throw notFound("Document not found");
  }

  const deletedDocument = await updateDocumentStatus(
    context.get("db"),
    tenantId,
    document.id,
    "deleted"
  );
  await recordAuditLog(context.get("db"), {
    action: "document.deleted",
    actorUserId: context.get("userId"),
    metadata: { documentName: document.name },
    targetId: document.id,
    targetType: "document",
    tenantId
  });

  return context.json(ok(deletedDocument));
});

documentRoutes.post("/:documentId/ingest", async (context) => {
  const body = await parseJsonBody(context, ingestDocumentSchema);
  const tenantId = context.get("tenantId");
  const document = await findTenantDocument(
    context.get("db"),
    tenantId,
    context.req.param("documentId")
  );

  if (!document) {
    throw notFound("Document not found");
  }

  await context.get("ingestionQueue").enqueueDocument({
    actorUserId: context.get("userId"),
    content: body.content,
    documentId: document.id,
    tenantId
  });

  return context.json(ok(document), 202);
});
