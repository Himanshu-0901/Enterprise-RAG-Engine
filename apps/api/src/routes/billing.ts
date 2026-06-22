import {
  createBillingInvoice,
  findTenantById,
  recordAuditLog,
  updateTenantPlanAndLimits,
  upsertTenantBilling
} from "@rag-llm/db";
import { Hono } from "hono";
import { z } from "zod";
import { notFound } from "../lib/api-error";
import { requireTenantRole } from "../lib/auth";
import type { ApiContext } from "../lib/context";
import { ok, parseJsonBody } from "../lib/http";
import { ensureTenantBilling, getBillingOverview } from "../services/billing";
import { getPlanLimits } from "../services/plan-limits";
import { createCheckoutSession } from "../services/stripe-checkout";

const checkoutSchema = z.object({
  plan: z.enum(["starter", "pro", "enterprise"])
});

const planPriceCents = {
  enterprise: 149900,
  pro: 29900,
  starter: 9900
};

const addDays = (date: Date, days: number): Date =>
  new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

export const billingRoutes = new Hono<ApiContext>();

billingRoutes.use("*", requireTenantRole(["admin"]));

billingRoutes.get("/current", async (context) => {
  const tenant = await findTenantById(context.get("db"), context.get("tenantId"));

  if (!tenant) {
    throw notFound("Tenant not found");
  }

  return context.json(ok(await getBillingOverview(context.get("db"), tenant)));
});

billingRoutes.post("/checkout", async (context) => {
  const body = await parseJsonBody(context, checkoutSchema);
  const db = context.get("db");
  const tenantId = context.get("tenantId");
  const tenant = await findTenantById(db, tenantId);

  if (!tenant) {
    throw notFound("Tenant not found");
  }

  const currentPeriodEndsAt = addDays(new Date(), 30);
  const existingBilling = await ensureTenantBilling(db, tenant);
  const checkout = await createCheckoutSession({
    billing: existingBilling,
    env: context.get("env"),
    plan: body.plan,
    tenant
  });

  if (checkout.mode === "stripe") {
    await recordAuditLog(db, {
      action: "billing.checkout_started",
      actorUserId: context.get("userId"),
      metadata: { plan: body.plan },
      targetId: tenantId,
      targetType: "tenant",
      tenantId
    });

    return context.json(ok(checkout));
  }

  const limits = getPlanLimits(body.plan);
  await updateTenantPlanAndLimits(db, tenantId, {
    ...limits,
    plan: body.plan
  });
  const billing = await upsertTenantBilling(db, {
    ...existingBilling,
    billingStatus: "active",
    currentPeriodEndsAt,
    tenantId
  });
  await createBillingInvoice(db, {
    amountDueCents: planPriceCents[body.plan],
    amountPaidCents: planPriceCents[body.plan],
    hostedInvoiceUrl: `/billing/dev-invoice/${tenantId}`,
    periodEndsAt: currentPeriodEndsAt,
    periodStartsAt: new Date(),
    plan: body.plan,
    status: "paid",
    stripeInvoiceId: `in_dev_${tenantId.slice(0, 8)}_${Date.now()}`,
    tenantId
  });
  await recordAuditLog(db, {
    action: "billing.plan_changed",
    actorUserId: context.get("userId"),
    metadata: { plan: body.plan },
    targetId: tenantId,
    targetType: "tenant",
    tenantId
  });

  return context.json(ok({ billing, checkoutUrl: checkout.checkoutUrl }));
});
