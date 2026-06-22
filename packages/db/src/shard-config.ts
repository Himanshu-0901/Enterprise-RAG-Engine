import type { PhysicalShardConfig } from "./router";

type ShardConfigJson = {
  defaultShardKey?: unknown;
  shards?: unknown;
};

export const parsePhysicalShardConfig = (
  value: string
): PhysicalShardConfig | undefined => {
  if (!value.trim() || value.trim() === "{}") {
    return undefined;
  }

  const parsed = JSON.parse(value) as ShardConfigJson;
  const shards: PhysicalShardConfig["shards"] = {};

  if (!parsed.shards || typeof parsed.shards !== "object") {
    throw new Error("DATABASE_SHARDS_JSON must include a shards object");
  }

  for (const [key, shard] of Object.entries(parsed.shards)) {
    if (!shard || typeof shard !== "object" || !("databaseUrl" in shard)) {
      throw new Error(`Shard ${key} must include databaseUrl`);
    }

    const record = shard as { databaseUrl?: unknown; region?: unknown };

    if (typeof record.databaseUrl !== "string") {
      throw new Error(`Shard ${key} databaseUrl must be a string`);
    }

    shards[key] = {
      databaseUrl: record.databaseUrl,
      region: typeof record.region === "string" ? record.region : undefined
    };
  }

  return {
    defaultShardKey:
      typeof parsed.defaultShardKey === "string" ? parsed.defaultShardKey : "primary",
    shards
  };
};
