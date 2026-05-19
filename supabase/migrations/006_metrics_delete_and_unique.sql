-- Remove duplicate metric rows, keeping the highest metric_id (most recently inserted)
-- for each (property_id, as_of_date, metric_type) combination.
DELETE FROM metrics
WHERE metric_id NOT IN (
  SELECT MAX(metric_id)
  FROM metrics
  GROUP BY property_id, as_of_date, metric_type
);

-- Prevent future duplicates
ALTER TABLE metrics
  ADD CONSTRAINT metrics_unique_per_period
  UNIQUE (property_id, as_of_date, metric_type);

-- Allow authenticated users to delete metrics (required for the update flow)
CREATE POLICY "Allow authenticated delete" ON metrics
  FOR DELETE TO authenticated USING (true);
