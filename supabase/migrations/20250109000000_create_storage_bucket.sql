-- Create storage bucket for COAs (if not exists)
DO $$
BEGIN
  -- Check if bucket exists, if not create it
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'coas') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'coas',
      'coas',
      false,
      52428800, -- 50MB
      ARRAY['application/pdf', 'image/png', 'image/jpeg']
    );
  END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload COAs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update COAs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete COAs" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for COAs" ON storage.objects;
DROP POLICY IF EXISTS "Service role can do anything" ON storage.objects;

-- Create comprehensive storage policies
CREATE POLICY "Authenticated users can upload COAs" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'coas');

CREATE POLICY "Authenticated users can update COAs" 
ON storage.objects FOR UPDATE 
TO authenticated
USING (bucket_id = 'coas');

CREATE POLICY "Authenticated users can delete COAs" 
ON storage.objects FOR DELETE 
TO authenticated
USING (bucket_id = 'coas');

CREATE POLICY "Authenticated users can read COAs" 
ON storage.objects FOR SELECT 
TO authenticated
USING (bucket_id = 'coas');

CREATE POLICY "Public can read COAs" 
ON storage.objects FOR SELECT 
TO anon
USING (bucket_id = 'coas');

-- Allow service role full access
CREATE POLICY "Service role can do anything" 
ON storage.objects 
TO service_role
USING (bucket_id = 'coas')
WITH CHECK (bucket_id = 'coas');

