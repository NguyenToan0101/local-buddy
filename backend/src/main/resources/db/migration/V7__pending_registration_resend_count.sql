ALTER TABLE pending_registrations
    ADD COLUMN IF NOT EXISTS resend_count integer NOT NULL DEFAULT 0;
