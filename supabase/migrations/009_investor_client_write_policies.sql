-- Allow authenticated users to insert and update investors and clients

CREATE POLICY "Allow authenticated insert" ON investors
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON investors
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON clients
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON clients
  FOR UPDATE TO authenticated USING (true);
