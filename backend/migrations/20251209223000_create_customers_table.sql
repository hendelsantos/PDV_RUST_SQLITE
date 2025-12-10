CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY NOT NULL,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES users(tenant_id) -- Assuming tenant_id is linked to user's tenant_id logic or tenants table
);
