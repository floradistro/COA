import { supabaseVendor } from './supabaseClient'
import { COAData } from '@/types'

export interface VendorCOAUploadData {
  vendorId: string
  coaData: COAData
  pdfBlob: Blob
  fileName: string
}

export async function uploadCOAToVendor({ 
  vendorId, 
  coaData, 
  pdfBlob, 
  fileName 
}: VendorCOAUploadData): Promise<{ success: boolean; error?: string; coaId?: string }> {
  try {
    // 1. Upload PDF to vendor storage
    const storagePath = `${vendorId}/${Date.now()}_${fileName}`
    
    const { data: uploadData, error: uploadError } = await supabaseVendor.storage
      .from('vendor-coas')
      .upload(storagePath, pdfBlob, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return { success: false, error: `Storage upload failed: ${uploadError.message}` }
    }

    // 2. Get public URL
    const { data: urlData } = supabaseVendor.storage
      .from('vendor-coas')
      .getPublicUrl(storagePath)

    if (!urlData?.publicUrl) {
      return { success: false, error: 'Failed to get public URL' }
    }

    // 3. Insert metadata into vendor_coas table
    const { data: coaRecord, error: insertError } = await supabaseVendor
      .from('vendor_coas')
      .insert({
        vendor_id: vendorId,
        product_id: null, // Vendor will link to product later
        file_name: fileName,
        file_url: urlData.publicUrl,
        file_size: pdfBlob.size,
        file_type: 'application/pdf',
        lab_name: coaData.labName,
        test_date: coaData.dateTested,
        expiry_date: null,
        batch_number: coaData.batchId,
        test_results: {
          totalTHC: coaData.totalTHC,
          totalCBD: coaData.totalCBD,
          totalCannabinoids: coaData.totalCannabinoids,
          cannabinoids: coaData.cannabinoids,
          sampleType: coaData.sampleType,
          strain: coaData.strain
        },
        is_active: true,
        is_verified: false,
        metadata: {
          clientName: coaData.clientName,
          sampleName: coaData.sampleName,
          sampleId: coaData.sampleId,
          strain: coaData.strain
        }
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      // Try to clean up uploaded file
      await supabaseVendor.storage.from('vendor-coas').remove([storagePath])
      return { success: false, error: `Database insert failed: ${insertError.message}` }
    }

    return { 
      success: true, 
      coaId: coaRecord.id 
    }

  } catch (err) {
    console.error('Upload to vendor error:', err)
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error occurred' 
    }
  }
}

export async function getVendors() {
  try {
    const { data, error } = await supabaseVendor
      .from('vendors')
      .select('id, store_name, email, status')
      .eq('status', 'active')
      .order('store_name')

    if (error) throw error
    return { data: data || [], error: null }
  } catch (err) {
    console.error('Error fetching vendors:', err)
    return { 
      data: [], 
      error: err instanceof Error ? err.message : 'Failed to fetch vendors' 
    }
  }
}

