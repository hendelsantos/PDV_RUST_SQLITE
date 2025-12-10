-- Add custom_fields JSON column to tenants table for business-specific data
ALTER TABLE tenants ADD COLUMN custom_fields TEXT DEFAULT '{}';

-- Add updated_at column to tenants if not exists (for tracking field changes)
ALTER TABLE tenants ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
