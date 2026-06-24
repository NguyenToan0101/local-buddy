ALTER TABLE tourist_profiles
    ADD COLUMN IF NOT EXISTS verification_status verification_status NOT NULL DEFAULT 'PENDING';

UPDATE tourist_profiles
SET verification_status = 'PENDING'
WHERE verification_status IS NULL;

CREATE INDEX IF NOT EXISTS ix_tourist_profiles_verification_status_updated
    ON tourist_profiles (verification_status, updated_at);
