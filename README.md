# Enterprise RAG Engine

A production-grade, Enterprise Retrieval Augmented Generation (RAG) Engine built with TypeScript, React, and modern cloud-native technologies. This is a multi-tenant system designed for scalability, security, and enterprise-grade reliability.

## 🎯 Project Overview

This is a **tenant-sharded, white-label RAG SaaS platform** that enables organizations to:
- Ingest and manage documents with AI-powered parsing
- Build intelligent Q&A systems with citations and source tracking
- Customize the end-user experience with brand colors and logos
- Manage users, permissions, and billing
- Track usage, feedback, and audit logs
- Scale horizontally with shard-ready multi-tenant architecture

**Current Status:** Production-ready core platform with admin dashboards, end-user portal, document management, retrieval system, LLM generation, billing integration, and compliance features.

---

## ⚠️ Important: Frontend Architecture - React.js, NOT Next.js

### Why React.js Instead of Next.js?

The `@rag-llm/web` application is built with **React.js 19 with Vite**, not Next.js. This is a deliberate architectural choice. Here's why:

#### 1. **Client-Side Application Requirements**
- The web frontend is designed as a **true Single Page Application (SPA)** that communicates with a separate, decoupled API backend
- The API backend (`@rag-llm/api`) is built independently using **Hono** and runs on a different service
- There is no server-side rendering requirement for the admin dashboard or end-user portal
- Users authenticate with bearer tokens and all API calls are made from the browser to the backend

#### 2. **Build Performance & Development Speed**
- **Vite** provides extremely fast Hot Module Replacement (HMR) during development
- Significantly faster build times compared to Next.js
- Better suited for rapid iteration on UI components and state management
- More predictable build output for a client-only application

#### 3. **Technology Stack Clarity**
- **React Router (v7)** handles all client-side routing instead of Next.js file-based routing
- **Redux Toolkit** manages global application state
- **Tailwind CSS** handles styling
- Clear separation between frontend concerns and backend concerns
- No server-side business logic mixed with client-side code

#### 4. **Flexibility & Control**
- Full control over the build pipeline
- Custom Vite configuration for specific optimization needs
- Freedom to structure routes and state management without Next.js conventions
- Easier to reason about what's happening on the client vs. the server

#### 5. **Multi-Tenant Architecture**
- The API backend (`@rag-llm/api`) implements all multi-tenant logic, tenant scoping, and database access
- The frontend is stateless and tenant-agnostic; tenant context is passed via API responses and bearer tokens
- This separation makes it easy to build multiple UIs (admin, end-user portal, mobile apps) without duplicating backend logic

### What This Means for Developers

**Frontend (`@rag-llm/web`):**
- All code runs in the browser
- Uses React Router for navigation and URL state
- Redux Toolkit for client-side state
- Fetch/HTTP calls to the backend API
- No server-side rendering, no server functions, no API routes in the frontend
- Styling with Tailwind CSS

**Backend (`@rag-llm/api`):**
- Hono-based REST API
- All business logic, data validation, and tenant scoping happens here
- Database access through repositories
- Authentication middleware for bearer tokens
- Webhook handling, email delivery, and async job processing

**Why NOT Next.js?**
- ❌ No need for server-side rendering
- ❌ No need for server actions or API routes in the frontend
- ❌ Would add unnecessary complexity
- ❌ Would blur the line between frontend and backend concerns
- ✅ React + Vite provides exactly what we need: fast client-side SPA development

---

## 🏗️ Architecture

### Monorepo Structure

