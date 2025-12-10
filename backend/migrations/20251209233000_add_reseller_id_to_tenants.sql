ALTER TABLE tenants ADD COLUMN reseller_id TEXT REFERENCES users(id);
