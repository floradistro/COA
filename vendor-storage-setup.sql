-- Vendor Supabase Complete Setup
-- Run this SQL in the VENDOR Supabase instance: https://uaednwpxursknmwdeejn.supabase.co
-- This sets up BOTH the vendor_coas table AND the storage bucket

-- ============================================
-- PART 1: Create vendor_coas table
-- ============================================

-- Ensure UUID extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create vendor_coas table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.vendor_coas (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_id uuid NOT NULL,
  product_id uuid,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  file_type text DEFAULT 'application/pdf',
  lab_name text,
  test_date date,
  expiry_date date,
  batch_number text,
  test_results jsonb,
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  metadata jsonb,
  upload_date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security on vendor_coas
ALTER TABLE public.vendor_coas ENABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies on vendor_coas (if any)
DROP POLICY IF EXISTS "Allow anon insert vendor_coas" ON public.vendor_coas;
DROP POLICY IF EXISTS "Allow authenticated insert vendor_coas" ON public.vendor_coas;
DROP POLICY IF EXISTS "Allow public insert vendor_coas" ON public.vendor_coas;
DROP POLICY IF EXISTS "Allow public read vendor_coas" ON public.vendor_coas;
DROP POLICY IF EXISTS "Allow authenticated update vendor_coas" ON public.vendor_coas;
DROP POLICY IF EXISTS "Allow public update vendor_coas" ON public.vendor_coas;
DROP POLICY IF EXISTS "Allow authenticated delete vendor_coas" ON public.vendor_coas;
DROP POLICY IF EXISTS "Allow public delete vendor_coas" ON public.vendor_coas;
DROP POLICY IF EXISTS "Allow service role full access vendor_coas" ON public.vendor_coas;

-- RLS Policy: Allow all inserts (public access for lab uploads)
CREATE POLICY "Allow public insert vendor_coas" 
ON public.vendor_coas 
FOR INSERT 
WITH CHECK (true);

-- RLS Policy: Allow all reads (public access)
CREATE POLICY "Allow public read vendor_coas" 
ON public.vendor_coas 
FOR SELECT 
USING (true);

-- RLS Policy: Allow all updates (public access)
CREATE POLICY "Allow public update vendor_coas" 
ON public.vendor_coas 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- RLS Policy: Allow all deletes (public access)
CREATE POLICY "Allow public delete vendor_coas" 
ON public.vendor_coas 
FOR DELETE 
USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendor_coas_vendor_id ON public.vendor_coas(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_coas_product_id ON public.vendor_coas(product_id);
CREATE INDEX IF NOT EXISTS idx_vendor_coas_is_active ON public.vendor_coas(is_active);
CREATE INDEX IF NOT EXISTS idx_vendor_coas_created_at ON public.vendor_coas(created_at DESC);

-- Grant permissions to all roles
GRANT ALL ON public.vendor_coas TO anon;
GRANT ALL ON public.vendor_coas TO authenticated;
GRANT ALL ON public.vendor_coas TO service_role;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================
-- PART 2: Create vendor-coas storage bucket
-- ============================================

-- Create the 'vendor-coas' storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('vendor-coas', 'vendor-coas', true, 52428800, '{application/pdf}')
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = '{application/pdf}';

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow anon uploads to vendor-coas" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to vendor-coas" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to vendor-coas" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to vendor-coas" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to vendor-coas" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates to vendor-coas" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes to vendor-coas" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes to vendor-coas" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role full access to vendor-coas" ON storage.objects;

-- Storage Policy: Allow all uploads (public access for lab)
CREATE POLICY "Allow public uploads to vendor-coas" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'vendor-coas');

-- Storage Policy: Allow all reads (public access)
CREATE POLICY "Allow public read access to vendor-coas" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'vendor-coas');

-- Storage Policy: Allow all updates (public access)
CREATE POLICY "Allow public updates to vendor-coas" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'vendor-coas')
WITH CHECK (bucket_id = 'vendor-coas');

-- Storage Policy: Allow all deletes (public access)
CREATE POLICY "Allow public deletes to vendor-coas" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'vendor-coas');

-- Grant necessary permissions to all roles
GRANT ALL ON storage.objects TO anon;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.objects TO service_role;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify vendor_coas table exists
SELECT 
  table_name, 
  table_schema 
FROM information_schema.tables 
WHERE table_name = 'vendor_coas';

-- Verify vendor_coas RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'vendor_coas' 
AND schemaname = 'public'
ORDER BY policyname;

-- Verify storage bucket exists
SELECT 
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types 
FROM storage.buckets 
WHERE id = 'vendor-coas';

-- Verify storage policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%vendor-coas%'
ORDER BY policyname;

-- Final confirmation
SELECT 
  'vendor_coas table' as item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_coas') 
    THEN '✅ Created' ELSE '❌ Missing' END as status
UNION ALL
SELECT 
  'vendor-coas bucket' as item,
  CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'vendor-coas') 
    THEN '✅ Created' ELSE '❌ Missing' END as status
UNION ALL
SELECT 
  'Table RLS policies' as item,
  CASE WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'vendor_coas') >= 4 
    THEN '✅ Configured (' || (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'vendor_coas')::text || ' policies)' 
    ELSE '⚠️ Incomplete (' || (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'vendor_coas')::text || ' policies)' END as status
UNION ALL
SELECT 
  'Storage RLS policies' as item,
  CASE WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%vendor-coas%') >= 4 
    THEN '✅ Configured (' || (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%vendor-coas%')::text || ' policies)' 
    ELSE '⚠️ Incomplete (' || (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%vendor-coas%')::text || ' policies)' END as status;

