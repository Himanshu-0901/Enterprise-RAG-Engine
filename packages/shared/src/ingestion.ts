export const DOCUMENT_INGESTION_QUEUE = "document-ingestion";

export type DocumentIngestionJob = {
  actorUserId: string;
  content?: string;
  documentId: string;
  storageKey?: string;
  tenantId: string;
};
