-- Create clients table first
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  license_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create COA metadata table
CREATE TABLE IF NOT EXISTS coa_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id TEXT NOT NULL UNIQUE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  strain TEXT NOT NULL,
  product_type TEXT,
  date_received TIMESTAMPTZ,
  date_tested TIMESTAMPTZ,
  pdf_url TEXT,
  qr_code_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add email column to clients
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Add additional metadata fields
ALTER TABLE coa_metadata
ADD COLUMN IF NOT EXISTS batch_number TEXT,
ADD COLUMN IF NOT EXISTS test_methods TEXT[],
ADD COLUMN IF NOT EXISTS lab_director TEXT,
ADD COLUMN IF NOT EXISTS approval_date TIMESTAMPTZ;

-- Add cannabinoid breakdown fields
ALTER TABLE coa_metadata
ADD COLUMN IF NOT EXISTS total_thc DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS total_cbd DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS total_cannabinoids DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS cannabinoid_breakdown JSONB;

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE coa_metadata ENABLE ROW LEVEL SECURITY;

-- Create policies for clients table
CREATE POLICY "Enable read access for all users" ON clients
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON clients
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON clients
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON clients
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for coa_metadata table
CREATE POLICY "Enable read access for all users" ON coa_metadata
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON coa_metadata
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON coa_metadata
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON coa_metadata
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create storage bucket for COAs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'coas',
  'coas',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for COA bucket
CREATE POLICY "Authenticated users can upload COAs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'coas' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can update COAs" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'coas'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can delete COAs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'coas'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Public read access for COAs" ON storage.objects
  FOR SELECT USING (bucket_id = 'coas');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_coa_metadata_sample_id ON coa_metadata(sample_id);
CREATE INDEX IF NOT EXISTS idx_coa_metadata_client_id ON coa_metadata(client_id);
CREATE INDEX IF NOT EXISTS idx_coa_metadata_created_at ON coa_metadata(created_at DESC);

