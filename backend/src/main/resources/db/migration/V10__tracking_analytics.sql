CREATE TABLE IF NOT EXISTS visitor_sessions (
    id uuid PRIMARY KEY,
    session_key varchar(255) NOT NULL UNIQUE,
    user_id uuid,
    traffic_source varchar(100),
    ip_address varchar(100),
    user_agent text,
    referrer text,
    landing_page text,
    device_type varchar(50),
    first_visit_at timestamptz NOT NULL DEFAULT now(),
    last_visit_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_events (
    id uuid PRIMARY KEY,
    session_key varchar(255) NOT NULL,
    user_id uuid,
    event_type varchar(100) NOT NULL,
    page_url text,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE visitor_sessions
    ADD CONSTRAINT fk_visitor_sessions_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE user_events
    ADD CONSTRAINT fk_user_events_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ix_visitor_sessions_user ON visitor_sessions (user_id);
CREATE INDEX IF NOT EXISTS ix_visitor_sessions_traffic_source ON visitor_sessions (traffic_source);
CREATE INDEX IF NOT EXISTS ix_visitor_sessions_last_visit ON visitor_sessions (last_visit_at DESC);
CREATE INDEX IF NOT EXISTS ix_user_events_session_key ON user_events (session_key);
CREATE INDEX IF NOT EXISTS ix_user_events_user ON user_events (user_id);
CREATE INDEX IF NOT EXISTS ix_user_events_event_type ON user_events (event_type);
CREATE INDEX IF NOT EXISTS ix_user_events_created_at ON user_events (created_at DESC);
