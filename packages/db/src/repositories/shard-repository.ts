import { eq } from "drizzle-orm";
import type { Database } from "../client";
import { tenantShardAssignments } from "../schema";

export type TenantShardAssignment = typeof tenantShardAssignments.$inferSelect;
export type TenantShardAssignmentInsert =
  typeof tenantShardAssignments.$inferInsert;

export const createTenantShardAssignment = async (
  db: Database,
  input: TenantShardAssignmentInsert
): Promise<TenantShardAssignment> => {
  const [assignment] = await db
    .insert(tenantShardAssignments)
    .values(input)
    .returning();

  if (!assignment) {
    throw new Error("Failed to create tenant shard assignment");
  }

  return assignment;
};

export const findTenantShardAssignment = async (
  db: Database,
  tenantId: string
): Promise<TenantShardAssignment | undefined> => {
  const [assignment] = await db
    .select()
    .from(tenantShardAssignments)
    .where(eq(tenantShardAssignments.tenantId, tenantId));

  return assignment;
};
