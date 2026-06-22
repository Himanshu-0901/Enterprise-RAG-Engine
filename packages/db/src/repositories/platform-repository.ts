import { desc, eq } from "drizzle-orm";
import type { Database } from "../client";
import { abuseReviews, tenantFeatureFlags } from "../schema";

export type FeatureFlagRecord = typeof tenantFeatureFlags.$inferSelect;
export type FeatureFlagInsert = typeof tenantFeatureFlags.$inferInsert;
export type AbuseReviewRecord = typeof abuseReviews.$inferSelect;

export const listTenantFeatureFlags = async (
  db: Database,
  tenantId: string
): Promise<FeatureFlagRecord[]> =>
  db
    .select()
    .from(tenantFeatureFlags)
    .where(eq(tenantFeatureFlags.tenantId, tenantId))
    .orderBy(tenantFeatureFlags.key);

export const upsertTenantFeatureFlag = async (
  db: Database,
  input: FeatureFlagInsert
): Promise<FeatureFlagRecord> => {
  const [flag] = await db
    .insert(tenantFeatureFlags)
    .values(input)
    .onConflictDoUpdate({
      target: [tenantFeatureFlags.tenantId, tenantFeatureFlags.key],
      set: {
        enabled: input.enabled,
        rolloutPercentage: input.rolloutPercentage,
        updatedAt: new Date()
      }
    })
    .returning();

  if (!flag) {
    throw new Error("Failed to upsert feature flag");
  }

  return flag;
};

export const listAbuseReviews = async (
  db: Database
): Promise<AbuseReviewRecord[]> =>
  db.select().from(abuseReviews).orderBy(desc(abuseReviews.createdAt));

export const updateAbuseReviewStatus = async (
  db: Database,
  reviewId: string,
  status: "dismissed" | "open" | "resolved"
): Promise<AbuseReviewRecord> => {
  const [review] = await db
    .update(abuseReviews)
    .set({
      resolvedAt: status === "open" ? null : new Date(),
      status
    })
    .where(eq(abuseReviews.id, reviewId))
    .returning();

  if (!review) {
    throw new Error("Abuse review not found");
  }

  return review;
};
