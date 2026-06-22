import { pgEnum } from "drizzle-orm/pg-core";

export const tenantPlanEnum = pgEnum("tenant_plan", [
  "starter",
  "pro",
  "enterprise"
]);

export const tenantStatusEnum = pgEnum("tenant_status", [
  "active",
  "trialing",
  "suspended"
]);

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "editor",
  "end_user",
  "platform_admin"
]);

export const membershipStatusEnum = pgEnum("membership_status", [
  "invited",
  "active",
  "disabled"
]);

export const documentFormatEnum = pgEnum("document_format", [
  "pdf",
  "docx",
  "txt",
  "md",
  "html"
]);

export const documentStatusEnum = pgEnum("document_status", [
  "queued",
  "parsing",
  "indexing",
  "ready",
  "failed",
  "deleted"
]);

export const messageRoleEnum = pgEnum("message_role", ["user", "assistant"]);

export const usageEventTypeEnum = pgEnum("usage_event_type", [
  "query",
  "document_upload",
  "document_indexed",
  "end_user_invited",
  "citation_clicked",
  "message_feedback"
]);
