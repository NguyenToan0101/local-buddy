CREATE TABLE IF NOT EXISTS pending_registrations (
    id uuid PRIMARY KEY,
    email varchar(255) NOT NULL,
    full_name varchar(255) NOT NULL,
    password_hash text NOT NULL,
    role user_role NOT NULL,
    otp_hash text NOT NULL,
    attempt_count integer NOT NULL DEFAULT 0,
    resend_count integer NOT NULL DEFAULT 0,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_pending_registrations_email
    ON pending_registrations (lower(email));

CREATE INDEX IF NOT EXISTS ix_pending_registrations_expires_at
    ON pending_registrations (expires_at);
