import { supabase } from './supabaseClient'

export async function uploadPdfToSupabase(filename: string, fileBuffer: Buffer) {
  // Upload to Supabase
  const { error } = await supabase.storage
    .from('coas') // your bucket name
    .upload(`pdfs/${filename}`, fileBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (error) {
    console.error('Upload error:', error)
    throw error
  }

  // Get public URL
  const { data } = supabase.storage
    .from('coas')
    .getPublicUrl(`pdfs/${filename}`)

  return data.publicUrl
} 