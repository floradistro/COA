import { createClient, SupabaseClient } from '@supabase/supabase-js'

// AUTH: WhaleTools classified project (admin login only)
const authUrl = process.env.NEXT_PUBLIC_SUPABASE_AUTH_URL!
const authKey = process.env.NEXT_PUBLIC_SUPABASE_AUTH_ANON_KEY!

// DATA: Shared backend (database, storage, clients)
const dataUrl = process.env.NEXT_PUBLIC_SUPABASE_DATA_URL!
const dataKey = process.env.NEXT_PUBLIC_SUPABASE_DATA_ANON_KEY!

// VENDOR: Marketplace backend (vendors, products, COAs for vendors)
const vendorUrl = process.env.NEXT_PUBLIC_SUPABASE_VENDOR_URL!
const vendorKey = process.env.NEXT_PUBLIC_SUPABASE_VENDOR_ANON_KEY!

// Singleton instances
let authClientInstance: SupabaseClient | null = null
let dataClientInstance: SupabaseClient | null = null
let vendorClientInstance: SupabaseClient | null = null

// Auth client - for login/signup only (singleton)
export const supabaseAuth = (() => {
  if (!authClientInstance) {
    authClientInstance = createClient(authUrl, authKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'whaletools-auth-tkicdgegwqmiybpnrazs',
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
        storageKey: 'whaletools-data-elhsobjvwmjfminxxcwy',
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

// Vendor client - for marketplace vendors, products, and COAs (singleton)
export const supabaseVendor = (() => {
  if (!vendorClientInstance) {
    vendorClientInstance = createClient(vendorUrl, vendorKey, {
      auth: {
        persistSession: false,
        storageKey: 'whaletools-vendor-uaednwpxursknmwdeejn',
      },
      global: {
        headers: { 
          'x-my-custom-header': 'whaletools-vendor-integration',
          'x-client-info': 'whaletools/1.0.0'
        },
      },
    })
  }
  return vendorClientInstance
})()

// Default export for backward compatibility (use data client)
export const supabase = supabaseData 