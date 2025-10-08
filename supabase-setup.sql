-- Create the 'coas' storage bucket for COA PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('coas', 'coas', true, 52428800, '{application/pdf}')
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the 'coas' bucket

-- Policy: Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'coas');

-- Policy: Allow anonymous users to upload files (for public access)
CREATE POLICY "Allow anonymous uploads" ON storage.objects
FOR INSERT TO anon
WITH CHECK (bucket_id = 'coas');

-- Policy: Allow public read access to all files
CREATE POLICY "Allow public downloads" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'coas');

-- Policy: Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated updates" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'coas')
WITH CHECK (bucket_id = 'coas');

-- Policy: Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'coas');

-- Policy: Allow anonymous users to delete files
CREATE POLICY "Allow anonymous deletes" ON storage.objects
FOR DELETE TO anon
USING (bucket_id = 'coas');

-- Grant necessary permissions
GRANT ALL ON storage.objects TO anon;
GRANT ALL ON storage.objects TO authenticated;

-- Verify the bucket was created
SELECT * FROM storage.buckets WHERE id = 'coas'; 