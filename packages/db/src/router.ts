import { createDatabaseClient, type Database, type DatabaseClient } from "./client";
import { findTenantShardAssignment } from "./repositories";

export type DatabaseRoute = {
  bucket: number;
  db: Database;
  shardKey: string;
};

export type PhysicalShardConfig = {
  defaultShardKey: string;
  shards: Record<string, { databaseUrl: string; region?: string }>;
};

export type DatabaseRouter = {
  close: () => Promise<void>;
  control: Database;
  resolveTenant: (tenantId: string) => Promise<DatabaseRoute>;
};

const bucketCount = 4_096;

export const getTenantShardBucket = (tenantId: string): number => {
  let hash = 0;

  for (const character of tenantId) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash % bucketCount;
};

export const createDatabaseRouter = (
  databaseUrl: string,
  shardConfig?: PhysicalShardConfig
): DatabaseRouter => {
  const primaryClient: DatabaseClient = createDatabaseClient(databaseUrl);
  const clients = new Map<string, DatabaseClient>([["primary", primaryClient]]);

  for (const [shardKey, shard] of Object.entries(shardConfig?.shards ?? {})) {
    clients.set(
      shardKey,
      shard.databaseUrl === databaseUrl
        ? primaryClient
        : createDatabaseClient(shard.databaseUrl)
    );
  }

  const defaultShardKey = shardConfig?.defaultShardKey ?? "primary";

  const resolveClient = (shardKey: string): DatabaseClient =>
    clients.get(shardKey) ?? clients.get(defaultShardKey) ?? primaryClient;

  return {
    close: async () => {
      const uniqueClients = new Set(clients.values());
      await Promise.all([...uniqueClients].map((client) => client.close()));
    },
    control: primaryClient.db,
    resolveTenant: async (tenantId) => {
      const assignment = await findTenantShardAssignment(primaryClient.db, tenantId);
      const shardKey = assignment?.shardKey ?? defaultShardKey;
      const client = resolveClient(shardKey);

      return {
        bucket: assignment?.bucket ?? getTenantShardBucket(tenantId),
        db: client.db,
        shardKey
      };
    }
  };
};
