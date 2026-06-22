CREATE TABLE tenant_shard_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  shard_key text NOT NULL DEFAULT 'primary',
  bucket integer NOT NULL,
  database_url_secret text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX tenant_shard_assignments_tenant_idx
  ON tenant_shard_assignments (tenant_id);
