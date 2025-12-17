-- PostgreSQL version
-- Add business_type to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_tenants_business_type ON tenants(business_type);
