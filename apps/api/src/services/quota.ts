import {
  countTenantActiveDocuments,
  findTenantById,
  sumTenantUsageSince,
  type Database
} from "@rag-llm/db";
import { limitExceeded, notFound } from "../lib/api-error";

export type TenantQuotaSnapshot = {
  documentLimit: number;
  activeDocumentCount: number;
  documentUsageState: UsageState;
  monthlyQueryLimit: number;
  queryUsageState: UsageState;
  queryCountThisMonth: number;
  monthStartsAt: string;
};

export type UsageState = "ok" | "soft_warning" | "hard_limit";

const currentMonthStart = (): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
};

const usageState = (used: number, limit: number): UsageState => {
  if (limit <= 0 || used >= limit) {
    return "hard_limit";
  }

  return used / limit >= 0.8 ? "soft_warning" : "ok";
};

export const getTenantQuotaSnapshot = async (
  db: Database,
  tenantId: string
): Promise<TenantQuotaSnapshot> => {
  const tenant = await findTenantById(db, tenantId);

  if (!tenant) {
    throw notFound("Tenant not found");
  }

  const monthStart = currentMonthStart();
  const [activeDocumentCount, queryCountThisMonth] = await Promise.all([
    countTenantActiveDocuments(db, tenantId),
    sumTenantUsageSince(db, tenantId, "query", monthStart)
  ]);

  return {
    activeDocumentCount,
    documentLimit: tenant.documentLimit,
    documentUsageState: usageState(activeDocumentCount, tenant.documentLimit),
    monthStartsAt: monthStart.toISOString(),
    monthlyQueryLimit: tenant.monthlyQueryLimit,
    queryUsageState: usageState(queryCountThisMonth, tenant.monthlyQueryLimit),
    queryCountThisMonth
  };
};

export const enforceDocumentQuota = async (
  db: Database,
  tenantId: string
): Promise<void> => {
  const quota = await getTenantQuotaSnapshot(db, tenantId);

  if (quota.activeDocumentCount >= quota.documentLimit) {
    throw limitExceeded(
      `Document limit reached (${quota.activeDocumentCount}/${quota.documentLimit}). Delete a document or upgrade the tenant plan.`
    );
  }
};

export const enforceMonthlyQueryQuota = async (
  db: Database,
  tenantId: string
): Promise<void> => {
  const quota = await getTenantQuotaSnapshot(db, tenantId);

  if (quota.queryCountThisMonth >= quota.monthlyQueryLimit) {
    throw limitExceeded(
      `Monthly query limit reached (${quota.queryCountThisMonth}/${quota.monthlyQueryLimit}). Upgrade the tenant plan to continue.`
    );
  }
};
