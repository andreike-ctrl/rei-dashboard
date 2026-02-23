-- ============================================================
-- REI Dashboard — Database Schema
-- Run this migration in your Supabase SQL Editor or via the CLI
-- ============================================================

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  client_id   INT PRIMARY KEY,
  name        TEXT NOT NULL,
  domicile    TEXT,
  email       TEXT,
  phone       TEXT,
  address     TEXT
);

-- Investors
CREATE TABLE IF NOT EXISTS investors (
  investor_id   INT PRIMARY KEY,
  investor_type TEXT NOT NULL,
  name          TEXT NOT NULL,
  client_id     INT REFERENCES clients (client_id),
  tax_number    TEXT,
  address       TEXT
);

-- Properties
CREATE TABLE IF NOT EXISTS properties (
  property_id      INT PRIMARY KEY,
  name             TEXT NOT NULL,
  entity           TEXT,
  gp               TEXT,
  investment_date  DATE,
  exit_date        DATE,
  asset_class      TEXT,
  strategy         TEXT,
  property_class   TEXT,
  msa              TEXT,
  state            TEXT,
  units            INT,
  buildings        INT,
  beds             TEXT,
  website          TEXT,
  lat              DECIMAL,
  lon              DECIMAL,
  vo2_raise        DECIMAL NOT NULL DEFAULT 0,
  total_equity     DECIMAL NOT NULL DEFAULT 0,
  total_debt       DECIMAL NOT NULL DEFAULT 0,
  purchase_price   DECIMAL NOT NULL DEFAULT 0,
  projected_lp_irr DECIMAL NOT NULL DEFAULT 0,
  projected_irr    DECIMAL NOT NULL DEFAULT 0,
  projected_multiple DECIMAL NOT NULL DEFAULT 0,
  senior_loan_rate DECIMAL NOT NULL DEFAULT 0
);

-- Valuations
CREATE TABLE IF NOT EXISTS valuations (
  valuation_id     INT PRIMARY KEY,
  property_id      INT NOT NULL REFERENCES properties (property_id),
  date             DATE NOT NULL,
  units_outstanding DECIMAL NOT NULL DEFAULT 0,
  nav              DECIMAL NOT NULL DEFAULT 0,
  nav_per_unit     DECIMAL GENERATED ALWAYS AS (
    CASE WHEN units_outstanding > 0 THEN nav / units_outstanding ELSE 0 END
  ) STORED
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  transaction_id SERIAL PRIMARY KEY,
  date           DATE NOT NULL,
  investor_id    INT NOT NULL REFERENCES investors (investor_id),
  property_id    INT NOT NULL REFERENCES properties (property_id),
  type           TEXT NOT NULL,
  cash_amount    DECIMAL NOT NULL DEFAULT 0,
  units          DECIMAL,
  nav_per_unit   DECIMAL,
  notes          TEXT
);

-- Metrics
CREATE TABLE IF NOT EXISTS metrics (
  metric_id    INT PRIMARY KEY,
  property_id  INT NOT NULL REFERENCES properties (property_id),
  as_of_date   DATE NOT NULL,
  metric_type  TEXT NOT NULL,
  metric_value DECIMAL NOT NULL DEFAULT 0,
  units        TEXT,
  notes        TEXT
);

-- ============================================================
-- Indexes for common query patterns
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_valuations_property   ON valuations (property_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_property ON transactions (property_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_investor ON transactions (investor_id);
CREATE INDEX IF NOT EXISTS idx_metrics_property      ON metrics (property_id, as_of_date);
CREATE INDEX IF NOT EXISTS idx_investors_client      ON investors (client_id);

-- ============================================================
-- Row-Level Security (enable but allow public read for now)
-- Tighten these policies when you add authentication
-- ============================================================
ALTER TABLE clients      ENABLE ROW LEVEL SECURITY;
ALTER TABLE investors    ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties   ENABLE ROW LEVEL SECURITY;
ALTER TABLE valuations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics      ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access (suitable for development / demo)
CREATE POLICY "Allow public read" ON clients      FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON investors    FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON properties   FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON valuations   FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON transactions FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON metrics      FOR SELECT USING (true);
