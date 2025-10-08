-- Create COA metadata table to store parsed data
CREATE TABLE IF NOT EXISTS coa_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  strain_name TEXT,
  sample_id TEXT,
  approval_date TEXT,
  date_reported TEXT,
  test_status TEXT DEFAULT 'Complete',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE coa_metadata ENABLE ROW LEVEL SECURITY;

-- Allow public read access (COAs are publicly viewable)
CREATE POLICY "Allow public read access"
ON coa_metadata
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated insert"
ON coa_metadata
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_coa_metadata_file_path ON coa_metadata(file_path);
CREATE INDEX IF NOT EXISTS idx_coa_metadata_client_name ON coa_metadata(client_name);