```
White_Label/
├── apps/
│   ├── web/              # React + Vite SPA for admin & end-user portal
│   ├── api/              # Hono REST API backend
│   └── worker/           # Bull queue worker for async jobs (document ingestion, emails)
├── packages/
│   ├── db/               # Postgres schema, migrations, repositories
│   ├── rag/              # RAG pipeline (chunking, embeddings, retrieval)
│   ├── shared/           # Shared types and utilities
│   └── ui/               # Reusable UI components
├── docker-compose.yml    # Local dev services (Postgres, Redis, MinIO)
├── infra/                # Deployment configs and runbooks
├── design/               # Claude design reference files
├── docs/                 # Architecture and operational documentation
└── AGENTS.md             # Engineering standards and rules
```

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend UI** | React 19 + Vite | Client-side SPA |
| **Frontend State** | Redux Toolkit | Global state management |
| **Frontend Routing** | React Router v7 | Client-side navigation |
| **Frontend Styling** | Tailwind CSS v4 | Utility-first CSS |
| **Backend API** | Hono + Node.js | REST API server |
| **Database** | PostgreSQL + pgvector | Multi-tenant data storage + vector embeddings |
| **Cache** | Redis | Session store, job queue |
| **Object Storage** | MinIO (local) / S3 (prod) | Document and object storage |
| **Job Queue** | Bull MQ + Redis | Async document ingestion, email delivery |
| **Parsing** | Google Document AI | Layout-aware PDF/HTML parsing |
| **LLMs** | OpenAI / Anthropic / Deterministic | Answer generation |
| **Billing** | Stripe | Payment processing and billing |
| **Testing** | Playwright + Node test runner | E2E and integration tests |
| **Containerization** | Docker + Docker Compose | Local dev & production deployment |

### Core Services

#### 1. **Web App** (`apps/web`)
- React 19 SPA built with Vite
- Two main experiences:
  - **Admin Dashboard** (`/dashboard/*`): Tenant management, document ingestion, branding, settings, members, analytics
  - **End-User Portal** (`/chat/*`): Branded chat interface with citations and source previews
- Redux for client-side state
- React Router for navigation
- Tailwind CSS for styling

#### 2. **API Server** (`apps/api`)
- Hono REST API
- Tenant-scoped endpoints with bearer token auth
- Core operations:
  - Authentication (signup, login, logout, password reset)
  - Document management (upload, ingestion, search, delete)
  - Chat (conversation history, Q&A, citations)
  - User & invite management
  - Billing and usage tracking
  - Admin operations (tenant search, suspend/unsuspend, feature flags)
- All database access is tenant-scoped

#### 3. **Worker Service** (`apps/worker`)
- Bull MQ consumer for async jobs
- Document ingestion: parsing, chunking, embeddings, indexing
- Email delivery: invites, password resets, notifications
- Cleanup: retention policies, soft deletes

#### 4. **Database** (`packages/db`)
- PostgreSQL schema with pgvector extension
- Tables: tenants, users, documents, chunks, conversations, citations, usage, audit logs, billing, etc.
- Migrations for schema evolution
- Repositories for tenant-scoped data access
- Shard assignment and routing infrastructure

#### 5. **RAG Pipeline** (`packages/rag`)
- Document parsing (Google Document AI for PDFs/HTML, direct extraction for DOCX/TXT)
- Chunking with page/section metadata
- Embedding generation
- Hybrid retrieval (vector + keyword search)
- Reranking with confidence thresholds
- LLM generation with grounded prompts

#### 6. **Shared Types & Utils** (`packages/shared`)
- TypeScript types for the entire system
- Validation schemas (Zod)
- Utility functions
- Shared constants

### Data Flow

```
User Browser
    ↓
React Frontend (@rag-llm/web)
    ↓ HTTP + Bearer Token
Hono API (@rag-llm/api)
    ↓
Postgres Database (tenant-scoped queries)
    ↓ Vector Search
Pgvector (embeddings index)

Async Flow:
Hono API → Bull Queue (Redis) → Worker → Postgres + S3/MinIO + Embeddings
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20+
- **npm** 10+
- **Docker** and **Docker Compose**
- **Git**

### Installation & Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd White_Label
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your local configuration
```

4. **Start Docker services** (Postgres, Redis, MinIO)
```bash
npm run docker:up
```

5. **Run database migrations**
```bash
npm run db:migrate
```

6. **Start the development servers**

In separate terminals:

```bash
# Terminal 1: Frontend (React + Vite)
npm run dev

# Terminal 2: Backend API (Hono)
npm run dev:api
```

The application will be available at:
- **Admin Dashboard/Portal**: `http://localhost:3001`
- **API**: `http://localhost:4000`
- **Postgres**: `127.0.0.1:55432`
- **Redis**: `127.0.0.1:6379`
- **MinIO Console**: `http://localhost:9001`

