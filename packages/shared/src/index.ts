export { loadServerEnv } from "./env";
export type { ServerEnv } from "./env";
export { DOCUMENT_INGESTION_QUEUE } from "./ingestion";
export type { DocumentIngestionJob } from "./ingestion";

export type TenantPlan = "starter" | "pro" | "enterprise";

export type TenantStatus = "active" | "trialing" | "suspended";

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  plan: TenantPlan;
  status: TenantStatus;
  documentLimit: number;
  monthlyQueryLimit: number;
};

export type TenantBranding = {
  tenantId: string;
  portalName: string;
  primaryColor: string;
  accentColor: string;
  logoInitials: string;
  welcomeMessage: string;
};

export type UserRole = "admin" | "editor" | "end_user" | "platform_admin";

export type User = {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
  lastSeenAt: string;
};

export type DocumentStatus = "queued" | "parsing" | "indexing" | "ready" | "failed";

export type KnowledgeDocument = {
  id: string;
  tenantId: string;
  name: string;
  format: "pdf" | "docx" | "txt" | "md" | "html";
  status: DocumentStatus;
  pageCount: number;
  chunkCount: number;
  uploadedAt: string;
  lastIndexedAt?: string;
};

export type Citation = {
  id: string;
  documentId: string;
  documentName: string;
  pageNumber: number;
  chunkId: string;
  snippet: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  citations: Citation[];
};

export type UsageMetric = {
  label: string;
  value: string;
  helper: string;
  trend: "up" | "down" | "flat";
};

export type IngestionStep = {
  label: string;
  status: "complete" | "current" | "pending";
};
