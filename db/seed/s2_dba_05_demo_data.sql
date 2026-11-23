-- =====================================================================
-- S2-DBA-05: Demo data for customer, product, price history
-- Idempotent seed script covering active, soft-deleted, multi-priced,
-- future-priced, and unpriced demo records for Sprint 2 testing.
-- =====================================================================

-- 1. Customers: one active ('C9001') and one soft-deleted ('C9002')
INSERT INTO customer (custno, custname, address, payterm)
VALUES ('C9001', 'Demo Active Corp', 'Ortigas Center, Pasig', '30D'),
       ('C9002', 'Demo Inactive Co', 'BGC, Taguig City', 'COD')
ON CONFLICT (custno) DO NOTHING;

UPDATE customer
SET is_deleted = true
WHERE custno = 'C9002'
  AND NOT is_deleted;

-- 2. Products: multi-price ('DM0001'), unpriced ('DM0002'), and soft-deleted ('DM0003')
INSERT INTO product (prodcode, description, unit)
VALUES ('DM0001', 'Demo Tiered Item', 'ea'),
       ('DM0002', 'Demo Unpriced Item', 'pc'),
       ('DM0003', 'Demo Archived Item', 'pkg')
ON CONFLICT (prodcode) DO NOTHING;

UPDATE product
SET is_deleted = true
WHERE prodcode = 'DM0003'
  AND NOT is_deleted;

-- 3. Price history for DM0001: past price, current price, and future price
INSERT INTO pricehist (effdate, prodcode, unitprice)
VALUES (DATE '2026-01-01', 'DM0001', 100.00),
       (DATE '2026-06-01', 'DM0001', 125.00),
       (DATE '2099-12-31', 'DM0001', 999.00)
ON CONFLICT (effdate, prodcode) DO NOTHING;
