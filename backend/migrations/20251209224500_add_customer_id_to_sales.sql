-- PostgreSQL version
-- Add customer_id to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE sales ADD CONSTRAINT fk_sales_customer 
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
