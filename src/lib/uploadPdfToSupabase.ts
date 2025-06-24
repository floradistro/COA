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
    
    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from('coas') // your bucket name
      .upload(`pdfs/${finalFilename}`, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true,
        cacheControl: '3600',
      })

    if (error) {
      console.error('Supabase upload error:', error)
      
      // Provide specific error messages for common issues
      if (error.message?.includes('bucket') || error.message?.includes('not found')) {
        throw new Error(
          'Storage bucket "coas" not found. Please follow the setup instructions:\n' +
          '1. Go to your Supabase dashboard\n' +
          '2. Navigate to Storage → New bucket\n' +
          '3. Create a PUBLIC bucket named "coas"\n' +
          '4. Set file size limit to 50MB\n' +
          '5. Allow only PDF files (application/pdf)'
        )
      }
      
      if (error.message?.includes('row-level security') || error.message?.includes('policy')) {
        throw new Error(
          'Permission denied. The storage bucket needs proper policies.\n' +
          'Please check the SUPABASE_SETUP.md file for instructions.'
        )
      }
      
      throw new Error(`Upload failed: ${error.message}`)
    }

    console.log('Upload successful:', data)
    console.log('Uploaded to path:', data?.path);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('coas')
      .getPublicUrl(`pdfs/${finalFilename}`)

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL')
    }

    console.log('=== URL GENERATION ===');
    console.log('Storage path used for URL:', `pdfs/${finalFilename}`);
    console.log('Generated public URL:', urlData.publicUrl);
    console.log('=== END UPLOAD DEBUG ===');
    
    // Test the URL accessibility immediately after upload
    try {
      console.log('Testing uploaded file accessibility...');
      const testResponse = await fetch(urlData.publicUrl, { method: 'HEAD' });
      console.log('Upload URL test result:', testResponse.status, testResponse.statusText);
      if (!testResponse.ok) {
        console.warn('⚠️ Uploaded file is not immediately accessible!');
      } else {
        console.log('✅ Uploaded file is accessible');
      }
    } catch (testError) {
      console.error('❌ Error testing uploaded file accessibility:', testError);
    }
    
    return urlData.publicUrl
  } catch (error) {
    console.error('uploadPdfToSupabase error:', error)
    throw error
  }
} 