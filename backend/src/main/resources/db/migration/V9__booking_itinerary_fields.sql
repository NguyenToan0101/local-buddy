ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS booking_type varchar(40) NOT NULL DEFAULT 'PLANNED_ROUTE',
    ADD COLUMN IF NOT EXISTS meeting_point varchar(255),
    ADD COLUMN IF NOT EXISTS route_stops text NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS itinerary_notes text;

CREATE INDEX IF NOT EXISTS ix_bookings_pending_start_time
    ON bookings (status, start_time)
    WHERE status = 'PENDING';
