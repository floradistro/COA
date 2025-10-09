import { supabaseData as supabase } from '@/lib/supabaseClient';

export async function checkSupabaseBucket(): Promise<{ exists: boolean; error?: string }> {
  try {
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      // Enhanced error handling for private bucket access
      if (bucketsError.message?.includes('not authorized') || bucketsError.message?.includes('Invalid JWT')) {
        return { 
          exists: false, 
          error: `Authentication failed: ${bucketsError.message}. Please check your Supabase credentials.` 
        };
      }
      return { exists: false, error: `Failed to connect to Supabase: ${bucketsError.message}` };
    }
    
    const coasBucket = buckets?.find(b => b.name === 'coas');
    
    if (!coasBucket) {
      // Try to create the bucket as PRIVATE
      const { error: createError } = await supabase.storage.createBucket('coas', {
        public: false, // Changed to private
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['application/pdf']
      });
      
      if (createError) {
        // If creation fails, provide helpful error message
        if (createError.message?.includes('already exists')) {
          // Bucket might exist but we can't see it due to permissions
          console.log('Bucket may already exist but is not visible due to permissions');
          return { exists: true };
        }
        return { 
          exists: false, 
          error: `Bucket "coas" not found and failed to create: ${createError.message}. ` +
                 `For private buckets, ensure you have proper admin permissions.` 
        };
      }
      
      console.log('Created new private bucket "coas"');
      return { exists: true };
    }
    
    // Check if bucket is private
    if (coasBucket.public === true) {
      console.warn('Warning: Bucket "coas" is currently public. Consider making it private for security.');
    }
    
    return { exists: true };
  } catch (error) {
    return { exists: false, error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export async function ensureSupabaseReady(): Promise<void> {
  const { exists, error } = await checkSupabaseBucket();
  
  if (!exists) {
    throw new Error(error || 'Supabase bucket not configured');
  }
} 