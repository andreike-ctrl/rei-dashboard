-- Add state of formation/domicile to investors
ALTER TABLE investors ADD COLUMN IF NOT EXISTS state TEXT;