### Default Local Credentials

- **MinIO**: `minioadmin` / `minioadmin`
- **Postgres**: User `rag`, password `rag`, database `rag_llm`

---

## 📁 Project Structure Explained

### `/apps/web` - React Frontend (NOT Next.js)

```
apps/web/
├── src/
│   ├── components/       # React UI components (presentational)
│   ├── hooks/           # Custom React hooks (data fetching, state logic)
│   ├── services/        # Business logic and API client
│   ├── store/           # Redux state management
│   ├── types/           # TypeScript type definitions
│   ├── pages/           # Page-level components (top-level routes)
│   ├── App.tsx          # Root component with React Router setup
│   └── main.tsx         # Vite entry point
├── index.html           # HTML entry point for Vite
├── vite.config.ts       # Vite build configuration
├── tsconfig.json        # TypeScript configuration
├── tailwind.config.ts   # Tailwind CSS configuration
└── package.json         # Frontend dependencies
```

**Key Differences from Next.js:**
- No `pages/` directory with file-based routing → uses `React Router` instead
- No `public/` directory for static assets → assets are imported in components
- No `pages/api/` directory → all API calls go to the separate Hono backend
- No server-side rendering → purely client-side rendering
- Vite handles bundling instead of Next.js webpack
- No built-in image optimization → use standard `<img>` tags or Tailwind `aspect-ratio`
- No built-in API routes → backend is a separate Hono service

**Frontend Tech Stack:**
```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "react-router-dom": "^7.17.0",           // Client-side routing
  "@reduxjs/toolkit": "^2.12.0",           // State management
  "react-redux": "^9.3.0",                 // Redux bindings
  "tailwindcss": "^4.1.4",                 // Styling
  "vite": "^8.0.16"                        // Build tool
}
```

### `/apps/api` - Hono Backend

```
apps/api/
├── src/
│   ├── index.ts         # Hono app initialization
│   ├── routes/          # Endpoint definitions
│   ├── handlers/        # Request handlers
│   ├── middleware/      # Auth, validation, logging
│   ├── services/        # Business logic
│   ├── repositories/    # Database access (tenant-scoped)
│   └── tests/           # Integration tests
├── tsconfig.json        # TypeScript configuration
└── package.json         # Backend dependencies
```

**API Technology Stack:**
```json
{
  "hono": "^4.7.8",                        // Lightweight REST framework
  "@hono/node-server": "^1.14.1",          // Node.js adapter
  "bullmq": "^5.76.4",                     // Job queue
  "@rag-llm/db": "0.1.0",                  // Database access
  "@rag-llm/rag": "0.1.0",                 // RAG pipeline
  "zod": "^3.24.3"                         // Input validation
}
```

### `/apps/worker` - Async Job Processor

```
apps/worker/
├── src/
│   ├── index.ts         # Worker initialization
│   ├── jobs/            # Job handlers
│   ├── services/        # Business logic
│   └── tests/           # Job tests
└── package.json
```

Handles:
- Document ingestion (parsing, chunking, embeddings, indexing)
- Email delivery (invites, password resets)
- Cleanup tasks (retention policies, soft deletes)

### `/packages/db` - Database Layer

```
packages/db/
├── src/
│   ├── schema.ts        # Database schema definitions
│   ├── migrations/      # SQL migration files
│   ├── repositories/    # Data access (tenant-scoped queries)
│   └── tests/           # Schema and shard tests
└── package.json
```

**Key Features:**
- Tenant-scoped all queries with `WHERE tenant_id = $1`
- Shard-ready architecture for future horizontal scaling
- Repository pattern for clean data access separation
- PostgreSQL + pgvector for vector search

### `/packages/rag` - RAG Pipeline

Document parsing, chunking, embedding, retrieval, and LLM generation logic.

```
packages/rag/
├── src/
│   ├── parsing/         # Document parsers
│   ├── chunking/        # Text chunking strategies
│   ├── embeddings/      # Embedding providers
│   ├── retrieval/       # Search and reranking
│   └── generation/      # LLM generation
└── package.json
```

---

## 🔐 Multi-Tenant Architecture

The platform is designed for **strict tenant isolation** at every layer:

