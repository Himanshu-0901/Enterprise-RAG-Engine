# Sharding Runbook

## Current v1 Model

- `tenant_id` is the shard key.
- Every tenant-owned table keeps an explicit `tenant_id`.
- v1 uses one physical Postgres database.
- `tenant_shard_assignments` records the intended bucket and `shard_key`.
- `DATABASE_SHARDS_JSON={}` keeps all routes on the primary database.

## Physical Shard Configuration

Use `DATABASE_SHARDS_JSON` when a tenant bucket or enterprise tenant moves to a
separate database.

```json
{
  "defaultShardKey": "primary",
  "shards": {
    "primary": {
      "databaseUrl": "postgres://rag:rag@primary:5432/rag_llm",
      "region": "us-east-1"
    },
    "enterprise-us": {
      "databaseUrl": "postgres://rag:rag@enterprise-us:5432/rag_llm",
      "region": "us-east-1"
    }
  }
}
```

The request flow stays:

1. Auth resolves the user session and `tenant_id`.
2. The database router reads `tenant_shard_assignments`.
3. The router chooses the physical DB for the assignment `shard_key`.
4. Repositories still apply tenant-scoped predicates.

## Tenant Migration Procedure

1. Put the source tenant in maintenance mode or pause writes.
2. Confirm all tenant-owned rows include `tenant_id`.
3. Export tenant rows from all tenant-owned tables in dependency order.
4. Import into the target shard inside a transaction where possible.
5. Rebuild tenant vector indexes and object storage prefixes if needed.
6. Validate counts for documents, chunks, conversations, citations, users, usage,
   settings, billing, and audit logs.
7. Update `tenant_shard_assignments.shard_key` to the target shard.
8. Run tenant isolation smoke tests against the migrated tenant.
9. Resume writes.

Never move a tenant by changing application code paths directly. The shard
assignment is the routing contract.
