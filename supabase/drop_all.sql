-- ============================================================
-- Drop all REI Dashboard tables (run before demo_database.sql)
-- ============================================================

DROP TABLE IF EXISTS property_locations CASCADE;
DROP TABLE IF EXISTS metrics            CASCADE;
DROP TABLE IF EXISTS transactions       CASCADE;
DROP TABLE IF EXISTS valuations         CASCADE;
DROP TABLE IF EXISTS investors          CASCADE;
DROP TABLE IF EXISTS properties         CASCADE;
DROP TABLE IF EXISTS clients            CASCADE;
