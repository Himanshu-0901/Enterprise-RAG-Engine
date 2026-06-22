ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS password_reset_token_hash text,
  ADD COLUMN IF NOT EXISTS password_reset_expires_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS app_users_password_reset_token_idx
  ON app_users (password_reset_token_hash)
  WHERE password_reset_token_hash IS NOT NULL;
