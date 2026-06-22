import { integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { tenants } from "./tenancy";

export const tenantShardAssignments = pgTable(
  "tenant_shard_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    shardKey: text("shard_key").notNull().default("primary"),
    bucket: integer("bucket").notNull(),
    databaseUrlSecret: text("database_url_secret"),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    tenantIndex: uniqueIndex("tenant_shard_assignments_tenant_idx").on(
      table.tenantId
    )
  })
);
