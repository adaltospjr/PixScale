CREATE TABLE IF NOT EXISTS gateway_idempotency_keys (
    idempotency_key UUID PRIMARY KEY,
    request_hash CHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);