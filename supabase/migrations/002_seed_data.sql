-- ============================================================
-- REI Dashboard — Seed Data
-- Run after 001_create_tables.sql
-- ============================================================

-- Clients
INSERT INTO clients (client_id, name, domicile, email, phone, address) VALUES
  (1, 'Acme Family Office',       'Delaware',   'info@acmefo.com',       '(212) 555-0100', '100 Park Avenue, New York, NY 10017'),
  (2, 'Bridgewater Holdings',     'California',  'contact@bridgewater.io', '(415) 555-0200', '500 Market St, San Francisco, CA 94105'),
  (3, 'Cedar Capital Partners',   'Texas',       'hello@cedarcap.com',    '(214) 555-0300', '2000 McKinney Ave, Dallas, TX 75201');

-- Investors
INSERT INTO investors (investor_id, investor_type, name, client_id, tax_number, address) VALUES
  (1, 'LLC',    'Acme RE Fund I LLC',         1, '83-1234567', '100 Park Avenue, New York, NY 10017'),
  (2, 'LLC',    'Acme RE Fund II LLC',        1, '83-2345678', '100 Park Avenue, New York, NY 10017'),
  (3, 'C-Corp', 'Bridgewater RE Corp',        2, '94-3456789', '500 Market St, San Francisco, CA 94105'),
  (4, 'LP',     'Cedar Opportunity Fund LP',  3, '75-4567890', '2000 McKinney Ave, Dallas, TX 75201');

-- Properties
INSERT INTO properties (property_id, name, entity, gp, investment_date, exit_date, asset_class, strategy, property_class, msa, state, units, buildings, beds, website, lat, lon, vo2_raise, total_equity, total_debt, purchase_price, projected_lp_irr, projected_irr, projected_multiple, senior_loan_rate) VALUES
  (1,  'Sunrise Apartments',     'Sunrise Holdings LLC',     'Greystone Capital',   '2021-06-15', NULL,         'Multifamily', 'High Value Add',    'B',  'Dallas-Fort Worth', 'TX', 312, 8,  '1-3 BR', 'https://example.com/sunrise',     32.7767, -96.7970,  8500000,  15000000, 35000000, 50000000, 0.18,  0.22, 2.10, 0.045),
  (2,  'Harbor Point Tower',     'Harbor Point Ventures LLC', 'Atlantic Partners',   '2022-01-10', NULL,         'Multifamily', 'Core Plus',         'A',  'Miami-Fort Lauderdale', 'FL', 250, 1, '1-2 BR', 'https://example.com/harbor',     25.7617, -80.1918,  12000000, 22000000, 48000000, 70000000, 0.14,  0.17, 1.85, 0.042),
  (3,  'Oakwood Business Park',  'Oakwood Partners LLC',     'Meridian Group',      '2020-09-01', '2024-03-15', 'Office',      'Opportunistic',     'B+', 'Atlanta',           'GA', NULL, 3, NULL,     'https://example.com/oakwood',    33.7490, -84.3880,  6000000,  11000000, 24000000, 35000000, 0.25,  0.30, 2.50, 0.052),
  (4,  'The Pines at Lakewood',  'Pines Lakewood LLC',       'Greystone Capital',   '2022-07-20', NULL,         'Multifamily', 'Light Value Add',   'B+', 'Austin',            'TX', 198, 6, '1-3 BR', 'https://example.com/pines',      30.2672, -97.7431,  5500000,  9800000,  22000000, 31800000, 0.16,  0.20, 1.95, 0.048),
  (5,  'Metro Center Plaza',     'Metro Center Holdings LLC', 'Apex Urban Fund',     '2021-11-05', NULL,         'Office',      'Core Plus',         'A+', 'Chicago',           'IL', NULL, 1, NULL,     'https://example.com/metro',      41.8781, -87.6298,  15000000, 28000000, 62000000, 90000000, 0.12,  0.15, 1.70, 0.040),
  (6,  'Riverbend Village',      'Riverbend Dev LLC',        'Horizon Development', '2023-03-01', NULL,         'Multifamily', 'High Value Add',    'C+', 'Phoenix',           'AZ', 420, 12, '1-2 BR', NULL,                             33.4484, -112.0740, 10000000, 18000000, 42000000, 60000000, 0.20,  0.25, 2.30, 0.050),
  (7,  'Cornerstone Logistics',  'Cornerstone Ind LLC',      'Iron Gate Capital',   '2022-05-15', NULL,         'Industrial',  'Light Value Add',   'B',  'Dallas-Fort Worth', 'TX', NULL, 4, NULL,     'https://example.com/cornerstone', 32.8998, -97.0403, 7000000,  13000000, 30000000, 43000000, 0.15,  0.19, 1.90, 0.046),
  (8,  'Palm Gardens Resort',    'Palm Gardens LLC',         'Atlantic Partners',   '2023-08-10', NULL,         'Hospitality', 'Opportunistic',     'A',  'Miami-Fort Lauderdale', 'FL', 180, 2, NULL,  'https://example.com/palmgardens', 26.1224, -80.1373, 20000000, 35000000, 65000000, 100000000, 0.22, 0.28, 2.40, 0.055),
  (9,  'Westfield Student Living','Westfield SL LLC',        'Campus RE Partners',  '2021-08-20', NULL,         'Student',     'Core Plus',         'B+', 'Austin',            'TX', 540, 5, '2-4 BR', 'https://example.com/westfield',  30.2849, -97.7341,  9000000,  16000000, 38000000, 54000000, 0.13,  0.16, 1.75, 0.043),
  (10, 'Cascade Self-Storage',   'Cascade SS Holdings LLC',  'StoreRight Capital',  '2023-01-15', NULL,         'Self-Storage','Light Value Add',   'B',  'Denver',            'CO', 850, 6, NULL,     NULL,                             39.7392, -104.9903, 4000000,  7500000,  17000000, 24500000, 0.17,  0.21, 2.05, 0.047);

