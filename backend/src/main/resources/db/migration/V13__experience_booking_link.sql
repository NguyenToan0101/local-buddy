ALTER TABLE experiences
    ADD COLUMN IF NOT EXISTS booking_id uuid;

ALTER TABLE experiences
    ADD CONSTRAINT fk_experiences_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ix_experiences_booking ON experiences (booking_id);
