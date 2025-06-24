'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function TestSupabase() {
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    setStatus('Testing Supabase connection...')
    
    try {
      // Test 1: Check if we can connect to Supabase
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      
      if (bucketsError) {
        setStatus(`❌ Failed to connect to Supabase: ${bucketsError.message}`)
        return
      }
      
      setStatus(`✅ Connected to Supabase! Found ${buckets?.length || 0} buckets`)
      
      // Test 2: Check if 'coas' bucket exists
      const coasBucket = buckets?.find(b => b.name === 'coas')
      
      if (!coasBucket) {
        setStatus(prev => prev + '\n❌ Bucket "coas" not found. Creating it...')
        
        // Try to create the bucket
        const { data: newBucket, error: createError } = await supabase.storage.createBucket('coas', {
          public: true,
          fileSizeLimit: 52428800, // 50MB
          allowedMimeTypes: ['application/pdf']
        })
        
        if (createError) {
          setStatus(prev => prev + `\n❌ Failed to create bucket: new row violates row-level security policy`)
          setStatus(prev => prev + '\n\n📝 To fix this, you need to create the bucket manually in Supabase:')
          setStatus(prev => prev + '\n1. Go to your Supabase dashboard: https://supabase.com/dashboard')
          setStatus(prev => prev + '\n2. Select your project')
          setStatus(prev => prev + '\n3. Go to Storage section')
          setStatus(prev => prev + '\n4. Click "New bucket"')
          setStatus(prev => prev + '\n5. Name it "coas" (lowercase)')
          setStatus(prev => prev + '\n6. Make it PUBLIC')
          setStatus(prev => prev + '\n7. Set file size limit to 50MB')
          setStatus(prev => prev + '\n8. Allow only PDF files (application/pdf)')
          setStatus(prev => prev + '\n\nAlternatively, run this SQL in the SQL Editor:')
          setStatus(prev => prev + "\n\nINSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)")
          setStatus(prev => prev + "\nVALUES ('coas', 'coas', true, 52428800, '{application/pdf}');")
          return
        }
        
        setStatus(prev => prev + '\n✅ Bucket "coas" created successfully!')
      } else {
        setStatus(prev => prev + '\n✅ Bucket "coas" exists!')
        setStatus(prev => prev + `\n   - Public: ${coasBucket.public ? 'Yes' : 'No'}`)
        setStatus(prev => prev + `\n   - File size limit: ${coasBucket.file_size_limit ? (coasBucket.file_size_limit / 1024 / 1024).toFixed(0) + 'MB' : 'Unlimited'}`)
      }
      
      // Test 3: Try to upload a test file
      setStatus(prev => prev + '\n\n🔄 Testing file upload...')
      const testPdf = new Blob(['Test PDF content'], { type: 'application/pdf' })
      const testBuffer = Buffer.from(await testPdf.arrayBuffer())
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('coas')
        .upload(`test/test_${Date.now()}.pdf`, testBuffer, {
          contentType: 'application/pdf',
          upsert: true
        })
        
      if (uploadError) {
        setStatus(prev => prev + `\n❌ Upload test failed: ${uploadError.message}`)
        
        if (uploadError.message.includes('new row violates row-level security policy')) {
          setStatus(prev => prev + '\n\n🔧 SOLUTION: You need to set up storage policies!')
          setStatus(prev => prev + '\n\nRun this SQL in your Supabase SQL Editor:')
          setStatus(prev => prev + '\n\n-- Allow anonymous users to upload files')
          setStatus(prev => prev + '\nCREATE POLICY "Allow anonymous uploads" ON storage.objects')
          setStatus(prev => prev + '\nFOR INSERT TO anon')
          setStatus(prev => prev + '\nWITH CHECK (bucket_id = \'coas\');')
          setStatus(prev => prev + '\n\n-- Allow public read access to all files')
          setStatus(prev => prev + '\nCREATE POLICY "Allow public downloads" ON storage.objects')
          setStatus(prev => prev + '\nFOR SELECT TO public')
          setStatus(prev => prev + '\nUSING (bucket_id = \'coas\');')
          setStatus(prev => prev + '\n\n-- Grant necessary permissions')
          setStatus(prev => prev + '\nGRANT ALL ON storage.objects TO anon;')
          setStatus(prev => prev + '\nGRANT ALL ON storage.objects TO authenticated;')
        }
        
        return
      }
      
      setStatus(prev => prev + '\n✅ Test upload successful!')
      
      // Test 4: Get public URL
      const { data: urlData } = supabase.storage
        .from('coas')
        .getPublicUrl(uploadData.path)
        
      if (urlData?.publicUrl) {
        setStatus(prev => prev + `\n✅ Public URL: ${urlData.publicUrl}`)
      }
      
      // Test 5: Clean up test file
      await supabase.storage.from('coas').remove([uploadData.path])
      setStatus(prev => prev + '\n✅ Test file cleaned up')
      
      setStatus(prev => prev + '\n\n🎉 ALL TESTS PASSED! Your Supabase setup is working correctly.')
      
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const setupBucket = () => {
    setStatus(`📋 COPY AND PASTE THIS SAFE SQL INTO YOUR SUPABASE SQL EDITOR:

-- 1. Create the bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('coas', 'coas', true, 52428800, '{application/pdf}')
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies (if they exist) and recreate them
DROP POLICY IF EXISTS "Allow anonymous uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public downloads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;

-- 3. Create fresh policies
CREATE POLICY "Allow anonymous uploads" ON storage.objects
FOR INSERT TO anon
WITH CHECK (bucket_id = 'coas');

CREATE POLICY "Allow public downloads" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'coas');

CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'coas');

-- 4. Grant permissions (these are safe to run multiple times)
GRANT ALL ON storage.objects TO anon;
GRANT ALL ON storage.objects TO authenticated;

-- 5. Verify setup
SELECT * FROM storage.buckets WHERE id = 'coas';

🔗 Go to: https://supabase.com/dashboard → Your Project → SQL Editor → Paste the above SQL → Run

✅ This version is SAFE to run multiple times - it won't throw errors if policies already exist!`)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Supabase Connection Test</h2>
      
      <div className="flex gap-4 mb-4">
        <button
          onClick={testConnection}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Testing...' : 'Test Supabase Connection'}
        </button>
        
        <button
          onClick={setupBucket}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Show Setup SQL
        </button>
      </div>
      
      {status && (
        <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg whitespace-pre-wrap font-mono text-sm overflow-x-auto">
          {status}
        </pre>
      )}
      
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Quick Setup Guide:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
          <li>Open your Supabase dashboard</li>
          <li>Navigate to Storage → Create new bucket</li>
          <li>Name: <code className="bg-blue-100 px-1 rounded">coas</code> (must be lowercase)</li>
          <li>Set as PUBLIC bucket</li>
          <li>File size limit: 50MB</li>
          <li>Allowed MIME types: <code className="bg-blue-100 px-1 rounded">application/pdf</code></li>
        </ol>
      </div>
    </div>
  )
} 