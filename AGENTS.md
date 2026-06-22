# AGENTS.md

## Project Standard

This project is a production-grade white-label RAG SaaS platform. Treat every change as if it will be maintained by a professional engineering team.

Do not write rushed, careless, or throwaway code. Prefer boring, readable, testable code over clever code.

Before continuing implementation, read `TASKS.md` for the durable roadmap, completed work, next tasks, and verification expectations.

## Core Engineering Rules

- Use TypeScript wherever JavaScript would otherwise be used.
- Keep TypeScript strict. Avoid `any`; use explicit types, generics, discriminated unions, or `unknown` with proper narrowing.
- Keep files small and focused. Do not create files larger than 300 lines of code.
- Follow single responsibility. One module should have one clear reason to change.
- Separate UI from business logic.
- Separate server logic from client UI.
- Separate data access from service logic.
- Separate domain types from component implementation.
- Prefer composition over inheritance.
- Prefer explicit names over abbreviations.
- Do not hide complexity in vague helper functions.
- Avoid premature abstractions, but extract shared logic when duplication becomes meaningful.

## Frontend Rules

- Use React with TypeScript.
- Use Tailwind CSS for styling.
- Build real product UI, not placeholder screens.
- Prioritize UX, accessibility, loading states, empty states, and error states.
- Keep UI components presentational when possible.
- Move data fetching, mutations, formatting, and business rules into hooks, services, or server actions.
- Do not mix complex state orchestration directly inside visual components.
- Prefer small components with clear props.
- Use semantic HTML.
- Ensure responsive behavior for desktop and mobile.
- Use accessible labels, focus states, keyboard navigation, and readable contrast.
- Avoid bloated components and deeply nested JSX.

## Backend Rules

- Keep API handlers thin.
- Put business rules in services.
- Put database access in repositories or clearly scoped data-access modules.
- Validate inputs at the boundary.
- Return typed responses.
- Never trust tenant IDs from the client without authorization checks.
- Every tenant-owned query must be scoped by `tenant_id`.
- Design for auditability around auth, documents, billing, and admin actions.

## Database And Sharding Rules

- The product is tenant-sharded by design. Use `tenant_id` as the primary shard key.
- Do not shard by `user_id`; users, documents, chunks, conversations, usage, billing, and audit data belong to a tenant.
- v1 uses one physical Postgres database with shard-ready tenant-scoped tables.
- Keep all tenant-owned tables carrying `tenant_id`, even when another foreign key already implies tenant ownership.
- Keep object storage paths tenant-prefixed: `tenants/{tenant_id}/...`.
- Keep vector indexes and retrieval tenant-scoped.
- Do not write code that assumes all tenants must live in one physical database forever.
- Route database access through a repository/data-access boundary so a future shard router can choose the correct database before queries run.
- Future shard routing should follow: auth resolves `tenant_id` -> shard resolver maps tenant/bucket to database -> repositories run tenant-scoped queries.
- Cross-tenant analytics should use events, warehouse tables, or explicit admin workflows, not accidental cross-shard product queries.
- Physical shards, dedicated databases, or dedicated regions are enterprise/scale paths, not the default v1 implementation.

## RAG System Rules

- Tenant isolation is non-negotiable.
- Retrieval must always be scoped to the active tenant.
- Answers must be grounded in retrieved sources.
- Citations must map back to stable document, page, and chunk metadata.
- If confidence is too low, the assistant should refuse or say it does not know.
- Store enough metadata to debug retrieval quality.
- Keep parsing, chunking, embedding, retrieval, and generation as separate modules.

## Code Quality

- Use ESLint.
- Use Prettier or an equivalent formatter.
- Keep lint and typecheck passing before considering work complete.
- Avoid dead code.
- Avoid commented-out code.
- Avoid large utility files.
- Avoid circular dependencies.
- Avoid global mutable state unless there is a clear reason.
- Prefer deterministic functions for core business logic.
- Write tests for risky logic, tenant isolation, billing rules, and RAG citation behavior.

## Project Structure Expectations

Use clear boundaries similar to:

```txt
apps/
  web/
  api/
  worker/
packages/
  db/
  shared/
  rag/
  ui/
```

Suggested module boundaries:

```txt
components/     # UI components only
hooks/          # frontend orchestration hooks
services/       # business logic
repositories/   # database access
lib/            # low-level infrastructure helpers
types/          # shared type definitions
schemas/        # validation schemas
```

## Security Rules

- Never commit secrets.
- Never store secrets in source files.
- Use environment variables for local development.
- Use managed secret storage in production.
- Validate auth and authorization on the server.
- Enforce tenant isolation in code and tests.
- Log security-sensitive events without leaking private document content.
- Treat uploaded documents as private tenant data.

## UI/UX Standard

- The admin dashboard should feel like serious SaaS software: clear, dense, fast, and easy to scan.
- The end-user chat should feel branded, trustworthy, and simple.
- Do not ship unfinished-looking UI.
- Include loading, success, empty, and error states.
- Make citations easy to inspect.
- Make document status visible during ingestion.
- Prefer clarity over decoration.

## Review Checklist

Before considering a task complete, verify:

- TypeScript types are strict and meaningful.
- Files remain under 300 lines.
- UI and logic are separated.
- Tenant data access is scoped.
- Errors are handled.
- Loading and empty states exist where needed.
- ESLint passes.
- Typecheck passes.
- The implementation matches the existing architecture.
