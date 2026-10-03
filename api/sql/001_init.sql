CREATE TABLE IF NOT EXISTS backups (
  id UUID PRIMARY KEY,
  token_hash CHAR(64) NOT NULL,
  ciphertext TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