-- Valuations (quarterly NAV snapshots for each property)
INSERT INTO valuations (valuation_id, property_id, date, units_outstanding, nav) VALUES
  -- Sunrise Apartments (property 1)
  (1,  1, '2021-09-30', 8500, 8500000),
  (2,  1, '2021-12-31', 8500, 8700000),
  (3,  1, '2022-03-31', 8500, 9000000),
  (4,  1, '2022-06-30', 8500, 9200000),
  (5,  1, '2022-09-30', 8500, 9500000),
  (6,  1, '2022-12-31', 8500, 9800000),
  (7,  1, '2023-03-31', 8500, 10200000),
  (8,  1, '2023-06-30', 8500, 10500000),
  (9,  1, '2023-09-30', 8500, 10900000),
  (10, 1, '2023-12-31', 8500, 11200000),
  (11, 1, '2024-03-31', 8500, 11600000),
  (12, 1, '2024-06-30', 8500, 12000000),

  -- Harbor Point Tower (property 2)
  (13, 2, '2022-03-31', 12000, 12000000),
  (14, 2, '2022-06-30', 12000, 12300000),
  (15, 2, '2022-09-30', 12000, 12100000),
  (16, 2, '2022-12-31', 12000, 12500000),
  (17, 2, '2023-03-31', 12000, 12800000),
  (18, 2, '2023-06-30', 12000, 13200000),
  (19, 2, '2023-09-30', 12000, 13500000),
  (20, 2, '2023-12-31', 12000, 13900000),
  (21, 2, '2024-03-31', 12000, 14300000),
  (22, 2, '2024-06-30', 12000, 14600000),

  -- Oakwood Business Park (property 3 — exited)
  (23, 3, '2020-12-31', 6000, 6000000),
  (24, 3, '2021-03-31', 6000, 6200000),
  (25, 3, '2021-06-30', 6000, 6500000),
  (26, 3, '2021-09-30', 6000, 6800000),
  (27, 3, '2021-12-31', 6000, 7200000),
  (28, 3, '2022-03-31', 6000, 7600000),
  (29, 3, '2022-06-30', 6000, 8000000),
  (30, 3, '2022-09-30', 6000, 8400000),
  (31, 3, '2022-12-31', 6000, 8900000),
  (32, 3, '2023-03-31', 6000, 9300000),
  (33, 3, '2023-06-30', 6000, 9800000),
  (34, 3, '2023-09-30', 6000, 10200000),
  (35, 3, '2023-12-31', 6000, 10800000),
  (36, 3, '2024-03-15', 6000, 11500000),

  -- The Pines at Lakewood (property 4)
  (37, 4, '2022-09-30', 5500, 5500000),
  (38, 4, '2022-12-31', 5500, 5650000),
  (39, 4, '2023-03-31', 5500, 5800000),
  (40, 4, '2023-06-30', 5500, 5950000),
  (41, 4, '2023-09-30', 5500, 6100000),
  (42, 4, '2023-12-31', 5500, 6300000),
  (43, 4, '2024-03-31', 5500, 6500000),
  (44, 4, '2024-06-30', 5500, 6750000),

  -- Metro Center Plaza (property 5)
  (45, 5, '2021-12-31', 15000, 15000000),
  (46, 5, '2022-03-31', 15000, 15200000),
  (47, 5, '2022-06-30', 15000, 15400000),
  (48, 5, '2022-09-30', 15000, 15100000),
  (49, 5, '2022-12-31', 15000, 15500000),
  (50, 5, '2023-03-31', 15000, 15800000),
  (51, 5, '2023-06-30', 15000, 16100000),
  (52, 5, '2023-09-30', 15000, 16400000),
  (53, 5, '2023-12-31', 15000, 16800000),
  (54, 5, '2024-03-31', 15000, 17200000),
  (55, 5, '2024-06-30', 15000, 17500000),

  -- Riverbend Village (property 6)
  (56, 6, '2023-06-30', 10000, 10000000),
  (57, 6, '2023-09-30', 10000, 10400000),
  (58, 6, '2023-12-31', 10000, 10900000),
  (59, 6, '2024-03-31', 10000, 11500000),
  (60, 6, '2024-06-30', 10000, 12100000),

  -- Cornerstone Logistics (property 7)
  (61, 7, '2022-06-30', 7000, 7000000),
  (62, 7, '2022-09-30', 7000, 7150000),
  (63, 7, '2022-12-31', 7000, 7300000),
  (64, 7, '2023-03-31', 7000, 7500000),
  (65, 7, '2023-06-30', 7000, 7700000),
  (66, 7, '2023-09-30', 7000, 7900000),
  (67, 7, '2023-12-31', 7000, 8100000),
  (68, 7, '2024-03-31', 7000, 8350000),
  (69, 7, '2024-06-30', 7000, 8600000),

  -- Palm Gardens Resort (property 8)
  (70, 8, '2023-09-30', 20000, 20000000),
  (71, 8, '2023-12-31', 20000, 20800000),
  (72, 8, '2024-03-31', 20000, 21700000),
  (73, 8, '2024-06-30', 20000, 22500000),

  -- Westfield Student Living (property 9)
  (74, 9, '2021-09-30', 9000, 9000000),
  (75, 9, '2021-12-31', 9000, 9100000),
  (76, 9, '2022-03-31', 9000, 9250000),
  (77, 9, '2022-06-30', 9000, 9400000),
  (78, 9, '2022-09-30', 9000, 9500000),
  (79, 9, '2022-12-31', 9000, 9650000),
  (80, 9, '2023-03-31', 9000, 9800000),
  (81, 9, '2023-06-30', 9000, 10000000),
  (82, 9, '2023-09-30', 9000, 10200000),
  (83, 9, '2023-12-31', 9000, 10400000),
  (84, 9, '2024-03-31', 9000, 10650000),
  (85, 9, '2024-06-30', 9000, 10900000),

  -- Cascade Self-Storage (property 10)
  (86, 10, '2023-03-31', 4000, 4000000),
  (87, 10, '2023-06-30', 4000, 4150000),
  (88, 10, '2023-09-30', 4000, 4300000),
  (89, 10, '2023-12-31', 4000, 4500000),
  (90, 10, '2024-03-31', 4000, 4700000),
  (91, 10, '2024-06-30', 4000, 4900000);

