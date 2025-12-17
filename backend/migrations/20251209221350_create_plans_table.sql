-- PostgreSQL version
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    price INTEGER NOT NULL, -- in cents
    max_users INTEGER NOT NULL DEFAULT 1,
    features JSONB, -- Using JSONB for better performance
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_plans_name ON plans(name);