### Tenant Scoping Rules

1. **Database Level**
   - Every table has a `tenant_id` column
   - All queries include `WHERE tenant_id = $1`
   - Repository pattern enforces this automatically
   - No query can access data from other tenants

2. **Authentication Level**
   - Users authenticate and receive a bearer token
   - Token contains the `tenant_id` and `user_id`
   - Middleware validates token and enforces `tenant_id` match

3. **API Level**
   - Every endpoint validates the tenant matches the request context
   - API never trusts `tenant_id` from the client

4. **Storage Level**
   - Document files stored at `tenants/{tenant_id}/...`
   - Vector embeddings indexed per-tenant
   - No shared indexes or data structures

### Shard-Ready Design

While v1 uses a single Postgres database:
- Database routing layer is prepared for future sharding
- Shard assignment logic implemented
- Tenant-to-shard mapping can be changed without code changes
- Repository layer is the single point where shard routing will occur

---

## 🛠️ Development Commands

### Installation & Setup
```bash
npm install              # Install all dependencies
npm run docker:up        # Start local services (Postgres, Redis, MinIO)
npm run docker:down      # Stop local services
npm run db:migrate       # Run database migrations
```

### Development
```bash
npm run dev              # Start React frontend (Vite) at localhost:3001
npm run dev:api          # Start Hono API at localhost:4000
```

### Build & Validation
```bash
npm run build            # Build React app for production
npm run typecheck        # TypeScript type checking (all workspaces)
npm run lint             # ESLint validation (all workspaces)
```

### Testing
```bash
npm run test             # Run all tests (API, worker, sharding)
npm run test:api         # Integration tests for API
npm run test:worker      # Worker job tests
npm run test:sharding    # Shard routing and isolation tests
npm run test:e2e         # End-to-end tests with Playwright
```

### Docker
```bash
docker compose up -d     # Start services
docker compose down      # Stop services
docker compose logs -f   # View logs
npm run docker:up        # Convenient wrapper
npm run docker:down      # Convenient wrapper
```

---

## 📋 API Endpoints Overview

### Authentication
- `POST /auth/signup` - Create new tenant account
- `POST /auth/login` - User login with email/password
- `POST /auth/logout` - Logout (invalidate session)
- `POST /auth/password-reset/request` - Request password reset
- `POST /auth/password-reset/confirm` - Confirm and set new password
- `POST /auth/change-password` - Change password while logged in

### Documents
- `POST /documents/upload` - Upload document file
- `GET /documents` - List tenant documents
- `GET /documents/:id` - Get document details
- `DELETE /documents/:id` - Soft delete document
- `POST /documents/:id/restore` - Restore soft-deleted document
- `GET /documents/:id/view` - View document content

### Chat & Retrieval
- `POST /conversations` - Create conversation
- `GET /conversations` - List conversations
- `POST /conversations/:id/messages` - Send message (Q&A)
- `DELETE /conversations/:id` - Delete conversation
- `GET /sources/:id` - Get source document for citation

### Users & Members
- `GET /users/me` - Current user profile
- `PUT /users/me` - Update profile
- `GET /members` - List tenant members
- `POST /members/invite` - Send invite
- `POST /invites/:token/accept` - Accept invite
- `DELETE /members/:id` - Remove member
- `PUT /members/:id` - Update member role

### Tenant Settings
- `GET /tenant/settings` - Get tenant settings
- `PUT /tenant/branding` - Update brand colors, logo
- `PUT /tenant/settings` - Update policies and retention

### Analytics
- `GET /usage` - Usage statistics
- `GET /feedback` - User feedback analytics
- `GET /audit` - Audit log

### Admin (Platform)
- `GET /admin/tenants` - Search tenants
- `POST /admin/tenants/:id/suspend` - Suspend tenant
- `POST /admin/tenants/:id/unsuspend` - Unsuspend tenant
- `PUT /admin/tenants/:id` - Update tenant (plans, features)
- `GET /admin/abuse-queue` - Review flagged content

---

## 🗄️ Database Schema Overview

### Core Tables

