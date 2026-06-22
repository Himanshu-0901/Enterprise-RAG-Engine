# Cross-Shard Analytics Strategy

Product requests must not run broad cross-tenant queries across physical shards.
Cross-shard analytics should be handled through explicit data products.

## Preferred Approach

1. Keep product tables tenant-scoped and shard-local.
2. Emit append-only events for usage, billing, audit, ingestion, and chat quality.
3. Replicate those events into a warehouse or analytics database.
4. Build platform dashboards from the warehouse, not from live shard fan-out.

## Allowed Live Queries

Live cross-shard fan-out is only acceptable for operator workflows that are:

- Explicitly platform-admin only.
- Bounded by tenant list, time range, or incident scope.
- Read-only.
- Observable and rate-limited.

## Event Shape

Analytics events should include:

- `tenant_id`
- `shard_key`
- `event_type`
- `occurred_at`
- `quantity`
- non-sensitive metadata

Do not send private document content, raw prompts, raw answers, password hashes,
invite hashes, reset hashes, or secrets to analytics.

## Reporting Model

- Tenant dashboards read from shard-local product tables.
- Fleet dashboards read from the analytics warehouse.
- Billing reconciliation uses usage events plus Stripe records.
- Security review uses audit events and sampled metadata, not source documents.

This keeps tenant isolation simple while allowing large-scale reporting without
turning the request path into a distributed database query engine.
