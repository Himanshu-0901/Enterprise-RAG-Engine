# Audit Coverage Review

Audit logs are operator-facing records. They must not include private document
content, raw prompts, raw answers, passwords, invite hashes, reset hashes, or
secrets.

## Covered Events

- `tenant.signup`
- `tenant_settings.updated`
- `tenant_branding.updated`
- `tenant_data.exported`
- `tenant.delete_requested`
- `document.indexed`
- `document.reindexed`
- `document.deleted`
- `document.restored`
- `user.invited`
- `user.invite_resent`
- `user.membership_updated`
- `message.feedback`
- `billing.checkout_started`
- `billing.plan_changed`
- `platform.tenant_plan_changed`
- `platform.tenant_status_changed`
- `platform.feature_flag_changed`
- `platform.abuse_review_updated`
- `retention.conversations_deleted`
- `auth.logout`

## Events That Should Stay Usage-Only

- Normal chat queries.
- Citation clicks.
- Low-level retrieval diagnostics.

These are recorded as usage events because they are high-volume and not
operator actions.

## Review Checklist

- Every write path that changes tenant configuration records an audit event.
- Every user-management write records actor, target user, and changed role/status.
- Every billing/platform write records the actor and target tenant.
- Retention jobs record counts and cutoff dates only.
- Tenant deletion records a final platform-level audit event before cascade delete.
