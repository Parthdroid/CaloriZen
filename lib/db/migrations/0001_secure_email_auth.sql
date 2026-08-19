ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_normalized varchar(255),
  ADD COLUMN IF NOT EXISTS session_version integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE users
SET email_normalized = lower(btrim(email))
WHERE email_normalized IS NULL;

ALTER TABLE users
  ALTER COLUMN email_normalized SET NOT NULL;

CREATE INDEX IF NOT EXISTS users_email_normalized_idx
  ON users (email_normalized);

CREATE TABLE IF NOT EXISTS account_email_addresses (
  email_normalized varchar(255) PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS account_email_addresses_user_id_unique
  ON account_email_addresses (user_id);

-- Only reserve an address automatically when it maps to exactly one legacy
-- account. Ambiguous addresses require a manual ownership review; choosing one
-- automatically could attach another person's meals to the wrong account.
INSERT INTO account_email_addresses (email_normalized, user_id)
SELECT email_normalized, min(id)
FROM users
WHERE email_normalized <> ''
GROUP BY email_normalized
HAVING count(*) = 1
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS password_credentials (
  user_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS apple_identities (
  subject varchar(255) PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS apple_identities_user_id_unique
  ON apple_identities (user_id);

-- Do not import legacy Apple provider IDs as authenticated identities. The old
-- endpoint accepted these values from the client without verifying the Apple
-- identity token. The new endpoint links a legacy row only after Apple proves
-- ownership of the matching subject.

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token_hash varchar(64) PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT password_reset_tokens_hash_length CHECK (length(token_hash) = 64)
);

CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx
  ON password_reset_tokens (user_id);

CREATE INDEX IF NOT EXISTS password_reset_tokens_expires_at_idx
  ON password_reset_tokens (expires_at);

CREATE INDEX IF NOT EXISTS meals_user_id_idx ON meals (user_id);
CREATE INDEX IF NOT EXISTS goals_user_id_idx ON goals (user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'meals_user_id_users_id_fk'
      AND conrelid = 'meals'::regclass
  ) THEN
    ALTER TABLE meals
      ADD CONSTRAINT meals_user_id_users_id_fk
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'goals_user_id_users_id_fk'
      AND conrelid = 'goals'::regclass
  ) THEN
    ALTER TABLE goals
      ADD CONSTRAINT goals_user_id_users_id_fk
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE NOT VALID;
  END IF;
END $$;
