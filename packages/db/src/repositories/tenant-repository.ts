import { asc, eq } from "drizzle-orm";
import type { Database } from "../client";
import { tenantBranding, tenantSettings, tenants } from "../schema";

export type TenantRecord = typeof tenants.$inferSelect;
export type TenantInsert = typeof tenants.$inferInsert;
export type TenantBrandingRecord = typeof tenantBranding.$inferSelect;
export type TenantBrandingInsert = typeof tenantBranding.$inferInsert;
export type TenantSettingsRecord = typeof tenantSettings.$inferSelect;
export type TenantSettingsInsert = typeof tenantSettings.$inferInsert;

export const createTenant = async (
  db: Database,
  input: TenantInsert
): Promise<TenantRecord> => {
  const [tenant] = await db.insert(tenants).values(input).returning();

  if (!tenant) {
    throw new Error("Failed to create tenant");
  }

  return tenant;
};

export const findTenantById = async (
  db: Database,
  tenantId: string
): Promise<TenantRecord | undefined> => {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId));
  return tenant;
};

export const findTenantBySlug = async (
  db: Database,
  slug: string
): Promise<TenantRecord | undefined> => {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug));
  return tenant;
};

export const listTenants = async (db: Database): Promise<TenantRecord[]> =>
  db.select().from(tenants).orderBy(asc(tenants.name));

export const deleteTenant = async (
  db: Database,
  tenantId: string
): Promise<TenantRecord> => {
  const [tenant] = await db
    .delete(tenants)
    .where(eq(tenants.id, tenantId))
    .returning();

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  return tenant;
};

export const updateTenantPlanAndLimits = async (
  db: Database,
  tenantId: string,
  input: Pick<TenantRecord, "documentLimit" | "monthlyQueryLimit" | "plan">
): Promise<TenantRecord> => {
  const [tenant] = await db
    .update(tenants)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(tenants.id, tenantId))
    .returning();

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  return tenant;
};

export const updateTenantStatus = async (
  db: Database,
  tenantId: string,
  status: TenantRecord["status"]
): Promise<TenantRecord> => {
  const [tenant] = await db
    .update(tenants)
    .set({ status, updatedAt: new Date() })
    .where(eq(tenants.id, tenantId))
    .returning();

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  return tenant;
};

export const findTenantBranding = async (
  db: Database,
  tenantId: string
): Promise<TenantBrandingRecord | undefined> => {
  const [branding] = await db
    .select()
    .from(tenantBranding)
    .where(eq(tenantBranding.tenantId, tenantId));

  return branding;
};

export const upsertTenantBranding = async (
  db: Database,
  input: TenantBrandingInsert
): Promise<TenantBrandingRecord> => {
  const [branding] = await db
    .insert(tenantBranding)
    .values(input)
    .onConflictDoUpdate({
      target: tenantBranding.tenantId,
      set: {
        accentColor: input.accentColor,
        logoObjectKey: input.logoObjectKey,
        portalName: input.portalName,
        primaryColor: input.primaryColor,
        updatedAt: new Date(),
        welcomeMessage: input.welcomeMessage
      }
    })
    .returning();

  if (!branding) {
    throw new Error("Failed to upsert tenant branding");
  }

  return branding;
};

const defaultTenantSettings = (tenantId: string): TenantSettingsRecord => ({
  allowAnswerExport: true,
  allowSourceDownload: false,
  createdAt: new Date(0),
  dataRetentionDays: 365,
  requireCitations: true,
  tenantId,
  updatedAt: new Date(0)
});

export const findTenantSettings = async (
  db: Database,
  tenantId: string
): Promise<TenantSettingsRecord> => {
  const [settings] = await db
    .select()
    .from(tenantSettings)
    .where(eq(tenantSettings.tenantId, tenantId));

  return settings ?? defaultTenantSettings(tenantId);
};

export const upsertTenantSettings = async (
  db: Database,
  input: TenantSettingsInsert
): Promise<TenantSettingsRecord> => {
  const [settings] = await db
    .insert(tenantSettings)
    .values(input)
    .onConflictDoUpdate({
      target: tenantSettings.tenantId,
      set: {
        allowAnswerExport: input.allowAnswerExport,
        allowSourceDownload: input.allowSourceDownload,
        dataRetentionDays: input.dataRetentionDays,
        requireCitations: input.requireCitations,
        updatedAt: new Date()
      }
    })
    .returning();

  if (!settings) {
    throw new Error("Failed to upsert tenant settings");
  }

  return settings;
};
