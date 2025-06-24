'use client'

import { useState, useEffect } from 'react'

export default function SimpleSupabaseTest() {
  const [status, setStatus] = useState('Testing...')

  useEffect(() => {
    const testSupabase = async () => {
      try {
        // Import dynamically to avoid SSR issues
        const { supabase } = await import('@/lib/supabaseClient')
        
        console.log('Testing Supabase connection...')
        
        // Try a simple ping to Supabase
        const { data, error } = await supabase.storage.listBuckets()
        
        if (error) {
          console.error('Supabase error:', error)
          setStatus(`❌ Error: ${error.message}`)
        } else {
          console.log('Supabase success:', data)
          setStatus(`✅ Connected! Found ${data?.length || 0} buckets`)
        }
      } catch (err) {
        console.error('Import or connection error:', err)
        setStatus(`❌ Failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    testSupabase()
  }, [])

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
      <h3 className="font-bold text-yellow-800">Simple Supabase Test</h3>
      <p className="text-yellow-700">{status}</p>
    </div>
  )
} 