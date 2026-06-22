import type {
  ChatMessage,
  IngestionStep,
  KnowledgeDocument,
  Tenant,
  TenantBranding,
  UsageMetric,
  User
} from "@rag-llm/shared";

export const tenant: Tenant = {
  id: "tenant-acme",
  name: "Acme Advisory",
  slug: "acme",
  plan: "pro",
  status: "trialing",
  documentLimit: 250,
  monthlyQueryLimit: 10000
};

export const branding: TenantBranding = {
  tenantId: tenant.id,
  portalName: "Acme Knowledge Assistant",
  primaryColor: "#1f4e79",
  accentColor: "#48a0dc",
  logoInitials: "AA",
  welcomeMessage: "Ask a question about Acme policies, playbooks, or client guides."
};

export const users: User[] = [
  {
    id: "user-1",
    tenantId: tenant.id,
    name: "Maya Chen",
    email: "maya@acme.example",
    role: "admin",
    lastSeenAt: "2026-04-30T09:30:00.000Z"
  },
  {
    id: "user-2",
    tenantId: tenant.id,
    name: "Jordan Lee",
    email: "jordan@client.example",
    role: "end_user",
    lastSeenAt: "2026-04-29T18:15:00.000Z"
  }
];

export const documents: KnowledgeDocument[] = [
  {
    id: "doc-1",
    tenantId: tenant.id,
    name: "Client Onboarding Playbook.pdf",
    format: "pdf",
    status: "ready",
    pageCount: 42,
    chunkCount: 318,
    uploadedAt: "2026-04-29T10:20:00.000Z",
    lastIndexedAt: "2026-04-29T10:23:00.000Z"
  },
  {
    id: "doc-2",
    tenantId: tenant.id,
    name: "Support Escalation Policy.md",
    format: "md",
    status: "ready",
    pageCount: 6,
    chunkCount: 48,
    uploadedAt: "2026-04-29T11:00:00.000Z",
    lastIndexedAt: "2026-04-29T11:01:00.000Z"
  },
  {
    id: "doc-3",
    tenantId: tenant.id,
    name: "2026 Service Catalog.docx",
    format: "docx",
    status: "indexing",
    pageCount: 18,
    chunkCount: 0,
    uploadedAt: "2026-04-30T08:10:00.000Z"
  }
];

export const usageMetrics: UsageMetric[] = [
  {
    label: "Queries this month",
    value: "1,284",
    helper: "13% of Pro plan limit",
    trend: "up"
  },
  {
    label: "Active end users",
    value: "42",
    helper: "8 joined this week",
    trend: "up"
  },
  {
    label: "Citation CTR",
    value: "31%",
    helper: "Above 25% target",
    trend: "flat"
  },
  {
    label: "Refusal rate",
    value: "5.4%",
    helper: "Below 8% target",
    trend: "down"
  }
];

export const ingestionSteps: IngestionStep[] = [
  { label: "Upload original file", status: "complete" },
  { label: "Parse text and metadata", status: "complete" },
  { label: "Chunk document", status: "current" },
  { label: "Embed and index", status: "pending" }
];

export const initialMessages: ChatMessage[] = [
  {
    id: "message-1",
    role: "assistant",
    content: branding.welcomeMessage,
    createdAt: "2026-04-30T08:45:00.000Z",
    citations: []
  }
];
