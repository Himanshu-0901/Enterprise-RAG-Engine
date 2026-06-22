# Backup And Restore Runbook

## Scope

Back up:

- Postgres metadata and tenant product tables.
- Vector embeddings stored in Postgres.
- MinIO/S3 tenant document objects.
- Environment and secret references, not secret values.

## Backup Schedule

- Postgres: daily full backup, hourly WAL/archive in production.
- Object storage: bucket versioning plus daily inventory export.
- Retention: keep operational backups for at least 30 days unless a stricter
  customer or compliance policy applies.

## Restore Drill

1. Restore Postgres into an isolated database.
2. Restore the matching object storage prefix snapshot.
3. Set `DATABASE_SHARDS_JSON` to point a test shard key at the restored DB.
4. Run migrations.
5. Run tenant isolation tests.
6. Smoke test auth, document viewer, upload, retrieval, chat, and billing.
7. Compare document counts, chunk counts, conversation counts, and usage totals.

## Tenant-Level Restore

Prefer full-shard restore into an isolated database, then export/import the
affected tenant rows and object prefixes. Do not restore one tenant directly into
production without validating tenant-scoped foreign keys and object paths.

## Recovery Targets

Current v1 targets:

- RPO: 24 hours for metadata and vector indexes.
- RTO: 4 hours for the chat/admin surface.

Tighter targets require managed Postgres PITR, object storage versioning, and
automated restore drills in CI or staging.
