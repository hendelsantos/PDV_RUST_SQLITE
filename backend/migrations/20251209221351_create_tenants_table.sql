CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    plan_id TEXT,
    status TEXT NOT NULL DEFAULT 'active', -- active, inactive, suspended
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES plans(id)
);
