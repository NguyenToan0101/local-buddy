ALTER TYPE verification_status ADD VALUE IF NOT EXISTS 'PROCESSING';
ALTER TYPE verification_status ADD VALUE IF NOT EXISTS 'AUTO_APPROVED';
ALTER TYPE verification_status ADD VALUE IF NOT EXISTS 'MANUAL_REVIEW';
ALTER TYPE verification_status ADD VALUE IF NOT EXISTS 'AUTO_REJECTED';
ALTER TYPE verification_status ADD VALUE IF NOT EXISTS 'MANUAL_APPROVED';
ALTER TYPE verification_status ADD VALUE IF NOT EXISTS 'MANUAL_REJECTED';

ALTER TABLE buddy_profiles
    ADD COLUMN IF NOT EXISTS selfie_url text,
    ADD COLUMN IF NOT EXISTS extracted_full_name varchar(255),
    ADD COLUMN IF NOT EXISTS extracted_id_number varchar(255),
    ADD COLUMN IF NOT EXISTS extracted_date_of_birth varchar(255),
    ADD COLUMN IF NOT EXISTS face_match_score double precision,
    ADD COLUMN IF NOT EXISTS liveness_score double precision,
    ADD COLUMN IF NOT EXISTS verification_score double precision,
    ADD COLUMN IF NOT EXISTS rejection_reason text,
    ADD COLUMN IF NOT EXISTS verified_at timestamptz,
    ADD COLUMN IF NOT EXISTS processed_at timestamptz,
    ADD COLUMN IF NOT EXISTS auto_verification_message text,
    ADD COLUMN IF NOT EXISTS quality_score double precision,
    ADD COLUMN IF NOT EXISTS anti_spoof_score double precision,
    ADD COLUMN IF NOT EXISTS risk_score double precision,
    ADD COLUMN IF NOT EXISTS risk_reason text,
    ADD COLUMN IF NOT EXISTS duplicate_detected boolean,
    ADD COLUMN IF NOT EXISTS duplicate_user_id uuid,
    ADD COLUMN IF NOT EXISTS liveness_details text,
    ADD COLUMN IF NOT EXISTS anti_spoof_details text,
    ADD COLUMN IF NOT EXISTS quality_details text,
    ADD COLUMN IF NOT EXISTS ocr_raw_text text;
