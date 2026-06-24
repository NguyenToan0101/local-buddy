ALTER TABLE tourist_profiles
    ADD COLUMN IF NOT EXISTS e_visa_number varchar(120),
    ADD COLUMN IF NOT EXISTS e_visa_country varchar(120),
    ADD COLUMN IF NOT EXISTS e_visa_expiry_date varchar(40),
    ADD COLUMN IF NOT EXISTS e_visa_evidence_url text;
