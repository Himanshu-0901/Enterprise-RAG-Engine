import {
  findTenantBilling,
  listTenantInvoices,
  upsertTenantBilling,
  type Database,
  type TenantBillingRecord,
  type TenantRecord
} from "@rag-llm/db";
import { getTenantQuotaSnapshot } from "./quota";

export type BillingOverview = {
  billing: TenantBillingRecord;
  checkoutUrl: string;
  invoices: Awaited<ReturnType<typeof listTenantInvoices>>;
  quota: Awaited<ReturnType<typeof getTenantQuotaSnapshot>>;
  tenant: TenantRecord;
};

const addDays = (date: Date, days: number): Date =>
  new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

export const ensureTenantBilling = async (
  db: Database,
  tenant: TenantRecord
): Promise<TenantBillingRecord> => {
  const existing = await findTenantBilling(db, tenant.id);

  if (existing) {
    return existing;
  }

  return upsertTenantBilling(db, {
    billingStatus: tenant.status === "trialing" ? "trialing" : "active",
    cancelAtPeriodEnd: false,
    currentPeriodEndsAt: addDays(new Date(), 30),
    stripeCustomerId: `cus_dev_${tenant.id.slice(0, 8)}`,
    stripeSubscriptionId: `sub_dev_${tenant.id.slice(0, 8)}`,
    tenantId: tenant.id,
    trialEndsAt: tenant.status === "trialing" ? addDays(new Date(), 14) : null
  });
};

export const getBillingOverview = async (
  db: Database,
  tenant: TenantRecord
): Promise<BillingOverview> => {
  const [billing, invoices, quota] = await Promise.all([
    ensureTenantBilling(db, tenant),
    listTenantInvoices(db, tenant.id),
    getTenantQuotaSnapshot(db, tenant.id)
  ]);

  return {
    billing,
    checkoutUrl: `/billing/dev-checkout?tenant=${tenant.id}&plan=${tenant.plan}`,
    invoices,
    quota,
    tenant
  };
};
