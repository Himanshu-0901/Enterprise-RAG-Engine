import type { ApiSession, AnalyticsUsage } from "./api-client";
import { request } from "./http-client";

export type TenantPlan = "enterprise" | "pro" | "starter";

export type BillingTenant = {
  id: string;
  name: string;
  plan: TenantPlan;
  status: "active" | "suspended" | "trialing";
  documentLimit: number;
  monthlyQueryLimit: number;
};

export type TenantBilling = {
  billingStatus: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEndsAt: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  trialEndsAt: string | null;
};

export type BillingInvoice = {
  id: string;
  plan: TenantPlan;
  status: string;
  amountDueCents: number;
  amountPaidCents: number;
  hostedInvoiceUrl: string | null;
  periodStartsAt: string | null;
  periodEndsAt: string | null;
  createdAt: string;
};

export type BillingOverview = {
  billing: TenantBilling;
  checkoutUrl: string;
  invoices: BillingInvoice[];
  quota: AnalyticsUsage["quota"];
  tenant: BillingTenant;
};

export const billingClient = {
  checkout: (session: ApiSession, plan: TenantPlan) =>
    request<{ checkoutUrl: string }>(
      "/billing/checkout",
      { body: JSON.stringify({ plan }), method: "POST" },
      session
    ),
  getOverview: (session: ApiSession) =>
    request<BillingOverview>("/billing/current", {}, session)
};
