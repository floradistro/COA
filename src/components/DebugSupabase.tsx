'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function DebugSupabase() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    setResult('Testing connection...')
    
    try {
      console.log('Supabase client:', supabase)
      
      // Test basic connection
      const { data, error } = await supabase.from('_realtime').select('*').limit(1)
      
      if (error) {
        console.error('Supabase connection error:', error)
        setResult(`❌ Connection failed: ${error.message}`)
      } else {
        console.log('Supabase connection successful:', data)
        setResult('✅ Basic connection successful')
        
        // Test storage
        const { data: buckets, error: storageError } = await supabase.storage.listBuckets()
        
        if (storageError) {
          console.error('Storage error:', storageError)
          setResult(prev => prev + `\n❌ Storage error: ${storageError.message}`)
        } else {
          console.log('Storage buckets:', buckets)
          setResult(prev => prev + `\n✅ Storage accessible. Found ${buckets?.length || 0} buckets`)
          
          const coasBucket = buckets?.find(b => b.name === 'coas')
          if (coasBucket) {
            setResult(prev => prev + '\n✅ "coas" bucket exists')
          } else {
            setResult(prev => prev + '\n❌ "coas" bucket not found')
          }
        }
      }
      
    } catch (error) {
      console.error('Unexpected error:', error)
      setResult(`❌ Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="font-bold mb-2">Debug Supabase Connection</h3>
      
      <button
        onClick={testConnection}
        disabled={loading}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 mb-4"
      >
        {loading ? 'Testing...' : 'Debug Connection'}
      </button>
      
      {result && (
        <pre className="text-xs bg-black text-green-400 p-2 rounded whitespace-pre-wrap">
          {result}
        </pre>
      )}
      
      <div className="mt-4 text-xs text-gray-600">
        <p><strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://elhsobjvwmjfminxxcwy.supabase.co'}</p>
        <p><strong>Key:</strong> {(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsaHNvYmp2d21qZm1pbnh4Y3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDQzMzAsImV4cCI6MjA2NjI4MDMzMH0.sK5ggW0XxE_Y9x5dXQvq2IPbxo0WoQs3OcfXNhEbTyQ').substring(0, 20)}...</p>
      </div>
    </div>
  )
} 