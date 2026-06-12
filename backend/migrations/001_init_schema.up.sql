CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name    VARCHAR(100)  NOT NULL,
    last_name     VARCHAR(100)  NOT NULL,
    email         VARCHAR(255)  NOT NULL UNIQUE,
    phone_number  VARCHAR(30)   NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);

-- Wallets Table
CREATE TABLE IF NOT EXISTS wallets (
    id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID          NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
    balance    NUMERIC(20,2) NOT NULL DEFAULT 0.00 CONSTRAINT chk_wallets_balance_nonneg CHECK (balance >= 0),
    currency   VARCHAR(3)    NOT NULL DEFAULT 'XAF',
    is_active  BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    reference          VARCHAR(64)   NOT NULL UNIQUE,
    sender_wallet_id   UUID          REFERENCES wallets(id), -- Nullable for CASH_IN
    receiver_wallet_id UUID          REFERENCES wallets(id), -- Nullable for CASH_OUT
    amount             NUMERIC(20,2) NOT NULL CONSTRAINT chk_tx_amount_pos CHECK (amount > 0),
    type               VARCHAR(32)   NOT NULL CONSTRAINT chk_tx_type CHECK (type IN ('TRANSFER', 'CASH_IN', 'CASH_OUT')),
    status             VARCHAR(32)   NOT NULL DEFAULT 'PENDING' CONSTRAINT chk_tx_status CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED')),
    description        TEXT,
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tx_sender   ON transactions(sender_wallet_id);
CREATE INDEX idx_tx_receiver ON transactions(receiver_wallet_id);
CREATE INDEX idx_tx_status   ON transactions(status);
CREATE INDEX idx_tx_created  ON transactions(created_at DESC);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id   UUID        REFERENCES users(id), -- Nullable if anonymous (e.g. failed login attempt)
    action     VARCHAR(100) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    metadata   JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_actor     ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_created   ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action    ON audit_logs(action);