| Table | Purpose |
|-------|---------|
| `tenants` | Tenant organization records |
| `users` | User accounts (scoped by tenant) |
| `memberships` | User roles within tenants |
| `documents` | Uploaded documents (scoped by tenant) |
| `chunks` | Text chunks from documents (for retrieval) |
| `embeddings` | Vector embeddings indexed in pgvector |
| `conversations` | Chat conversations (scoped by tenant) |
| `messages` | Chat messages within conversations |
| `citations` | Source citations for answers |
| `sessions` | User sessions (bearer tokens) |
| `usage` | Token usage and billing metrics |
| `audit_logs` | Security and operational audit events |
| `billing_records` | Stripe invoices and payment records |
| `feedback` | End-user answer feedback |
| `settings` | Tenant brand and policy settings |
| `invites` | Pending team member invites |

All tables include:
- `tenant_id` for scoping
- `created_at` and `updated_at` timestamps
- Proper foreign key constraints

---

## 🔄 Data Flow Examples

### Document Upload & Ingestion

1. **User uploads file** in admin dashboard (React)
2. **React calls** `POST /documents/upload` with file
3. **API** validates tenant, stores file in MinIO, creates document record
4. **API** enqueues ingestion job in Bull queue
5. **Worker** polls queue, parses file, chunks text, generates embeddings
6. **Worker** stores chunks and embeddings in Postgres + pgvector
7. **React** polls document status, shows ingestion progress
8. **Admin dashboard** displays document as ready

### User Asks a Question

1. **User types question** in chat (React)
2. **React calls** `POST /conversations/:id/messages`
3. **API** retrieves messages, retrieves relevant chunks using hybrid search
4. **API** calls LLM with grounded prompt (context from chunks)
5. **API** streams answer via SSE with citations
6. **React** renders answer with citation badges
7. **User clicks citation** → React opens source viewer with highlighted section
8. **Admin sees analytics** → aggregated usage, feedback tracking

### User Signup & Invite Flow

1. **Prospect signs up** via signup form
2. **API** validates email, creates tenant + user, sends verification email
3. **Tenant owner** logs in, adds team members via invite form
4. **API** generates one-time token, sends invite email
5. **Invited user** clicks link, lands on accept page
6. **Accept endpoint** validates token, creates user, sends welcome email
7. **Team member** logs in with own password
8. **Admin dashboard** shows member in team list

---

## 📊 Features

### Admin Dashboard
- ✅ Tenant onboarding checklist
- ✅ Document library with upload, search, filter, re-index, soft delete, restore
- ✅ Brand customization (colors, logo)
- ✅ Tenant settings (retention, source download, answer export)
- ✅ User management (roles, invites, member list)
- ✅ Chat workspace with conversations
- ✅ Usage and billing analytics
- ✅ Audit log
- ✅ Data export

### End-User Portal
- ✅ Branded chat interface
- ✅ Conversation history
- ✅ Answer citations with source preview
- ✅ Mobile-responsive layout
- ✅ Conversation export
- ✅ Answer feedback (thumbs up/down)

### Document Processing
- ✅ PDF parsing with layout awareness (Google Document AI)
- ✅ DOCX extraction
- ✅ Plain text and Markdown support
- ✅ Page and section metadata on chunks
- ✅ Status tracking (uploading, parsing, indexing, ready, failed)
- ✅ Re-index capability

### Retrieval & Generation
- ✅ Hybrid search (vector + keyword)
- ✅ Reciprocal-rank fusion
- ✅ Lexical reranking
- ✅ Confidence thresholds
- ✅ Refusal behavior (refusing low-confidence answers)
- ✅ Deterministic, OpenAI, and Anthropic LLM providers
- ✅ Grounded prompts with citations
- ✅ SSE streaming responses

### User Management
- ✅ Real signup and login
- ✅ Password reset with email
- ✅ Team member invites
- ✅ Session management (view active sessions, revoke others)
- ✅ Profile editing
- ✅ Role-based access control

### Billing & Quotas
- ✅ Stripe integration (ready)
- ✅ Quota states (under limit, approaching, exceeded)
- ✅ Token usage tracking
- ✅ Cost estimation
- ✅ Invoice history
- ✅ Plan-based feature flags

