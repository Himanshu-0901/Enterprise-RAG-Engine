# TASKS.md

Durable implementation roadmap for the white-label RAG SaaS platform.

## Current Status

The app is a Dockerized TypeScript monorepo with:

- Next.js admin/client web app.
- Hono API service.
- Worker service.
- Postgres with pgvector.
- Redis.
- MinIO object storage.
- Tenant-scoped database access with shard-ready routing.
- Real tenant signup, login, invite acceptance, bearer sessions, and logout.
- Admin dashboard with onboarding progress, document ingestion, branding, settings, members, chat, analytics, feedback, and audit panels.

Local services:

- Web: `http://localhost:3001`
- API: `http://localhost:4000`
- Postgres: `127.0.0.1:55432`

## Completed Tasks

- Created `AGENTS.md` with engineering, UI, backend, security, and sharding rules.
- Set up monorepo structure: `apps/web`, `apps/api`, `apps/worker`, `packages/db`, `packages/rag`, `packages/shared`, `packages/ui`.
- Added Docker environment for web, API, worker, Postgres, Redis, and MinIO.
- Added strict TypeScript, ESLint, and Tailwind-based UI.
- Added tenant, user, membership, document, chunk, conversation, citation, usage, audit, settings, feedback, session, and invite schema.
- Added tenant shard assignment and shard router foundation.
- Added tenant-scoped auth middleware.
- Added document creation, upload, ingestion queue, object storage, chunking, embeddings, and vector index storage.
- Added document library with status, search/filter, re-index, soft delete, and restore.
- Added tenant branding editor and preview.
- Added tenant settings: retention, source download policy, answer export policy, citation requirement.
- Added tenant data export.
- Added chat workspace with citations, source previews, conversation history, rename, delete, and export policy enforcement.
- Added per-message answer feedback and feedback analytics.
- Added usage and audit tracking.
- Added members panel with role/status management.
- Added invite flow with one-time token/link display and invite URL prefill.
- Added real tenant signup, login, invite acceptance, bearer sessions, and server-side logout.
- Added onboarding/activation checklist in the admin dashboard.
- Added dev/demo session fallback for seeded local data.
- Added password reset request endpoint with hashed reset token storage.
- Added password reset confirmation endpoint that updates the password and revokes existing sessions.
- Added authenticated change-password endpoint and account security UI.
- Added authenticated profile endpoint and dashboard profile panel for name/email visibility.
- Added active session list and revoke-other-sessions support.
- Added invite email provider abstraction with Docker/local dev email sink.
- Added invite email delivery, invite resend, and invite revoke flows.
- Added separate end-user portal shell with branded chat experience.
- Added source document viewer route with citation deep links and policy-aware source access.
- Added Claude design reference files under `design/` and migrated the admin dashboard to a professional sidebar/topbar shell with a live-data overview.
- Added real file parsing foundation with Google Document AI Layout Parser for layout-aware PDFs/HTML, DOCX extraction, local text/Markdown parsing, and page/section metadata on chunks.
- Added hybrid retrieval with vector + keyword search, reciprocal-rank fusion, lexical reranking, confidence thresholds, refusal behavior, and admin retrieval diagnostics.
- Added real LLM generation with deterministic/OpenAI/Anthropic providers, grounded prompts, SSE chat endpoint, and token/cost usage tracking.
- Added billing and quota management with Stripe-ready billing records, dev checkout fallback, invoice history, quota states, and a Claude-style billing panel.
- Added platform admin operations with tenant search, suspend/unsuspend, plan overrides, feature flags, abuse review queue, and platform audit UI.
- Added sharding hardening with physical shard config support, shard-router tests, tenant isolation repository tests, and shard migration/analytics runbooks.
- Added compliance and reliability hardening with retention cleanup worker, tenant deletion workflow, audit coverage review, backup/restore runbook, and secret-management docs.
- Added testing foundation with API integration harness, auth/session tests, invite acceptance tests, worker ingestion tests, and Playwright admin smoke coverage.

## Next Tasks

Work through these in order unless the user reprioritizes.

## UI Migration Standard

Use the Claude design export in `design/` as the visual reference for all product UI work.

- When implementing or changing a feature, include the matching Claude-style UI work in the same task.
- Do not leave new logic behind a basic or placeholder interface.
- Keep admin surfaces aligned with the Claude shell: dense SaaS layout, sidebar/topbar navigation, neutral palette, compact cards, professional tables, clear states.
- Keep end-user surfaces aligned with the Claude portal: branded, trustworthy chat, clear citation inspection, source visibility, and mobile-friendly layout.
- Preserve existing working product logic while migrating UI; do not paste exported JSX directly into the app.
- Build proper React/TypeScript/Tailwind components from the design patterns.
- Keep UI files under 300 lines and split shell, view, table, form, and card components by responsibility.

### UI Migration Backlog

- Documents view: completed Claude-style upload area, source document table, status pills, filters/search, and action styling.
- Users view: completed Claude-style invite form, member table, role/status controls, invite link state, resend/revoke actions.
- Chat workspace: completed Claude-style conversation list, message bubbles, source/citation panel, composer, empty/loading states.
- Branding view: completed Claude-style identity form, color swatches, live portal preview, grouped settings.
- Settings/account view: completed Claude-style profile, password, session list, tenant policy controls.
- Analytics/audit view: completed Claude-style usage cards, feedback section, audit table, quota cards, chart styling.
- End-user portal: completed Claude-style branded chat surface, citation/source strip, conversation history, responsive layout.
- Document viewer: completed Claude-style viewer shell, page/snippet layout, citation highlight, toolbar, source metadata.
- Mobile/responsive polish: completed compact admin navigation and responsive tables/forms.
- Visual consistency pass: completed replacing old basic styling and aligning spacing/type/buttons/forms with the Claude design.

### 1. Password And Account Management

Completed for current roadmap.

### 2. Invite Delivery

Completed for current roadmap.

### 3. End-User Portal

Completed for current roadmap.

### 4. Document Viewer

Completed for current roadmap.

### 5. Real File Parsing

Completed for current roadmap.

### 6. Retrieval Quality

Completed for current roadmap.

### 7. Real LLM Generation

Completed for current roadmap.

### 8. Billing And Quotas

Completed for current roadmap.

### 9. Platform Admin

Completed for current roadmap.

### 10. Sharding Hardening

Completed for current roadmap.

### 11. Compliance And Reliability

Completed for current roadmap.

### 12. Testing

Completed for current roadmap.

### 13. Production Readiness

- Add environment variable validation docs.
- Add health/readiness checks for dependencies.
- Add structured logging.
- Add OpenTelemetry instrumentation.
- Add deployment manifests or IaC for the selected target platform.

## Completion Rules

Before marking a task complete:

- Keep every `.ts` and `.tsx` file under 300 lines.
- Keep TypeScript strict and avoid `any`.
- Keep UI and logic separated.
- Keep API handlers thin.
- Enforce tenant scoping in data access.
- Do not expose password hashes, invite hashes, reset hashes, or private document content.
- Run `npm run typecheck`.
- Run `npm run lint`.
- Run `npm run build` for web-impacting changes.
- Run Docker rebuilds for changed services.
- Smoke-test the changed user flow.
