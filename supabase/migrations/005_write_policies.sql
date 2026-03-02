-- ============================================================
-- Allow authenticated users to insert/update on writable tables
-- (previously only SELECT policies existed)
-- ============================================================

CREATE POLICY "Allow authenticated insert" ON valuations
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated insert" ON transactions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated insert" ON metrics
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated insert" ON property_locations
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON property_locations
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON property_locations
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON properties
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON properties
  FOR UPDATE TO authenticated USING (true);
