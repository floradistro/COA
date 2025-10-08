-- Expand COA metadata table to store all COA data
ALTER TABLE coa_metadata
ADD COLUMN IF NOT EXISTS batch_id TEXT,
ADD COLUMN IF NOT EXISTS sample_type TEXT,
ADD COLUMN IF NOT EXISTS total_thc NUMERIC,
ADD COLUMN IF NOT EXISTS total_cbd NUMERIC,
ADD COLUMN IF NOT EXISTS total_cannabinoids NUMERIC,
ADD COLUMN IF NOT EXISTS date_collected TEXT,
ADD COLUMN IF NOT EXISTS date_received TEXT,
ADD COLUMN IF NOT EXISTS date_tested TEXT,
ADD COLUMN IF NOT EXISTS method_reference TEXT,
ADD COLUMN IF NOT EXISTS lab_name TEXT,
ADD COLUMN IF NOT EXISTS lab_director TEXT,
ADD COLUMN IF NOT EXISTS client_address TEXT,
ADD COLUMN IF NOT EXISTS client_license TEXT;

-- Add comment
COMMENT ON TABLE coa_metadata IS 'Complete COA data for fast display without PDF parsing';

