import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { vector } from "./common";
import { documentFormatEnum, documentStatusEnum } from "./enums";
import { tenants } from "./tenancy";

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    format: documentFormatEnum("format").notNull(),
    status: documentStatusEnum("status").notNull().default("queued"),
    storageKey: text("storage_key").notNull(),
    pageCount: integer("page_count").notNull().default(0),
    chunkCount: integer("chunk_count").notNull().default(0),
    failureReason: text("failure_reason"),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
    lastIndexedAt: timestamp("last_indexed_at", { withTimezone: true })
  },
  (table) => ({
    tenantStatusIndex: index("documents_tenant_status_idx").on(
      table.tenantId,
      table.status
    )
  })
);

export const documentChunks = pgTable(
  "document_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    chunkIndex: integer("chunk_index").notNull(),
    pageNumber: integer("page_number"),
    sectionTitle: text("section_title"),
    content: text("content").notNull(),
    embedding: vector("embedding"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    tenantDocumentIndex: index("document_chunks_tenant_document_idx").on(
      table.tenantId,
      table.documentId
    )
  })
);
