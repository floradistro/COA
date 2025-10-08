-- Add DELETE policy for anonymous users to the 'coas' bucket
-- This allows the app to delete COA files from storage

-- Drop existing policy if it exists (in case we're re-running)
DROP POLICY IF EXISTS "Allow anonymous deletes" ON storage.objects;

-- Create the DELETE policy for anonymous users
CREATE POLICY "Allow anonymous deletes" ON storage.objects
FOR DELETE TO anon
USING (bucket_id = 'coas');

