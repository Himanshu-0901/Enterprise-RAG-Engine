import { desc, eq } from "drizzle-orm";
import type { Database } from "../client";
import { billingInvoices, tenantBilling } from "../schema";

export type TenantBillingRecord = typeof tenantBilling.$inferSelect;
export type TenantBillingInsert = typeof tenantBilling.$inferInsert;
export type BillingInvoiceRecord = typeof billingInvoices.$inferSelect;
export type BillingInvoiceInsert = typeof billingInvoices.$inferInsert;

export const findTenantBilling = async (
  db: Database,
  tenantId: string
): Promise<TenantBillingRecord | undefined> => {
  const [billing] = await db
    .select()
    .from(tenantBilling)
    .where(eq(tenantBilling.tenantId, tenantId));

  return billing;
};

export const upsertTenantBilling = async (
  db: Database,
  input: TenantBillingInsert
): Promise<TenantBillingRecord> => {
  const [billing] = await db
    .insert(tenantBilling)
    .values(input)
    .onConflictDoUpdate({
      target: tenantBilling.tenantId,
      set: {
        billingStatus: input.billingStatus,
        cancelAtPeriodEnd: input.cancelAtPeriodEnd,
        currentPeriodEndsAt: input.currentPeriodEndsAt,
        stripeCustomerId: input.stripeCustomerId,
        stripeSubscriptionId: input.stripeSubscriptionId,
        trialEndsAt: input.trialEndsAt,
        updatedAt: new Date()
      }
    })
    .returning();

  if (!billing) {
    throw new Error("Failed to upsert tenant billing");
  }

  return billing;
};

export const listTenantInvoices = async (
  db: Database,
  tenantId: string
): Promise<BillingInvoiceRecord[]> =>
  db
    .select()
    .from(billingInvoices)
    .where(eq(billingInvoices.tenantId, tenantId))
    .orderBy(desc(billingInvoices.createdAt));

export const createBillingInvoice = async (
  db: Database,
  input: BillingInvoiceInsert
): Promise<BillingInvoiceRecord> => {
  const [invoice] = await db.insert(billingInvoices).values(input).returning();

  if (!invoice) {
    throw new Error("Failed to create billing invoice");
  }

  return invoice;
};
