CREATE TYPE tenant_plan AS ENUM ('starter', 'pro', 'enterprise');
CREATE TYPE tenant_status AS ENUM ('active', 'trialing', 'suspended');
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'end_user', 'platform_admin');
CREATE TYPE membership_status AS ENUM ('invited', 'active', 'disabled');
CREATE TYPE document_format AS ENUM ('pdf', 'docx', 'txt', 'md', 'html');
CREATE TYPE document_status AS ENUM (
  'queued',
  'parsing',
  'indexing',
  'ready',
  'failed',
  'deleted'
);
CREATE TYPE message_role AS ENUM ('user', 'assistant');
CREATE TYPE usage_event_type AS ENUM (
  'query',
  'document_upload',
  'document_indexed',
  'end_user_invited',
  'citation_clicked'
);

CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  plan tenant_plan NOT NULL DEFAULT 'starter',
  status tenant_status NOT NULL DEFAULT 'trialing',
  document_limit integer NOT NULL DEFAULT 100,
  monthly_query_limit integer NOT NULL DEFAULT 1000,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX tenants_slug_idx ON tenants (slug);

CREATE TABLE app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX app_users_email_idx ON app_users (email);

CREATE TABLE tenant_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_users (id) ON DELETE CASCADE,
  role user_role NOT NULL,
  status membership_status NOT NULL DEFAULT 'invited',
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX tenant_memberships_member_idx
  ON tenant_memberships (tenant_id, user_id);

CREATE TABLE tenant_branding (
  tenant_id uuid PRIMARY KEY REFERENCES tenants (id) ON DELETE CASCADE,
  portal_name text NOT NULL,
  primary_color text NOT NULL,
  accent_color text NOT NULL,
  logo_object_key text,
  welcome_message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  name text NOT NULL,
  format document_format NOT NULL,
  status document_status NOT NULL DEFAULT 'queued',
  storage_key text NOT NULL,
  page_count integer NOT NULL DEFAULT 0,
  chunk_count integer NOT NULL DEFAULT 0,
  failure_reason text,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  last_indexed_at timestamptz
);

CREATE INDEX documents_tenant_status_idx ON documents (tenant_id, status);

CREATE TABLE document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents (id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  page_number integer,
  section_title text,
  content text NOT NULL,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX document_chunks_tenant_document_idx
  ON document_chunks (tenant_id, document_id);

CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_users (id) ON DELETE CASCADE,
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX conversations_tenant_user_idx ON conversations (tenant_id, user_id);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  role message_role NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX messages_conversation_idx ON messages (tenant_id, conversation_id);

CREATE TABLE citations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES messages (id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents (id) ON DELETE CASCADE,
  chunk_id uuid NOT NULL REFERENCES document_chunks (id) ON DELETE CASCADE,
  page_number integer,
  snippet text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX citations_message_idx ON citations (tenant_id, message_id);

CREATE TABLE usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  type usage_event_type NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX usage_events_tenant_type_idx ON usage_events (tenant_id, type);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants (id) ON DELETE CASCADE,
  actor_user_id uuid,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_logs_tenant_action_idx ON audit_logs (tenant_id, action);
