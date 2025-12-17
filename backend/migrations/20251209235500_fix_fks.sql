-- PostgreSQL version
-- This migration is not needed in PostgreSQL as we already have proper foreign keys
-- PostgreSQL supports foreign keys natively without the need to recreate tables

-- Just ensuring all foreign keys are in place (idempotent)
DO $$ 
BEGIN
    -- Check and add missing foreign keys if needed
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'products_tenant_id_fkey'
    ) THEN
        ALTER TABLE products ADD CONSTRAINT products_tenant_id_fkey 
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'customers_tenant_id_fkey'
    ) THEN
        ALTER TABLE customers ADD CONSTRAINT customers_tenant_id_fkey 
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'sales_tenant_id_fkey'
    ) THEN
        ALTER TABLE sales ADD CONSTRAINT sales_tenant_id_fkey 
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'sales_user_id_fkey'
    ) THEN
        ALTER TABLE sales ADD CONSTRAINT sales_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;
