import { supabase } from './supabaseClient'

export async function uploadPdfToSupabase(filename: string, fileBuffer: Buffer, useProvidedFilename: boolean = false): Promise<string> {
  try {
    // Use provided filename if specified, otherwise add timestamp for uniqueness
    const finalFilename = useProvidedFilename ? filename : `${Date.now()}_${filename}`;
    
    console.log('=== UPLOAD DEBUG ===');
    console.log('Original filename:', filename);
    console.log('Final filename:', finalFilename);
    console.log('Upload path:', `pdfs/${finalFilename}`);
    console.log('Use provided filename:', useProvidedFilename);
    
    // Upload to Supabase (now private bucket)
    const { data, error } = await supabase.storage
      .from('coas') // your bucket name
      .upload(`pdfs/${finalFilename}`, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true,
        cacheControl: '3600',
      })

    if (error) {
      console.error('Supabase upload error:', error)
      
      // Enhanced error handling for private bucket
      if (error.message?.includes('not authorized') || error.message?.includes('access denied') || error.message?.includes('Invalid JWT')) {
        throw new Error(
          'Access denied to private storage. Please check:\n' +
          '1. Your Supabase authentication credentials are correct\n' +
          '2. The bucket RLS policies allow authenticated uploads\n' +
          '3. Your anon key has proper permissions'
        )
      }
      
      // Provide specific error messages for common issues
      if (error.message?.includes('bucket') || error.message?.includes('not found')) {
        throw new Error(
          'Storage bucket "coas" not found. Please follow the setup instructions:\n' +
          '1. Go to your Supabase dashboard\n' +
          '2. Navigate to Storage → New bucket\n' +
          '3. Create a PRIVATE bucket named "coas"\n' +
          '4. Set file size limit to 50MB\n' +
          '5. Allow only PDF files (application/pdf)\n' +
          '6. Configure RLS policies for authenticated access'
        )
      }
      
      if (error.message?.includes('row-level security') || error.message?.includes('policy')) {
        throw new Error(
          'Permission denied. The storage bucket needs proper RLS policies.\n' +
          'For a private bucket, ensure you have policies that allow:\n' +
          '- Authenticated users to upload files\n' +
          '- Service role or authenticated users to read files\n' +
          'Please check the SUPABASE_SETUP.md file for instructions.'
        )
      }
      
      throw new Error(`Upload failed: ${error.message}`)
    }

    console.log('Upload successful:', data)
    console.log('Uploaded to path:', data?.path);

    // Generate lab site viewer URL instead of using getPublicUrl
    const cleanFilename = finalFilename.replace('.pdf', '');
    const viewerUrl = `https://www.quantixanalytics.com/coa/${cleanFilename}`;

    console.log('=== URL GENERATION ===');
    console.log('Storage path used for URL:', `pdfs/${finalFilename}`);
    console.log('Generated lab site viewer URL:', viewerUrl);
    console.log('Clean filename (without .pdf):', cleanFilename);
    console.log('=== END UPLOAD DEBUG ===');
    
    // Note: We cannot test the URL accessibility directly anymore since it requires
    // the quantixanalytics.com backend to fetch from private Supabase
    console.log('Note: COA will be accessible via quantixanalytics.com once their backend fetches it from private storage');
    
    return viewerUrl
  } catch (error) {
    console.error('uploadPdfToSupabase error:', error)
    throw error
  }
} 