-- Sample transactions
INSERT INTO transactions (date, investor_id, property_id, type, cash_amount, units, nav_per_unit, notes) VALUES
  ('2021-06-15', 1, 1, 'Capital Call',  4250000, 4250, 1000.00, 'Initial capital call — Sunrise Apartments'),
  ('2022-01-10', 1, 2, 'Capital Call',  6000000, 6000, 1000.00, 'Initial capital call — Harbor Point Tower'),
  ('2020-09-01', 3, 3, 'Capital Call',  3000000, 3000, 1000.00, 'Initial capital call — Oakwood Business Park'),
  ('2022-07-20', 4, 4, 'Capital Call',  2750000, 2750, 1000.00, 'Initial capital call — Pines at Lakewood'),
  ('2023-06-30', 1, 1, 'Dividend',       212500,  NULL,  NULL,   'Q2 2023 preferred return'),
  ('2023-12-31', 1, 1, 'Dividend',       225000,  NULL,  NULL,   'Q4 2023 preferred return'),
  ('2024-03-15', 3, 3, 'Distribution', 5750000, -3000, 1916.67, 'Exit distribution — Oakwood Business Park'),
  ('2023-09-30', 4, 4, 'Dividend',       137500,  NULL,  NULL,   'Q3 2023 preferred return'),
  ('2024-06-30', 1, 2, 'Dividend',       330000,  NULL,  NULL,   'Q2 2024 preferred return');

