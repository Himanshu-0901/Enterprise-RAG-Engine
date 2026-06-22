import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { eq } from "drizzle-orm";
import { createDatabaseClient } from "../client";
import {
  createDatabaseRouter,
  getTenantShardBucket,
  type PhysicalShardConfig
} from "../router";
import { tenants } from "../schema";
import { createTenantShardAssignment } from "../repositories";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for shard-router tests");
}

test("getTenantShardBucket is deterministic and bounded", () => {
  const tenantId = randomUUID();
  const first = getTenantShardBucket(tenantId);
  const second = getTenantShardBucket(tenantId);

  assert.equal(first, second);
  assert.ok(first >= 0);
  assert.ok(first < 4096);
});

test("router resolves explicit shard assignments and default buckets", async () => {
  const client = createDatabaseClient(databaseUrl);
  const router = createDatabaseRouter(databaseUrl, shardConfig(databaseUrl));
  const tenant = await client.db
    .insert(tenants)
    .values({
      name: "Shard Router Test",
      slug: `shard-router-${randomUUID()}`
    })
    .returning()
    .then(([row]) => row);

  assert.ok(tenant);

  try {
    await createTenantShardAssignment(client.db, {
      bucket: 77,
      shardKey: "enterprise-us",
      tenantId: tenant.id
    });

    const explicitRoute = await router.resolveTenant(tenant.id);
    assert.equal(explicitRoute.bucket, 77);
    assert.equal(explicitRoute.shardKey, "enterprise-us");

    const unassignedTenantId = randomUUID();
    const defaultRoute = await router.resolveTenant(unassignedTenantId);
    assert.equal(defaultRoute.bucket, getTenantShardBucket(unassignedTenantId));
    assert.equal(defaultRoute.shardKey, "primary");
  } finally {
    await client.db.delete(tenants).where(eq(tenants.id, tenant.id));
    await router.close();
    await client.close();
  }
});

const shardConfig = (url: string): PhysicalShardConfig => ({
  defaultShardKey: "primary",
  shards: {
    "enterprise-us": {
      databaseUrl: url,
      region: "us-east-1"
    }
  }
});
