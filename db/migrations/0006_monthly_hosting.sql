-- Existing quotations keep the annual hosting period. Only new orders are monthly.
ALTER TABLE orders ADD COLUMN billing_period TEXT NOT NULL DEFAULT 'annual' CHECK (billing_period IN ('annual','monthly'));
