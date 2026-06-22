import { request } from "./http-client";

export type ApiSession = {
  role?: ApiMemberRole | "platform_admin";
  tenantId: string;
  token?: string;
  userId: string;
};

export type ApiDocument = {
  id: string;
  tenantId: string;
  name: string;
  format: "pdf" | "docx" | "txt" | "md" | "html";
  status: "queued" | "parsing" | "indexing" | "ready" | "failed" | "deleted";
  storageKey: string;
  pageCount: number;
  chunkCount: number;
  failureReason: string | null;
  uploadedAt: string;
  lastIndexedAt: string | null;
};

export type ApiMember = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor" | "end_user" | "platform_admin";
  status: "invited" | "active" | "disabled";
  lastSeenAt: string | null;
};

export type ApiMemberRole = "admin" | "editor" | "end_user";
export type ApiMemberStatus = "invited" | "active" | "disabled";

export type ApiTenantBranding = {
  tenantId: string;
  portalName: string;
  primaryColor: string;
  accentColor: string;
  logoObjectKey: string | null;
  welcomeMessage: string;
  createdAt: string;
  updatedAt: string;
};

export type ApiTenantSettings = {
  tenantId: string;
  dataRetentionDays: number;
  allowSourceDownload: boolean;
  allowAnswerExport: boolean;
  requireCitations: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AnalyticsUsage = {
  quota: {
    activeDocumentCount: number;
    documentLimit: number;
    documentUsageState: "hard_limit" | "ok" | "soft_warning";
    monthlyQueryLimit: number;
    monthStartsAt: string;
    queryUsageState: "hard_limit" | "ok" | "soft_warning";
    queryCountThisMonth: number;
  };
  summary: Record<string, number>;
  events: Array<{
    id: string;
    type: string;
    quantity: number;
    createdAt: string;
    metadata: Record<string, string | number | boolean>;
  }>;
};

export type AuditLog = {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  createdAt: string;
};

export type ShardRoute = {
  bucket: number;
  shardKey: string;
  tenantId: string;
};

export type ApiCitation = {
  chunkId?: string;
  documentId?: string;
  documentName: string;
  documentStorageKey?: string;
  id: string;
  pageNumber: number | null;
  snippet: string;
};

export type ApiConversation = {
  id: string;
  tenantId: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type ApiConversationMessage = {
  id: string;
  tenantId: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  citations: ApiCitation[];
};

export type ChatResponse = {
  confidence: "low" | "medium" | "high";
  conversationId: string;
  retrieval?: RetrievalDiagnostics;
  usage?: LlmUsage;
  message: {
    id: string;
    role: "assistant";
    content: string;
    createdAt: string;
    citations: ApiCitation[];
  };
};

export type LlmUsage = {
  estimatedCostUsd: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type RetrievalDiagnostics = {
  confidence: "low" | "medium" | "high";
  fusedMatches: number;
  keywordMatches: number;
  rerankedMatches: number;
  topScore: number;
  vectorMatches: number;
};

export const apiClient = {
  askQuestion: (session: ApiSession, question: string, conversationId?: string) =>
    request<ChatResponse>(
      "/chat",
      { body: JSON.stringify({ conversationId, question }), method: "POST" },
      session
    ),
  createDocument: (
    session: ApiSession,
    input: { content: string; format: "txt" | "md"; name: string }
  ) =>
    request<ApiDocument>(
      "/documents",
      {
        body: JSON.stringify(input),
        method: "POST"
      },
      session
    ),
  uploadSourceFile: (session: ApiSession, file: File) => {
    const body = new FormData();
    body.set("file", file);

    return request<ApiDocument>(
      "/documents/upload",
      { body, method: "POST" },
      session
    );
  },
  listAuditLogs: (session: ApiSession) =>
    request<AuditLog[]>("/analytics/audit", {}, session),
  listDocuments: (session: ApiSession) =>
    request<ApiDocument[]>("/documents", {}, session),
  reindexDocument: (session: ApiSession, documentId: string) =>
    request<ApiDocument>(
      `/documents/${documentId}/reindex`,
      { method: "POST" },
      session
    ),
  restoreDocument: (session: ApiSession, documentId: string) =>
    request<ApiDocument>(
      `/documents/${documentId}/restore`,
      { method: "POST" },
      session
    ),
  deleteDocument: (session: ApiSession, documentId: string) =>
    request<ApiDocument>(
      `/documents/${documentId}`,
      { method: "DELETE" },
      session
    ),
  getTenantBranding: (session: ApiSession) =>
    request<ApiTenantBranding>("/tenants/current/branding", {}, session),
  getTenantSettings: (session: ApiSession) =>
    request<ApiTenantSettings>("/settings/current", {}, session),
  updateTenantSettings: (
    session: ApiSession,
    input: Omit<ApiTenantSettings, "createdAt" | "tenantId" | "updatedAt">
  ) =>
    request<ApiTenantSettings>(
      "/settings/current",
      { body: JSON.stringify(input), method: "PUT" },
      session
    ),
  exportTenantData: (session: ApiSession) =>
    request<Record<string, unknown>>("/settings/current/export", {}, session),
  deleteTenant: (session: ApiSession, confirmation: string) =>
    request<{ deletedObjects: number; tenantId: string }>(
      "/settings/current",
      { body: JSON.stringify({ confirmation }), method: "DELETE" },
      session
    ),
  updateTenantBranding: (
    session: ApiSession,
    input: {
      accentColor: string;
      logoObjectKey?: string;
      portalName: string;
      primaryColor: string;
      welcomeMessage: string;
    }
  ) =>
    request<ApiTenantBranding>(
      "/tenants/current/branding",
      { body: JSON.stringify(input), method: "PUT" },
      session
    ),
  listConversations: (session: ApiSession) =>
    request<ApiConversation[]>("/conversations", {}, session),
  getConversation: (session: ApiSession, conversationId: string) =>
    request<{
      conversation: ApiConversation;
      messages: ApiConversationMessage[];
    }>(`/conversations/${conversationId}`, {}, session),
  renameConversation: (
    session: ApiSession,
    conversationId: string,
    title: string
  ) =>
    request<ApiConversation>(
      `/conversations/${conversationId}`,
      { body: JSON.stringify({ title }), method: "PATCH" },
      session
    ),
  deleteConversation: (session: ApiSession, conversationId: string) =>
    request<{ deleted: boolean }>(
      `/conversations/${conversationId}`,
      { method: "DELETE" },
      session
    ),
  recordCitationClick: (session: ApiSession, citationId: string) =>
    request<ApiCitation>(
      `/chat/citations/${citationId}/click`,
      { method: "POST" },
      session
    ),
  listUsage: (session: ApiSession) =>
    request<AnalyticsUsage>("/analytics/usage", {}, session),
  getShardRoute: (session: ApiSession) =>
    request<ShardRoute>("/analytics/shard", {}, session)
};
