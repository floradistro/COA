'use client'

import { useState, useEffect } from 'react'
import { checkSupabaseBucket } from '@/utils/supabaseUtils'

export default function SupabaseStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking')

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    setStatus('checking')
    try {
      const { exists, error } = await checkSupabaseBucket()
      
      if (exists) {
        setStatus('connected')
      } else {
        setStatus('error')
        console.error('Supabase bucket check failed:', error || 'Unknown error')
      }
    } catch (err) {
      setStatus('error')
      console.error('Supabase connection failed:', err instanceof Error ? err.message : 'Connection failed')
    }
  }

  if (status === 'checking') {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
        <span>Checking cloud storage...</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600">
        <div className="w-2 h-2 bg-red-500 rounded-full" />
        <span>Cloud storage offline</span>
        <button
          onClick={checkConnection}
          className="text-xs underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm text-green-600">
      <div className="w-2 h-2 bg-green-500 rounded-full" />
      <span>Cloud storage ready</span>
    </div>
  )
} 