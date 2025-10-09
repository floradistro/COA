'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import GeometricBackground from '@/components/OceanBackground'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signOut } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      // Sign in (no role check needed - this is a dedicated admin-only Supabase)
      await signIn(email, password)
      router.push('/')
    } catch (err: unknown) {
      console.error('Login error:', err)
      
      if (err && typeof err === 'object' && 'message' in err) {
        const message = (err as { message: string }).message
        
        if (message.includes('Email not confirmed')) {
          setError('Please verify your email before logging in. Check your inbox for the verification link.')
        } else if (message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.')
        } else {
          setError(`Login failed: ${message}`)
        }
      } else {
        setError('Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-800 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Three.js Geometric Background */}
      <GeometricBackground />
      
      {/* Ambient gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900/30 via-neutral-800/50 to-neutral-900/30 z-[1]" />
      
      <div className="max-w-md w-full relative z-[2]">
        {/* Glass morphic container */}
        <div className="bg-neutral-900/40 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.05)]">
          
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-5 mb-3">
              <div className="animate-float">
                <Image 
                  src="/logowhaletools.png" 
                  alt="WhaleTools Logo" 
                  width={180} 
                  height={180}
                  priority
                />
              </div>
              <h1 className="text-6xl font-bold text-white tracking-tight animate-fade-in" style={{ fontFamily: 'Lobster, cursive' }}>
                WhaleTools
              </h1>
            </div>
            <p className="text-red-600 text-lg font-bold tracking-[0.3em] uppercase" style={{ fontFamily: 'Courier New, monospace' }}>
              [CLASSIFIED]
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 backdrop-blur-xl rounded-2xl shadow-[0_8px_16px_0_rgba(239,68,68,0.15)]">
              <p className="text-red-300 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-3 tracking-wide">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-5 py-4 bg-white/5 backdrop-blur-xl text-white rounded-2xl focus:outline-none focus:bg-white/10 placeholder-neutral-500 transition-all duration-300 shadow-[0_4px_12px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)] focus:shadow-[0_4px_20px_0_rgba(59,130,246,0.3),inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-300 mb-3 tracking-wide">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-5 py-4 bg-white/5 backdrop-blur-xl text-white rounded-2xl focus:outline-none focus:bg-white/10 placeholder-neutral-500 transition-all duration-300 shadow-[0_4px_12px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)] focus:shadow-[0_4px_20px_0_rgba(59,130,246,0.3),inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 mt-8 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_24px_0_rgba(37,99,235,0.4)] hover:shadow-[0_12px_32px_0_rgba(37,99,235,0.5)] hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-neutral-400 font-light">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