### Security & Compliance
- ✅ Tenant isolation (strict scoping)
- ✅ Bearer token authentication
- ✅ Password hashing (bcrypt)
- ✅ Session revocation
- ✅ Audit logging
- ✅ Retention policies with cleanup worker
- ✅ Soft deletes with restore capability
- ✅ Data export (GDPR)
- ✅ Tenant suspension/unsuspension (admin)

### Testing
- ✅ API integration tests
- ✅ Auth and session tests
- ✅ Invite acceptance tests
- ✅ Worker ingestion tests
- ✅ Shard routing and isolation tests
- ✅ Playwright E2E smoke tests

---

## 🏭 Deployment

### Local Development
```bash
npm run docker:up        # Start Postgres, Redis, MinIO
npm run dev              # Start React frontend
npm run dev:api          # Start Hono API
```

### Docker Containers
The project includes Dockerfiles for:
- `apps/web` - React + Vite frontend
- `apps/api` - Hono API server
- `apps/worker` - Bull worker

Build and run:
```bash
docker compose up -d --build
```

### Production Deployment (via `/infra`)
- Kubernetes manifests (or selected deployment target)
- Environment variable configuration
- Database backups and restoration runbooks
- Secret management guidance
- Health checks and readiness probes

---

## 🧪 Testing Strategy

### Unit & Integration Tests
```bash
npm run test:api         # API endpoint tests
npm run test:worker      # Worker job tests
npm run test:sharding    # Tenant isolation and shard routing tests
```

### End-to-End Tests
```bash
npm run test:e2e         # Playwright tests (signup, login, chat, etc.)
```

### Validation
```bash
npm run typecheck        # TypeScript strict checking
npm run lint             # ESLint rules
```

---

## 📚 Documentation

- **`AGENTS.md`** - Engineering rules, code quality standards, security, and sharding design
- **`TASKS.md`** - Implementation roadmap, completed work, and next tasks
- **`/docs`** - Architecture deep-dives, deployment guides, and troubleshooting
- **`/design`** - Claude design reference for UI consistency
- **`/infra`** - Deployment manifests and operational runbooks

---

## 🔧 Configuration

### Environment Variables (`.env`)

**Frontend (.env for Docker):**
```env
VITE_API_URL=http://localhost:4000
```

**Backend (.env root):**
```env
DATABASE_URL=postgres://rag:rag@localhost:55432/rag_llm
REDIS_URL=redis://localhost:6379
S3_BUCKET=rag-llm-local
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
STRIPE_SECRET_KEY=sk_test_...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
SENDGRID_API_KEY=sg_...
```

See `.env.example` for full list.

---

## 🚨 Important Notes

### TypeScript & Code Quality
- All code is **strict TypeScript** — no `any` types
- All `.ts` and `.tsx` files must be **under 300 lines**
- ESLint must pass with **zero warnings**
- Keep UI separate from business logic
- Keep database access separate from services

### Tenant Isolation
- **Every query must be scoped by `tenant_id`**
- **Never trust `tenant_id` from client input** — always from authenticated session
- **Test tenant isolation** — run shard routing tests before changes
- **No cross-tenant queries** — use admin endpoints with proper authorization

### Before Committing
```bash
npm run typecheck        # Pass strict TypeScript
npm run lint             # Pass ESLint
npm run build            # Build succeeds
npm run test             # All tests pass
```

---

## 🤝 Contributing

1. Read `AGENTS.md` for engineering standards
2. Follow the code quality rules (strict TypeScript, small files, clear separation)
3. Write tests for new logic, especially tenant isolation and billing
4. Update documentation for public APIs or architectural changes
5. Use the provided development commands to validate before committing

---

## 📝 License

[Add your license here]

---

## 🆘 Troubleshooting

### Docker Services Won't Start
```bash
npm run docker:down
docker system prune -a
npm run docker:up
```

### Type Errors
```bash
npm run typecheck
```

### Database Issues
```bash
npm run docker:down
npm run docker:up
npm run db:migrate
```

### Port Already in Use
- Frontend: 3001
- API: 4000
- Postgres: 55432
- Redis: 6379
- MinIO: 9000 (API), 9001 (Console)

---

**Ready to build? Start with `npm run dev` and `npm run dev:api` in separate terminals!**
