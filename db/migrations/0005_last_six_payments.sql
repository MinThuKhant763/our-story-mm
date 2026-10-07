-- Preserve every previous order and its quoted amount. Earlier references were
-- full references; never reinterpret or truncate them on upgrade.
ALTER TABLE orders ADD COLUMN reference_kind TEXT NOT NULL DEFAULT 'legacy' CHECK (reference_kind IN ('legacy','last6'));
ALTER TABLE orders ADD COLUMN merchant_transaction_id TEXT;
UPDATE orders SET merchant_transaction_id=reference WHERE status IN ('approved','refunded');
DROP INDEX orders_reference_unique;
CREATE INDEX orders_reference_lookup ON orders (reference, amount);
-- A suffix may collide, but a merchant transaction may fund one order only,
-- including after refund. New approvals record the full merchant ID.
CREATE UNIQUE INDEX orders_merchant_transaction_unique ON orders (method, merchant_transaction_id) WHERE merchant_transaction_id IS NOT NULL;
