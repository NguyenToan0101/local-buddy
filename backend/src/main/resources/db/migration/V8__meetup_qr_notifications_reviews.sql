ALTER TYPE meetup_status ADD VALUE IF NOT EXISTS 'TRAVELER_ARRIVED';
ALTER TYPE meetup_status ADD VALUE IF NOT EXISTS 'BUDDY_ARRIVED';
ALTER TYPE meetup_status ADD VALUE IF NOT EXISTS 'BOTH_ARRIVED';

ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS meetup_qr_token varchar(255),
    ADD COLUMN IF NOT EXISTS meetup_qr_expires_at timestamptz;

ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS booking_id uuid,
    ADD COLUMN IF NOT EXISTS link_url varchar(500);

CREATE UNIQUE INDEX IF NOT EXISTS ux_payments_transaction_reference
    ON payments (transaction_reference)
    WHERE transaction_reference IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_reviews_booking_reviewer
    ON reviews (booking_id, reviewer_id);
