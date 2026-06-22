CREATE TABLE tenant_settings (
  tenant_id uuid PRIMARY KEY REFERENCES tenants (id) ON DELETE CASCADE,
  data_retention_days integer NOT NULL DEFAULT 365,
  allow_source_download boolean NOT NULL DEFAULT false,
  allow_answer_export boolean NOT NULL DEFAULT true,
  require_citations boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO tenant_settings (tenant_id)
SELECT id FROM tenants
ON CONFLICT (tenant_id) DO NOTHING;
