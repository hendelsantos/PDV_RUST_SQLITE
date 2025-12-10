CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY NOT NULL,
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    total_amount INTEGER NOT NULL, -- in cents
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES users(tenant_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS sale_items (
    id TEXT PRIMARY KEY NOT NULL,
    sale_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price INTEGER NOT NULL, -- price at moment of sale
    subtotal INTEGER NOT NULL, -- quantity * unit_price
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
