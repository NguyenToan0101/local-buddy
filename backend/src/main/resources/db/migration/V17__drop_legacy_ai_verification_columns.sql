ALTER TABLE buddy_profiles
    DROP COLUMN IF EXISTS extracted_full_name,
    DROP COLUMN IF EXISTS extracted_id_number,
    DROP COLUMN IF EXISTS extracted_date_of_birth,
    DROP COLUMN IF EXISTS face_match_score,
    DROP COLUMN IF EXISTS liveness_score,
    DROP COLUMN IF EXISTS quality_score,
    DROP COLUMN IF EXISTS anti_spoof_score,
    DROP COLUMN IF EXISTS liveness_details,
    DROP COLUMN IF EXISTS anti_spoof_details,
    DROP COLUMN IF EXISTS quality_details,
    DROP COLUMN IF EXISTS ocr_raw_text,
    DROP COLUMN IF EXISTS ocr_score;
