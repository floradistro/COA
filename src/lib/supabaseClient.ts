import { createClient, SupabaseClient } from '@supabase/supabase-js'

// AUTH: WhaleTools classified project (admin login only)
const authUrl = 'https://tkicdgegwqmiybpnrazs.supabase.co'
const authKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRraWNkZ2Vnd3FtaXlicG5yYXpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5Njg3MzYsImV4cCI6MjA3NTU0NDczNn0.6nWlflu_9EIsEvuBxBMKdu8tiFdSVArE4DnXb8bLMKQ'

// DATA: Shared backend (database, storage, clients)
const dataUrl = 'https://elhsobjvwmjfminxxcwy.supabase.co'
const dataKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsaHNvYmp2d21qZm1pbnh4Y3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDQzMzAsImV4cCI6MjA2NjI4MDMzMH0.sK5ggW0XxE_Y9x5dXQvq2IPbxo0WoQs3OcfXNhEbTyQ'

// Singleton instances
let authClientInstance: SupabaseClient | null = null
let dataClientInstance: SupabaseClient | null = null

// Auth client - for login/signup only (singleton)
export const supabaseAuth = (() => {
  if (!authClientInstance) {
    authClientInstance = createClient(authUrl, authKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'whaletools-auth',
        detectSessionInUrl: true,
      },
    })
  }
  return authClientInstance
})()

// Data client - for database and storage operations (singleton)
export const supabaseData = (() => {
  if (!dataClientInstance) {
    dataClientInstance = createClient(dataUrl, dataKey, {
      auth: {
        persistSession: false, // Don't persist - we're using the auth client for that
      },
      global: {
        headers: { 
          'x-my-custom-header': 'whaletools-coa-generator',
          'x-client-info': 'whaletools/1.0.0'
        },
      },
    })
  }
  return dataClientInstance
})()

// Default export for backward compatibility (use data client)
export const supabase = supabaseData 