-- Recreate Products
CREATE TABLE new_products (
    id TEXT PRIMARY KEY NOT NULL,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    sku TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
INSERT INTO new_products (id, tenant_id, name, description, price, stock_quantity, sku, created_at, updated_at) 
SELECT id, tenant_id, name, description, price, stock_quantity, sku, created_at, updated_at FROM products;
DROP TABLE products;
ALTER TABLE new_products RENAME TO products;

-- Recreate Customers
CREATE TABLE new_customers (
    id TEXT PRIMARY KEY NOT NULL,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
INSERT INTO new_customers (id, tenant_id, name, email, phone, notes, created_at, updated_at)
SELECT id, tenant_id, name, email, phone, notes, created_at, updated_at FROM customers;
DROP TABLE customers;
ALTER TABLE new_customers RENAME TO customers;

-- Recreate Sales
CREATE TABLE new_sales (
    id TEXT PRIMARY KEY NOT NULL,
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    total_amount INTEGER NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    customer_id TEXT,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
INSERT INTO new_sales (id, tenant_id, user_id, total_amount, payment_method, status, created_at, customer_id)
SELECT id, tenant_id, user_id, total_amount, payment_method, status, created_at, customer_id FROM sales;
DROP TABLE sales;
ALTER TABLE new_sales RENAME TO sales;
