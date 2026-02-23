-- ============================================================
-- REI Dashboard — Demo Database
-- Single-file setup for a demo Supabase project
-- Contains: full schema + fictional seed data
--
-- Instructions:
--   1. Open your demo Supabase project → SQL Editor
--   2. Paste and run this entire file
--   3. Copy the project URL + anon key into .env.demo
-- ============================================================


-- ============================================================
-- SCHEMA
-- ============================================================

CREATE TABLE IF NOT EXISTS clients (
  client_id   INT PRIMARY KEY,
  name        TEXT NOT NULL,
  domicile    TEXT,
  email       TEXT,
  phone       TEXT,
  address     TEXT
);

CREATE TABLE IF NOT EXISTS investors (
  investor_id   INT PRIMARY KEY,
  investor_type TEXT NOT NULL,
  name          TEXT NOT NULL,
  client_id     INT REFERENCES clients (client_id),
  tax_number    TEXT,
  address       TEXT
);

CREATE TABLE IF NOT EXISTS properties (
  property_id        INT PRIMARY KEY,
  name               TEXT NOT NULL,
  entity             TEXT,
  gp                 TEXT,
  investment_date    DATE,
  exit_date          DATE,
  asset_class        TEXT,
  strategy           TEXT,
  property_class     TEXT,
  msa                TEXT,
  state              TEXT,
  units              INT,
  buildings          INT,
  beds               TEXT,
  website            TEXT,
  lat                DECIMAL,
  lon                DECIMAL,
  vo2_raise          DECIMAL NOT NULL DEFAULT 0,
  total_equity       DECIMAL NOT NULL DEFAULT 0,
  total_debt         DECIMAL NOT NULL DEFAULT 0,
  purchase_price     DECIMAL NOT NULL DEFAULT 0,
  projected_lp_irr   DECIMAL NOT NULL DEFAULT 0,
  projected_irr      DECIMAL NOT NULL DEFAULT 0,
  projected_multiple DECIMAL NOT NULL DEFAULT 0,
  senior_loan_rate   DECIMAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS valuations (
  valuation_id      INT PRIMARY KEY,
  property_id       INT NOT NULL REFERENCES properties (property_id),
  date              DATE NOT NULL,
  units_outstanding DECIMAL NOT NULL DEFAULT 0,
  nav               DECIMAL NOT NULL DEFAULT 0,
  nav_per_unit      DECIMAL GENERATED ALWAYS AS (
    CASE WHEN units_outstanding > 0 THEN nav / units_outstanding ELSE 0 END
  ) STORED
);

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

CREATE TABLE IF NOT EXISTS metrics (
  metric_id    INT PRIMARY KEY,
  property_id  INT NOT NULL REFERENCES properties (property_id),
  as_of_date   DATE NOT NULL,
  metric_type  TEXT NOT NULL,
  metric_value DECIMAL NOT NULL DEFAULT 0,
  units        TEXT,
  notes        TEXT
);

CREATE TABLE IF NOT EXISTS property_locations (
  location_id SERIAL PRIMARY KEY,
  property_id INT NOT NULL REFERENCES properties (property_id),
  label       TEXT,
  lat         DECIMAL NOT NULL,
  lon         DECIMAL NOT NULL,
  type        TEXT NOT NULL DEFAULT 'building'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_valuations_property   ON valuations (property_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_property ON transactions (property_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_investor ON transactions (investor_id);
CREATE INDEX IF NOT EXISTS idx_metrics_property      ON metrics (property_id, as_of_date);
CREATE INDEX IF NOT EXISTS idx_investors_client      ON investors (client_id);

-- Row-Level Security
ALTER TABLE clients            ENABLE ROW LEVEL SECURITY;
ALTER TABLE investors          ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties         ENABLE ROW LEVEL SECURITY;
ALTER TABLE valuations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics            ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON clients            FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON investors          FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON properties         FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON valuations         FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON transactions       FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON metrics            FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON property_locations FOR SELECT USING (true);

-- Allow inserts for the transaction input form
CREATE POLICY "Allow public insert" ON transactions FOR INSERT WITH CHECK (true);


-- ============================================================
-- DEMO DATA — Fictional, for presentation purposes only
-- ============================================================

-- Clients
INSERT INTO clients (client_id, name, domicile, email, phone, address) VALUES
  (1, 'Meridian Family Office',   'Delaware', 'info@meridianfo.com',    '(212) 555-0101', '200 Liberty Street, New York, NY 10281'),
  (2, 'Coastal Capital Partners', 'Florida',  'contact@coastalcap.com', '(305) 555-0202', '1221 Brickell Ave, Miami, FL 33131'),
  (3, 'Summit Investment Group',  'Texas',    'hello@summitinv.com',    '(214) 555-0303', '3000 McKinney Ave, Dallas, TX 75204');

-- Investors
INSERT INTO investors (investor_id, investor_type, name, client_id, tax_number, address) VALUES
  (1, 'LLC',    'Meridian RE Fund I LLC',      1, '83-1111111', '200 Liberty Street, New York, NY 10281'),
  (2, 'LLC',    'Meridian RE Fund II LLC',     1, '83-2222222', '200 Liberty Street, New York, NY 10281'),
  (3, 'C-Corp', 'Coastal RE Holdings Corp',   2, '59-3333333', '1221 Brickell Ave, Miami, FL 33131'),
  (4, 'LP',     'Summit Opportunity Fund LP', 3, '75-4444444', '3000 McKinney Ave, Dallas, TX 75204');

-- Properties
-- Investor ownership map (for transactions below):
--   Investor 1 (Meridian Fund I):  properties 1, 3, 8
--   Investor 2 (Meridian Fund II): properties 2, 5, 7
--   Investor 3 (Coastal):          properties 4, 6, 9
--   Investor 4 (Summit):           properties 10, 11, 12, 13
INSERT INTO properties (
  property_id, name, entity, gp,
  investment_date, exit_date,
  asset_class, strategy, property_class,
  msa, state, units, buildings, beds, website,
  lat, lon,
  vo2_raise, total_equity, total_debt, purchase_price,
  projected_lp_irr, projected_irr, projected_multiple, senior_loan_rate
) VALUES
  (1,  'Lakeview Commons',           'Apex LKV LLC',          'Blue Ridge Capital',     '2019-12-15', NULL, 'Multifamily', 'High Value Add',  'C-', 'Gainesville',                            'FL',       72,  14, NULL,  NULL,                                    29.72, -82.37,   290000,   1550000,    2100000,    3100000, 0.24, 0, 2.80, 0.05),
  (2,  'Tallahassee Flats',          'Apex Talla LLC',         'Blue Ridge Capital',     '2020-11-15', NULL, 'Multifamily', 'Light Value Add', 'C+', 'Tallahassee',                            'FL',      128,  32, NULL,  NULL,                                    NULL,  NULL,    850000,   4400000,    7400000,   10600000, 0.14, 0, 2.10, 0.04),
  (3,  'Campus Crossing',            'Apex Semi LLC',          'Blue Ridge Capital',     '2021-03-15', NULL, 'Student',     'Light Value Add', 'B-', 'Tallahassee',                            'FL',      264,  54, '320', 'https://example.com/campuscrossing',    30.44, -84.33,   850000,   6600000,   11700000,   16500000, 0.14, 0, 2.17, 0.05),
  (4,  'Brookhaven Apartments',      'Apex Mill LLC',          'Blue Ridge Capital',     '2021-07-01', NULL, 'Multifamily', 'Light Value Add', 'B-', 'Gainesville',                            'FL',       40,  10, NULL,  NULL,                                    29.63, -82.36,   460000,   1560000,    2000000,    3000000, 0.15, 0, 2.42, 0.04),
  (5,  'Barton Creek Villas',        'Apex MRB LLC',           'Leste Capital Partners', '2021-10-26', NULL, 'Multifamily', 'Light Value Add', 'B-', 'Austin',                                 'TX',      542,   2, NULL,  NULL,                                    NULL,  NULL,  1050000,  32500000,   97000000,  117000000, 0.15, 0, 1.70, 0),
  (6,  'Orange Blossom Heights',     'Leste US Feeder LLC',    'Leste Capital Partners', '2021-12-20', NULL, 'Multifamily', 'Light Value Add', 'B+', 'Orlando',                                'FL',      328,  16, NULL,  NULL,                                    NULL,  NULL,  1050000,  18500000,   63000000,   75000000, 0.16, 0, 1.80, 0),
  (7,  'Sunbelt Multi-Portfolio',    'Leste TX South LLC',     'Leste Capital Partners', '2022-01-15', NULL, 'Multifamily', 'Light Value Add', 'B+', 'Dallas, Houston, Nashville, Greenville', 'TX, TN, SC', 1680, 5, NULL, NULL,                                  NULL,  NULL,  1600000,  82000000,  315000000,  379000000, 0.16, 0, 0,    0),
  (8,  'Riverside Business Center',  'PRM Jax LLC',            'Pacific Rim Management', '2020-12-10', NULL, 'Office',      'High Value Add',  'A+', 'Jacksonville',                           'FL',     NULL,   1, NULL,  NULL,                                    NULL,  NULL,   265000,  47000000,   47500000,   79000000, 0.12, 0, 1.95, 0),
  (9,  'Great Lakes Office Portfolio','PRM Portfolio IX LLC',  'Pacific Rim Management', '2021-03-20', NULL, 'Office',      'High Value Add',  'A+', 'Milwaukee & Detroit',                    'WI, MI', NULL,   6, NULL,  NULL,                                    NULL,  NULL,   160000,  56000000,   64000000,   98000000, 0.14, 0, 2.10, 0),
  (10, 'Palmetto Pointe',            'Apex ORL LLC',           'Blue Ridge Capital',     '2022-03-15', NULL, 'Multifamily', 'Light Value Add', 'B-', 'Tallahassee',                            'FL',      100,  14, '252', 'https://example.com/palmettopolnte',    30.49, -84.35,  1050000,   5550000,    6700000,   10750000, 0.15, 0, 2.30, 0.04),
  (11, 'Gulf Coast Multi-Portfolio', 'Apex FLNM LLC',          'Blue Ridge Capital',     '2022-11-01', NULL, 'Multifamily', 'High Value Add',  'B-', 'Tallahassee, Lake City & Albuquerque',   'FL, NM',  460,  28, '644', NULL,                                    NULL,  NULL,  3250000,  18700000,   22900000,   38000000, 0.14, 0, 0,    0.04),
  (12, 'University Village',         'Apex Social LLC',        'Blue Ridge Capital',     '2023-02-01', NULL, 'Student',     'Light Value Add', 'B-', 'Tallahassee',                            'FL',       76,  20, '184', 'https://example.com/universityvillage', 30.45, -84.30,   740000,   3550000,    7100000,    9800000, 0.15, 0, 2.23, 0.04),
  (13, 'Aggie Landing',              'Apex A&M LLC',           'Blue Ridge Capital',     '2024-05-01', NULL, 'Student',     'Light Value Add', 'C+', 'College Station',                        'TX',      160,  14, '220', 'https://example.com/aggielanding',      30.60, -96.34,   600000,   7100000,   11400000,   16400000, 0.14, 0, 2.06, 0.04);

-- Valuations (quarterly NAV snapshots, all amounts in USD)
-- Units outstanding = raise / 1000; NAV starts at raise and appreciates
INSERT INTO valuations (valuation_id, property_id, date, units_outstanding, nav) VALUES

  -- Lakeview Commons (property 1) — invested Dec 2019, units=290
  (1,  1, '2020-03-31',  290,  290000),
  (2,  1, '2020-06-30',  290,  298000),
  (3,  1, '2020-09-30',  290,  307000),
  (4,  1, '2020-12-31',  290,  316000),
  (5,  1, '2021-03-31',  290,  326000),
  (6,  1, '2021-06-30',  290,  337000),
  (7,  1, '2021-09-30',  290,  349000),
  (8,  1, '2021-12-31',  290,  362000),
  (9,  1, '2022-03-31',  290,  376000),
  (10, 1, '2022-06-30',  290,  391000),
  (11, 1, '2022-09-30',  290,  407000),
  (12, 1, '2022-12-31',  290,  424000),
  (13, 1, '2023-03-31',  290,  441000),
  (14, 1, '2023-06-30',  290,  460000),
  (15, 1, '2023-09-30',  290,  480000),
  (16, 1, '2023-12-31',  290,  500000),
  (17, 1, '2024-03-31',  290,  515000),
  (18, 1, '2024-06-30',  290,  530000),
  (19, 1, '2024-09-30',  290,  545000),

  -- Tallahassee Flats (property 2) — invested Nov 2020, units=850
  (20, 2, '2021-03-31',  850,  850000),
  (21, 2, '2021-06-30',  850,  880000),
  (22, 2, '2021-09-30',  850,  911000),
  (23, 2, '2021-12-31',  850,  944000),
  (24, 2, '2022-03-31',  850,  978000),
  (25, 2, '2022-06-30',  850, 1013000),
  (26, 2, '2022-09-30',  850, 1050000),
  (27, 2, '2022-12-31',  850, 1089000),
  (28, 2, '2023-03-31',  850, 1130000),
  (29, 2, '2023-06-30',  850, 1172000),
  (30, 2, '2023-09-30',  850, 1216000),
  (31, 2, '2023-12-31',  850, 1261000),
  (32, 2, '2024-03-31',  850, 1308000),
  (33, 2, '2024-06-30',  850, 1356000),
  (34, 2, '2024-09-30',  850, 1406000),

  -- Campus Crossing (property 3) — invested Mar 2021, units=850
  (35, 3, '2021-06-30',  850,  850000),
  (36, 3, '2021-09-30',  850,  880000),
  (37, 3, '2021-12-31',  850,  911000),
  (38, 3, '2022-03-31',  850,  943000),
  (39, 3, '2022-06-30',  850,  977000),
  (40, 3, '2022-09-30',  850, 1012000),
  (41, 3, '2022-12-31',  850, 1048000),
  (42, 3, '2023-03-31',  850, 1086000),
  (43, 3, '2023-06-30',  850, 1125000),
  (44, 3, '2023-09-30',  850, 1165000),
  (45, 3, '2023-12-31',  850, 1207000),
  (46, 3, '2024-03-31',  850, 1250000),
  (47, 3, '2024-06-30',  850, 1294000),
  (48, 3, '2024-09-30',  850, 1340000),

  -- Brookhaven Apartments (property 4) — invested Jul 2021, units=460
  (49, 4, '2021-09-30',  460,  460000),
  (50, 4, '2021-12-31',  460,  476000),
  (51, 4, '2022-03-31',  460,  493000),
  (52, 4, '2022-06-30',  460,  511000),
  (53, 4, '2022-09-30',  460,  529000),
  (54, 4, '2022-12-31',  460,  548000),
  (55, 4, '2023-03-31',  460,  568000),
  (56, 4, '2023-06-30',  460,  589000),
  (57, 4, '2023-09-30',  460,  611000),
  (58, 4, '2023-12-31',  460,  634000),
  (59, 4, '2024-03-31',  460,  657000),
  (60, 4, '2024-06-30',  460,  681000),
  (61, 4, '2024-09-30',  460,  706000),

  -- Barton Creek Villas (property 5) — invested Oct 2021, units=1050
  (62, 5, '2022-03-31', 1050, 1050000),
  (63, 5, '2022-06-30', 1050, 1079000),
  (64, 5, '2022-09-30', 1050, 1088000),
  (65, 5, '2022-12-31', 1050, 1110000),
  (66, 5, '2023-03-31', 1050, 1143000),
  (67, 5, '2023-06-30', 1050, 1175000),
  (68, 5, '2023-09-30', 1050, 1209000),
  (69, 5, '2023-12-31', 1050, 1245000),
  (70, 5, '2024-03-31', 1050, 1282000),
  (71, 5, '2024-06-30', 1050, 1320000),
  (72, 5, '2024-09-30', 1050, 1359000),

  -- Orange Blossom Heights (property 6) — invested Dec 2021, units=1050
  (73, 6, '2022-03-31', 1050, 1050000),
  (74, 6, '2022-06-30', 1050, 1072000),
  (75, 6, '2022-09-30', 1050, 1083000),
  (76, 6, '2022-12-31', 1050, 1105000),
  (77, 6, '2023-03-31', 1050, 1130000),
  (78, 6, '2023-06-30', 1050, 1158000),
  (79, 6, '2023-09-30', 1050, 1187000),
  (80, 6, '2023-12-31', 1050, 1218000),
  (81, 6, '2024-03-31', 1050, 1250000),
  (82, 6, '2024-06-30', 1050, 1283000),
  (83, 6, '2024-09-30', 1050, 1317000),

  -- Sunbelt Multi-Portfolio (property 7) — invested Jan 2022, units=1600
  (84, 7, '2022-06-30', 1600, 1600000),
  (85, 7, '2022-09-30', 1600, 1608000),
  (86, 7, '2022-12-31', 1600, 1624000),
  (87, 7, '2023-03-31', 1600, 1655000),
  (88, 7, '2023-06-30', 1600, 1688000),
  (89, 7, '2023-09-30', 1600, 1724000),
  (90, 7, '2023-12-31', 1600, 1762000),
  (91, 7, '2024-03-31', 1600, 1801000),
  (92, 7, '2024-06-30', 1600, 1841000),
  (93, 7, '2024-09-30', 1600, 1883000),

  -- Riverside Business Center (property 8) — invested Dec 2020, units=265
  (94,  8, '2021-03-31', 265, 265000),
  (95,  8, '2021-06-30', 265, 272000),
  (96,  8, '2021-09-30', 265, 280000),
  (97,  8, '2021-12-31', 265, 289000),
  (98,  8, '2022-03-31', 265, 298000),
  (99,  8, '2022-06-30', 265, 307000),
  (100, 8, '2022-09-30', 265, 316000),
  (101, 8, '2022-12-31', 265, 326000),
  (102, 8, '2023-03-31', 265, 336000),
  (103, 8, '2023-06-30', 265, 346000),
  (104, 8, '2023-09-30', 265, 357000),
  (105, 8, '2023-12-31', 265, 368000),
  (106, 8, '2024-03-31', 265, 379000),
  (107, 8, '2024-06-30', 265, 391000),
  (108, 8, '2024-09-30', 265, 403000),

  -- Great Lakes Office Portfolio (property 9) — invested Mar 2021, units=160
  (109, 9, '2021-06-30', 160, 160000),
  (110, 9, '2021-09-30', 160, 165000),
  (111, 9, '2021-12-31', 160, 170000),
  (112, 9, '2022-03-31', 160, 175000),
  (113, 9, '2022-06-30', 160, 181000),
  (114, 9, '2022-09-30', 160, 187000),
  (115, 9, '2022-12-31', 160, 193000),
  (116, 9, '2023-03-31', 160, 199000),
  (117, 9, '2023-06-30', 160, 205000),
  (118, 9, '2023-09-30', 160, 212000),
  (119, 9, '2023-12-31', 160, 219000),
  (120, 9, '2024-03-31', 160, 226000),
  (121, 9, '2024-06-30', 160, 233000),
  (122, 9, '2024-09-30', 160, 240000),

  -- Palmetto Pointe (property 10) — invested Mar 2022, units=1050
  (123, 10, '2022-06-30', 1050, 1050000),
  (124, 10, '2022-09-30', 1050, 1068000),
  (125, 10, '2022-12-31', 1050, 1090000),
  (126, 10, '2023-03-31', 1050, 1116000),
  (127, 10, '2023-06-30', 1050, 1144000),
  (128, 10, '2023-09-30', 1050, 1173000),
  (129, 10, '2023-12-31', 1050, 1203000),
  (130, 10, '2024-03-31', 1050, 1234000),
  (131, 10, '2024-06-30', 1050, 1266000),
  (132, 10, '2024-09-30', 1050, 1300000),

  -- Gulf Coast Multi-Portfolio (property 11) — invested Nov 2022, units=3250
  (133, 11, '2023-03-31', 3250, 3250000),
  (134, 11, '2023-06-30', 3250, 3313000),
  (135, 11, '2023-09-30', 3250, 3380000),
  (136, 11, '2023-12-31', 3250, 3448000),
  (137, 11, '2024-03-31', 3250, 3518000),
  (138, 11, '2024-06-30', 3250, 3589000),
  (139, 11, '2024-09-30', 3250, 3661000),

  -- University Village (property 12) — invested Feb 2023, units=740
  (140, 12, '2023-06-30', 740,  740000),
  (141, 12, '2023-09-30', 740,  758000),
  (142, 12, '2023-12-31', 740,  777000),
  (143, 12, '2024-03-31', 740,  796000),
  (144, 12, '2024-06-30', 740,  816000),
  (145, 12, '2024-09-30', 740,  837000),

  -- Aggie Landing (property 13) — invested May 2024, units=600
  (146, 13, '2024-06-30', 600,  600000),
  (147, 13, '2024-09-30', 600,  609000);

-- Transactions
-- Capital calls at $1,000/unit (units = cash_amount / 1000)
-- Dividends represent ~10% annualized preferred return on deployed capital
INSERT INTO transactions (date, investor_id, property_id, type, cash_amount, units, nav_per_unit, notes) VALUES
  -- Capital Calls
  ('2019-12-15', 1,  1,  'Capital Call',  290000,  290, 1000.00, 'Initial capital call — Lakeview Commons'),
  ('2020-12-10', 1,  8,  'Capital Call',  265000,  265, 1000.00, 'Initial capital call — Riverside Business Center'),
  ('2021-03-15', 1,  3,  'Capital Call',  850000,  850, 1000.00, 'Initial capital call — Campus Crossing'),
  ('2020-11-15', 2,  2,  'Capital Call',  850000,  850, 1000.00, 'Initial capital call — Tallahassee Flats'),
  ('2021-10-26', 2,  5,  'Capital Call', 1050000, 1050, 1000.00, 'Initial capital call — Barton Creek Villas'),
  ('2022-01-15', 2,  7,  'Capital Call', 1600000, 1600, 1000.00, 'Initial capital call — Sunbelt Multi-Portfolio'),
  ('2021-07-01', 3,  4,  'Capital Call',  460000,  460, 1000.00, 'Initial capital call — Brookhaven Apartments'),
  ('2021-12-20', 3,  6,  'Capital Call', 1050000, 1050, 1000.00, 'Initial capital call — Orange Blossom Heights'),
  ('2021-03-20', 3,  9,  'Capital Call',  160000,  160, 1000.00, 'Initial capital call — Great Lakes Office Portfolio'),
  ('2022-03-15', 4, 10,  'Capital Call', 1050000, 1050, 1000.00, 'Initial capital call — Palmetto Pointe'),
  ('2022-11-01', 4, 11,  'Capital Call', 3250000, 3250, 1000.00, 'Initial capital call — Gulf Coast Multi-Portfolio'),
  ('2023-02-01', 4, 12,  'Capital Call',  740000,  740, 1000.00, 'Initial capital call — University Village'),
  ('2024-05-01', 4, 13,  'Capital Call',  600000,  600, 1000.00, 'Initial capital call — Aggie Landing'),

  -- Dividends (preferred return distributions)
  ('2023-12-31', 1,  1,  'Dividend',   7250, NULL, NULL, 'Q4 2023 preferred return — Lakeview Commons'),
  ('2024-06-30', 1,  1,  'Dividend',   7250, NULL, NULL, 'Q2 2024 preferred return — Lakeview Commons'),
  ('2024-09-30', 1,  1,  'Dividend',   7250, NULL, NULL, 'Q3 2024 preferred return — Lakeview Commons'),
  ('2023-12-31', 2,  2,  'Dividend',  21250, NULL, NULL, 'Q4 2023 preferred return — Tallahassee Flats'),
  ('2024-06-30', 2,  2,  'Dividend',  21250, NULL, NULL, 'Q2 2024 preferred return — Tallahassee Flats'),
  ('2024-06-30', 3,  4,  'Dividend',  11500, NULL, NULL, 'Q2 2024 preferred return — Brookhaven Apartments'),
  ('2024-09-30', 3,  4,  'Dividend',  11500, NULL, NULL, 'Q3 2024 preferred return — Brookhaven Apartments'),
  ('2024-09-30', 4, 10,  'Dividend',  26250, NULL, NULL, 'Q3 2024 preferred return — Palmetto Pointe');

-- Metrics (as of 2024-09-30)
INSERT INTO metrics (metric_id, property_id, as_of_date, metric_type, metric_value, units, notes) VALUES
  -- Lakeview Commons
  (1,  1, '2024-09-30', 'OCCUPANCY',   93.5, 'PCT', NULL),
  (2,  1, '2024-09-30', 'TOTALREV',  520000, 'USD', 'Trailing 12-month revenue'),
  (3,  1, '2024-09-30', 'NOI',       295000, 'USD', 'Trailing 12-month NOI'),

  -- Tallahassee Flats
  (4,  2, '2024-09-30', 'OCCUPANCY',   91.2, 'PCT', NULL),
  (5,  2, '2024-09-30', 'TOTALREV', 1350000, 'USD', 'Trailing 12-month revenue'),
  (6,  2, '2024-09-30', 'NOI',       750000, 'USD', 'Trailing 12-month NOI'),

  -- Campus Crossing
  (7,  3, '2024-09-30', 'OCCUPANCY',   96.8, 'PCT', 'Fall semester'),
  (8,  3, '2024-09-30', 'TOTALREV', 2100000, 'USD', 'Trailing 12-month revenue'),
  (9,  3, '2024-09-30', 'NOI',      1050000, 'USD', 'Trailing 12-month NOI'),

  -- Brookhaven Apartments
  (10, 4, '2024-09-30', 'OCCUPANCY',   89.5, 'PCT', NULL),
  (11, 4, '2024-09-30', 'TOTALREV',  380000, 'USD', 'Trailing 12-month revenue'),
  (12, 4, '2024-09-30', 'NOI',       200000, 'USD', 'Trailing 12-month NOI'),

  -- Barton Creek Villas
  (13, 5, '2024-09-30', 'OCCUPANCY',   92.4, 'PCT', NULL),

  -- Orange Blossom Heights
  (14, 6, '2024-09-30', 'OCCUPANCY',   94.1, 'PCT', NULL),

  -- Sunbelt Multi-Portfolio
  (15, 7, '2024-09-30', 'OCCUPANCY',   93.8, 'PCT', NULL),

  -- Riverside Business Center
  (16, 8, '2024-09-30', 'OCCUPANCY',   87.5, 'PCT', 'Post-renovation lease-up'),

  -- Great Lakes Office Portfolio
  (17, 9, '2024-09-30', 'OCCUPANCY',   90.2, 'PCT', NULL),

  -- Palmetto Pointe
  (18, 10, '2024-09-30', 'OCCUPANCY',  94.7, 'PCT', NULL),
  (19, 10, '2024-09-30', 'TOTALREV', 1150000, 'USD', 'Trailing 12-month revenue'),
  (20, 10, '2024-09-30', 'NOI',       630000, 'USD', 'Trailing 12-month NOI'),

  -- Gulf Coast Multi-Portfolio
  (21, 11, '2024-09-30', 'OCCUPANCY',  88.3, 'PCT', 'Value-add renovation in progress'),

  -- University Village
  (22, 12, '2024-09-30', 'OCCUPANCY',  97.2, 'PCT', 'Fall semester'),
  (23, 12, '2024-09-30', 'PRELEASE',   98.5, 'PCT', 'Including signed leases'),

  -- Aggie Landing
  (24, 13, '2024-09-30', 'OCCUPANCY',  82.0, 'PCT', 'Initial lease-up in progress');

-- Property Locations (seeded from properties with valid coordinates)
INSERT INTO property_locations (property_id, label, lat, lon)
SELECT property_id, 'Main', lat, lon
FROM properties
WHERE lat IS NOT NULL AND lon IS NOT NULL;
