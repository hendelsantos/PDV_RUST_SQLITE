-- PostgreSQL version
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    plan_id UUID,
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, inactive, suspended
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL
);

CREATE INDEX idx_tenants_plan_id ON tenants(plan_id);
CREATE INDEX idx_tenants_status ON tenants(status);
