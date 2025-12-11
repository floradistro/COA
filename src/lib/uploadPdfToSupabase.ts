import { supabaseVendor as supabase } from './supabaseClient'
import { COAData } from '@/types'

// Default vendor ID (Flora Distro) - only used as fallback if no vendor_id provided
const DEFAULT_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

export async function uploadPdfToSupabase(filename: string, fileBuffer: Buffer, useProvidedFilename: boolean = false, coaData?: COAData, vendorId?: string): Promise<string> {
  try {
    // Use provided filename if specified, otherwise add timestamp for uniqueness
    const finalFilename = useProvidedFilename ? filename : `${Date.now()}_${filename}`;

    // Use provided vendor ID, or warn and use default
    const effectiveVendorId = vendorId || DEFAULT_VENDOR_ID;
    if (!vendorId) {
      console.warn('⚠️ No vendor_id provided, using default. COA may not appear in correct vendor portal.');
    }

    console.log('=== UPLOAD DEBUG ===');
    console.log('Original filename:', filename);
    console.log('Final filename:', finalFilename);
    console.log('Upload path:', `${effectiveVendorId}/${finalFilename}`);
    console.log('Vendor ID:', effectiveVendorId);

    // Upload to Supabase vendor-coas bucket (path: vendorId/filename)
    const { data, error } = await supabase.storage
      .from('vendor-coas')
      .upload(`${effectiveVendorId}/${finalFilename}`, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true,
        cacheControl: 'no-cache, no-store, must-revalidate',
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

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('vendor-coas')
      .getPublicUrl(`${effectiveVendorId}/${finalFilename}`);

    const fileUrl = urlData.publicUrl;
    const cleanFilename = finalFilename.replace('.pdf', '');
    const parts = cleanFilename.split('/');
    const strainName = parts.length > 1 ? parts[parts.length - 1] : parts[0];

    console.log('=== URL GENERATION ===');
    console.log('Public URL:', fileUrl);
    console.log('Strain name:', strainName);
    console.log('=== END UPLOAD DEBUG ===');

    // Save COA metadata to vendor_coas table
    if (coaData) {
      try {
        // Build test_results JSONB matching vendor_coas schema
        const testResults: Record<string, string | boolean | undefined> = {
          thc: coaData.totalTHC?.toString(),
          cbd: coaData.totalCBD?.toString(),
          total_cannabinoids: coaData.totalCannabinoids?.toString(),
        };

        // Add individual cannabinoids
        for (const c of coaData.cannabinoids) {
          const key = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          testResults[key] = c.percentWeight?.toString();
        }

        // Delete any existing record with the same filename to prevent duplicates
        // This handles cases where old COA wasn't properly deleted
        const { error: deleteError } = await supabase
          .from('vendor_coas')
          .delete()
          .eq('vendor_id', effectiveVendorId)
          .eq('file_name', finalFilename);

        if (deleteError) {
          console.log('Note: No existing record to delete or delete failed:', deleteError.message);
        } else {
          console.log('🗑️ Deleted existing COA record with same filename (if any)');
        }

        const { error: metadataError } = await supabase
          .from('vendor_coas')
          .insert({
            vendor_id: effectiveVendorId,
            file_name: finalFilename,
            file_url: fileUrl,
            file_size: fileBuffer.length,
            file_type: 'application/pdf',
            lab_name: coaData.labName || 'Quantix Analytics',
            test_date: coaData.dateTested,
            batch_number: coaData.batchId,
            product_name_on_coa: strainName.replace(/_/g, ' '),
            test_results: testResults,
            is_active: true,
            is_verified: false,
          });

        if (metadataError) {
          console.error('Error saving COA metadata:', metadataError.message);
        } else {
          console.log('✅ Saved COA metadata to vendor_coas table');
        }
      } catch (err) {
        console.error('Error in metadata save:', err);
      }
    }

    // Return viewer URL for the COA
    const viewerUrl = `https://www.quantixanalytics.com/coa/${cleanFilename}`;
    console.log('Viewer URL:', viewerUrl);

    return viewerUrl
  } catch (error) {
    console.error('uploadPdfToSupabase error:', error)
    throw error
  }
} 