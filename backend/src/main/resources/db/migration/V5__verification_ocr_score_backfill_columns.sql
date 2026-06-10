ALTER TABLE buddy_profiles
    ADD COLUMN IF NOT EXISTS ocr_score double precision;
