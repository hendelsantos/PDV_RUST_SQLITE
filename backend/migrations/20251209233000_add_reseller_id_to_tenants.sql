-- PostgreSQL version
-- Add reseller_id to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS reseller_id UUID;
ALTER TABLE tenants ADD CONSTRAINT fk_tenants_reseller 
    FOREIGN KEY (reseller_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tenants_reseller_id ON tenants(reseller_id);
