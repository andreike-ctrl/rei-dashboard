-- ============================================================
-- Property Locations — supports multiple pins per property
-- ============================================================

CREATE TABLE IF NOT EXISTS property_locations (
  location_id  SERIAL PRIMARY KEY,
  property_id  INT NOT NULL REFERENCES properties (property_id),
  label        TEXT,
  lat          DECIMAL NOT NULL,
  lon          DECIMAL NOT NULL,
  type         TEXT NOT NULL DEFAULT 'building'
);

-- Seed from existing property lat/lon (skip nulls)
INSERT INTO property_locations (property_id, label, lat, lon)
SELECT property_id, 'Main', lat, lon
FROM properties
WHERE lat IS NOT NULL AND lon IS NOT NULL;
