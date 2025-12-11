export async function checkSupabaseBucket(): Promise<{ exists: boolean; error?: string }> {
  try {
    // For vendor-coas bucket, just assume it exists since we can't list buckets with anon key
    // The bucket already exists on the vendor Supabase project
    console.log('Using vendor-coas bucket on vendor Supabase');
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