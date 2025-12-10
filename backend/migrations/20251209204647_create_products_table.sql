CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY NOT NULL,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL, -- in cents
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    sku TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES users(tenant_id)
);
