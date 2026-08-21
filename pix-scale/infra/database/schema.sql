-- Extensão para geração de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    cpf VARCHAR(11) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number_account VARCHAR(20) UNIQUE NOT NULL,
    balance NUMERIC(15, 2) NOT NULL DEFAULT 1000.00,
    daily_limit NUMERIC(15, 2) NOT NULL DEFAULT 1000.00,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    origin_account_id UUID NOT NULL,
    destination_account_id UUID NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, FAILED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_origin_account FOREIGN KEY (origin_account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
    CONSTRAINT fk_destination_account FOREIGN KEY (destination_account_id) REFERENCES accounts(id) ON DELETE RESTRICT    
);
