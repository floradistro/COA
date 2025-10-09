'use client'

import { useState, useEffect } from 'react'
import { supabaseData } from '@/lib/supabaseClient'

export default function SupabaseStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking')

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    setStatus('checking')
    try {
      // Simple check - try to fetch from database
      const { data, error } = await supabaseData
        .from('clients')
        .select('id')
        .limit(1)
      
      if (error) {
        console.error('Database check failed:', error.message)
        setStatus('error')
      } else {
        setStatus('connected')
      }
    } catch (err) {
      setStatus('error')
      console.error('Connection failed:', err instanceof Error ? err.message : 'Connection failed')
    }
  }

  if (status === 'checking') {
    return (
      <div className="flex items-center gap-2 text-xs text-neutral-400">
        <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-pulse" />
        <span className="uppercase tracking-wider">Checking...</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-2 text-xs text-neutral-400">
        <div className="w-1.5 h-1.5 bg-neutral-600 rounded-full" />
        <span className="uppercase tracking-wider">Offline</span>
        <button
          onClick={checkConnection}
          className="text-xs text-neutral-300 hover:text-white transition-colors uppercase tracking-wider"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-xs text-neutral-400">
      <div className="w-1.5 h-1.5 bg-neutral-300 rounded-full" />
      <span className="uppercase tracking-wider">Ready</span>
    </div>
  )
} 