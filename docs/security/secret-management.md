# Secret Management

## Local Development

- Use `.env` for local-only configuration.
- Keep `.env.example` as documentation with placeholder values only.
- Never commit real API keys, database passwords, Stripe secrets, S3 secrets, or
  Google service account JSON files.

## Production

Use a managed secret store:

- AWS Secrets Manager or SSM Parameter Store.
- GCP Secret Manager.
- Azure Key Vault.
- The deployment platform's encrypted secret manager.

Secrets are injected as environment variables at process start. Application code
must never read secrets from source-controlled files.

## Current Secret Inputs

- `DATABASE_URL`
- `DATABASE_SHARDS_JSON`
- `REDIS_URL`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `STRIPE_SECRET_KEY`
- Google Document AI credentials via `GOOGLE_APPLICATION_CREDENTIALS`

## Rotation

1. Add the new secret version to the managed secret store.
2. Deploy API and worker processes with the new secret.
3. Verify health checks, ingestion, retrieval, chat, and billing.
4. Revoke the old secret.
5. Record the rotation in the operational audit channel.

## Logging Rules

- Do not log request headers containing bearer tokens.
- Do not log prompts, document text, raw answers, or source snippets in errors.
- Do not include secret values in structured logs.
- Error messages returned to clients must be generic for auth and provider
  failures.
