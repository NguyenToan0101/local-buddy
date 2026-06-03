DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('TRAVELER', 'ADMIN', 'BUDDY');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meetup_status') THEN
        CREATE TYPE meetup_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('PENDING', 'HELD', 'RELEASED', 'REFUNDED', 'FAILED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_type') THEN
        CREATE TYPE payment_type AS ENUM ('DEPOSIT', 'FULL_PAYMENT', 'REFUND');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payout_status') THEN
        CREATE TYPE payout_status AS ENUM ('PENDING', 'PAID', 'REJECTED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
        CREATE TYPE transaction_type AS ENUM ('INCOME', 'PAYOUT');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
        CREATE TYPE verification_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY,
    email varchar(255) NOT NULL,
    password_hash text NOT NULL,
    full_name varchar(255) NOT NULL,
    phone varchar(20),
    avatar_url text,
    google_avatar_url text,
    role user_role NOT NULL DEFAULT 'TRAVELER',
    is_buddy boolean NOT NULL DEFAULT false,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_email ON users (lower(email));

CREATE TABLE IF NOT EXISTS buddy_profiles (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE,
    age smallint,
    location varchar(255) NOT NULL,
    latitude numeric(10,7),
    longitude numeric(10,7),
    bio text,
    languages varchar(255)[] DEFAULT '{}',
    tags varchar(255)[] DEFAULT '{}',
    interests varchar(255)[] DEFAULT '{}',
    hourly_rate numeric(10,2) NOT NULL,
    rating numeric(2,1) NOT NULL DEFAULT 5.0,
    review_count integer NOT NULL DEFAULT 0,
    verification_status verification_status NOT NULL DEFAULT 'PENDING',
    id_card_front_url text,
    id_card_back_url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tourist_profiles (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE,
    nationality varchar(100),
    bio text,
    languages varchar(255)[] DEFAULT '{}',
    interests varchar(255)[] DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS availability_slots (
    id uuid PRIMARY KEY,
    buddy_id uuid NOT NULL,
    start_time timestamptz NOT NULL,
    end_time timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bookings (
    id uuid PRIMARY KEY,
    traveler_id uuid NOT NULL,
    buddy_id uuid NOT NULL,
    title varchar(255) NOT NULL,
    description text,
    location varchar(255) NOT NULL,
    start_time timestamptz NOT NULL,
    end_time timestamptz NOT NULL,
    total_hours integer NOT NULL,
    guest_count integer NOT NULL DEFAULT 1,
    total_price numeric(10,2) NOT NULL,
    status booking_status NOT NULL DEFAULT 'PENDING',
    meetup_status meetup_status NOT NULL DEFAULT 'NOT_STARTED',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversations (
    id uuid PRIMARY KEY,
    traveler_id uuid NOT NULL,
    buddy_id uuid NOT NULL,
    last_message_id uuid,
    last_message_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
    id uuid PRIMARY KEY,
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    content text NOT NULL,
    is_offer boolean NOT NULL DEFAULT false,
    offered_hours integer,
    offered_price numeric(10,2),
    booking_id uuid,
    is_read boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cancellations (
    id uuid PRIMARY KEY,
    booking_id uuid NOT NULL UNIQUE,
    cancelled_by_user_id uuid NOT NULL,
    reason text,
    refund_amount numeric(10,2) DEFAULT 0,
    cancellation_fee numeric(10,2) DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS earnings_transactions (
    id uuid PRIMARY KEY,
    buddy_id uuid NOT NULL,
    booking_id uuid,
    transaction_type transaction_type NOT NULL,
    amount numeric(10,2) NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS experiences (
    id uuid PRIMARY KEY,
    traveler_id uuid NOT NULL,
    buddy_id uuid NOT NULL,
    title varchar(255) NOT NULL,
    story_content text NOT NULL,
    location varchar(255),
    rating smallint,
    tags varchar(255)[] DEFAULT '{}',
    is_pinned boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS experience_images (
    id uuid PRIMARY KEY,
    experience_id uuid NOT NULL,
    image_url text NOT NULL,
    display_order integer DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY,
    receiver_id uuid NOT NULL,
    sender_id uuid,
    type varchar(100) NOT NULL,
    title varchar(255) NOT NULL,
    content text NOT NULL,
    is_read boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
    id uuid PRIMARY KEY,
    booking_id uuid NOT NULL,
    payer_id uuid NOT NULL,
    payment_type payment_type NOT NULL,
    amount numeric(10,2) NOT NULL,
    status payment_status NOT NULL DEFAULT 'PENDING',
    payment_method varchar(100),
    transaction_reference varchar(255),
    created_at timestamptz NOT NULL DEFAULT now(),
    paid_at timestamptz
);

CREATE TABLE IF NOT EXISTS payout_requests (
    id uuid PRIMARY KEY,
    buddy_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    tax_rate numeric(5,2) NOT NULL DEFAULT 10.00,
    status payout_status NOT NULL DEFAULT 'PENDING',
    bank_name varchar(255) NOT NULL,
    bank_account_name varchar(255) NOT NULL,
    bank_account_number varchar(100) NOT NULL,
    requested_at timestamptz NOT NULL DEFAULT now(),
    processed_at timestamptz
);

CREATE TABLE IF NOT EXISTS reviews (
    id uuid PRIMARY KEY,
    booking_id uuid NOT NULL,
    reviewer_id uuid NOT NULL,
    reviewee_id uuid NOT NULL,
    rating smallint NOT NULL,
    comment text,
    is_public boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_reports (
    id uuid PRIMARY KEY,
    reported_user_id uuid NOT NULL,
    reporter_id uuid NOT NULL,
    reason varchar(255) NOT NULL,
    description text,
    evidence_url text,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE buddy_profiles
    ADD CONSTRAINT fk_buddy_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE tourist_profiles
    ADD CONSTRAINT fk_tourist_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE availability_slots
    ADD CONSTRAINT fk_availability_slots_buddy
    FOREIGN KEY (buddy_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE bookings
    ADD CONSTRAINT fk_bookings_traveler
    FOREIGN KEY (traveler_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE bookings
    ADD CONSTRAINT fk_bookings_buddy
    FOREIGN KEY (buddy_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE conversations
    ADD CONSTRAINT fk_conversations_traveler
    FOREIGN KEY (traveler_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE conversations
    ADD CONSTRAINT fk_conversations_buddy
    FOREIGN KEY (buddy_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE messages
    ADD CONSTRAINT fk_messages_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
ALTER TABLE messages
    ADD CONSTRAINT fk_messages_sender
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE messages
    ADD CONSTRAINT fk_messages_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
ALTER TABLE conversations
    ADD CONSTRAINT fk_conversations_last_message
    FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL;
ALTER TABLE cancellations
    ADD CONSTRAINT fk_cancellations_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;
ALTER TABLE cancellations
    ADD CONSTRAINT fk_cancellations_cancelled_by
    FOREIGN KEY (cancelled_by_user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE earnings_transactions
    ADD CONSTRAINT fk_earnings_transactions_buddy
    FOREIGN KEY (buddy_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE earnings_transactions
    ADD CONSTRAINT fk_earnings_transactions_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
ALTER TABLE experiences
    ADD CONSTRAINT fk_experiences_traveler
    FOREIGN KEY (traveler_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE experiences
    ADD CONSTRAINT fk_experiences_buddy
    FOREIGN KEY (buddy_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE experience_images
    ADD CONSTRAINT fk_experience_images_experience
    FOREIGN KEY (experience_id) REFERENCES experiences(id) ON DELETE CASCADE;
ALTER TABLE notifications
    ADD CONSTRAINT fk_notifications_receiver
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE notifications
    ADD CONSTRAINT fk_notifications_sender
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE payments
    ADD CONSTRAINT fk_payments_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;
ALTER TABLE payments
    ADD CONSTRAINT fk_payments_payer
    FOREIGN KEY (payer_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE payout_requests
    ADD CONSTRAINT fk_payout_requests_buddy
    FOREIGN KEY (buddy_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE reviews
    ADD CONSTRAINT fk_reviews_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;
ALTER TABLE reviews
    ADD CONSTRAINT fk_reviews_reviewer
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE reviews
    ADD CONSTRAINT fk_reviews_reviewee
    FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_reports
    ADD CONSTRAINT fk_user_reports_reported_user
    FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_reports
    ADD CONSTRAINT fk_user_reports_reporter
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS ix_bookings_traveler ON bookings (traveler_id);
CREATE INDEX IF NOT EXISTS ix_bookings_buddy ON bookings (buddy_id);
CREATE INDEX IF NOT EXISTS ix_conversations_traveler ON conversations (traveler_id);
CREATE INDEX IF NOT EXISTS ix_conversations_buddy ON conversations (buddy_id);
CREATE INDEX IF NOT EXISTS ix_messages_conversation ON messages (conversation_id);
CREATE INDEX IF NOT EXISTS ix_experiences_buddy ON experiences (buddy_id);
CREATE INDEX IF NOT EXISTS ix_notifications_receiver ON notifications (receiver_id);
