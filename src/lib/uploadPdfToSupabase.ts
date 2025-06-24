import { supabase } from './supabaseClient'

export async function uploadPdfToSupabase(filename: string, fileBuffer: Buffer): Promise<string> {
  try {
    // Ensure filename is unique by adding timestamp
    const timestamp = Date.now()
    const uniqueFilename = `${timestamp}_${filename}`
    
    console.log('Uploading to Supabase:', uniqueFilename)
    
    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from('coas') // your bucket name
      .upload(`pdfs/${uniqueFilename}`, fileBuffer, {
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

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('coas')
      .getPublicUrl(`pdfs/${uniqueFilename}`)

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL')
    }

    console.log('Public URL:', urlData.publicUrl)
    return urlData.publicUrl
  } catch (error) {
    console.error('uploadPdfToSupabase error:', error)
    throw error
  }
} 