-- Sample metrics
INSERT INTO metrics (metric_id, property_id, as_of_date, metric_type, metric_value, units, notes) VALUES
  (1,  1, '2024-06-30', 'OCCUPANCY', 94.5,     'PCT',  NULL),
  (2,  1, '2024-06-30', 'TOTALREV',  4200000,  'USD',  'Trailing 12-month revenue'),
  (3,  1, '2024-06-30', 'NOI',       2520000,  'USD',  'Trailing 12-month NOI'),
  (4,  2, '2024-06-30', 'OCCUPANCY', 97.2,     'PCT',  NULL),
  (5,  2, '2024-06-30', 'TOTALREV',  6800000,  'USD',  'Trailing 12-month revenue'),
  (6,  2, '2024-06-30', 'NOI',       4080000,  'USD',  'Trailing 12-month NOI'),
  (7,  4, '2024-06-30', 'OCCUPANCY', 91.8,     'PCT',  NULL),
  (8,  4, '2024-06-30', 'TOTALREV',  2900000,  'USD',  'Trailing 12-month revenue'),
  (9,  4, '2024-06-30', 'NOI',       1595000,  'USD',  'Trailing 12-month NOI'),
  (10, 5, '2024-06-30', 'OCCUPANCY', 88.3,     'PCT',  'Lease-up in progress'),
  (11, 6, '2024-06-30', 'OCCUPANCY', 86.0,     'PCT',  'Post-renovation lease-up'),
  (12, 6, '2024-06-30', 'PRELEASE',  92.0,     'PCT',  'Including signed leases'),
  (13, 7, '2024-06-30', 'OCCUPANCY', 100.0,    'PCT',  'Fully leased'),
  (14, 9, '2024-06-30', 'OCCUPANCY', 96.5,     'PCT',  'Fall semester'),
  (15, 10,'2024-06-30', 'OCCUPANCY', 89.0,     'PCT',  NULL);
