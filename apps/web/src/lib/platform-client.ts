import type { ApiSession, AuditLog } from "./api-client";
import type { TenantPlan } from "./billing-client";
import { request } from "./http-client";

export type PlatformTenantStatus = "active" | "suspended" | "trialing";

export type FeatureFlag = {
  id: string;
  tenantId: string;
  key: string;
  enabled: boolean;
  rolloutPercentage: number;
  updatedAt: string;
};

export type PlatformTenantRow = {
  documents: number;
  flags: FeatureFlag[];
  members: number;
  queriesThisMonth: number;
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: TenantPlan;
    status: PlatformTenantStatus;
    documentLimit: number;
    monthlyQueryLimit: number;
    createdAt: string;
  };
};

export type AbuseReview = {
  id: string;
  tenantId: string | null;
  severity: string;
  status: "dismissed" | "open" | "resolved";
  summary: string;
  createdAt: string;
  resolvedAt: string | null;
};

export const platformClient = {
  listAbuseReviews: (session: ApiSession) =>
    request<AbuseReview[]>("/platform/abuse-reviews", {}, session),
  listAudit: (session: ApiSession) =>
    request<AuditLog[]>("/platform/audit", {}, session),
  listTenants: (session: ApiSession, query = "") =>
    request<PlatformTenantRow[]>(
      `/platform/tenants${query ? `?q=${encodeURIComponent(query)}` : ""}`,
      {},
      session
    ),
  setAbuseReviewStatus: (
    session: ApiSession,
    reviewId: string,
    status: AbuseReview["status"]
  ) =>
    request<AbuseReview>(
      `/platform/abuse-reviews/${reviewId}`,
      { body: JSON.stringify({ status }), method: "PATCH" },
      session
    ),
  setFeatureFlag: (
    session: ApiSession,
    tenantId: string,
    input: { enabled: boolean; key: string; rolloutPercentage: number }
  ) =>
    request<FeatureFlag>(
      `/platform/tenants/${tenantId}/flags`,
      { body: JSON.stringify(input), method: "PUT" },
      session
    ),
  setTenantPlan: (session: ApiSession, tenantId: string, plan: TenantPlan) =>
    request<PlatformTenantRow["tenant"]>(
      `/platform/tenants/${tenantId}/plan`,
      { body: JSON.stringify({ plan }), method: "PATCH" },
      session
    ),
  setTenantStatus: (
    session: ApiSession,
    tenantId: string,
    status: PlatformTenantStatus
  ) =>
    request<PlatformTenantRow["tenant"]>(
      `/platform/tenants/${tenantId}/status`,
      { body: JSON.stringify({ status }), method: "PATCH" },
      session
    )
};
