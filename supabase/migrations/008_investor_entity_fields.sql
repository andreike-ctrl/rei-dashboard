-- Annual filings and tax responsibility, plus business entity number
ALTER TABLE investors ADD COLUMN IF NOT EXISTS annual_filings TEXT;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS annual_taxes TEXT;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS entity_number TEXT;
