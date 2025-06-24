import { supabase } from '@/lib/supabaseClient';

export async function checkSupabaseBucket(): Promise<{ exists: boolean; error?: string }> {
  try {
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      return { exists: false, error: `Failed to connect to Supabase: ${bucketsError.message}` };
    }
    
    const coasBucket = buckets?.find(b => b.name === 'coas');
    
    if (!coasBucket) {
      // Try to create the bucket
      const { error: createError } = await supabase.storage.createBucket('coas', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['application/pdf']
      });
      
      if (createError) {
        return { exists: false, error: `Bucket "coas" not found and failed to create: ${createError.message}` };
      }
      
      return { exists: true };
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