ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS live_started_at timestamptz;
