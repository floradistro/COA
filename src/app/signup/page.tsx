'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import GeometricBackground from '@/components/OceanBackground'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      await signUp(email, password, fullName)
      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err: unknown) {
      console.error('Sign up error:', err)
      if (err && typeof err === 'object' && 'message' in err) {
        const message = (err as { message: string }).message
        if (message.includes('already registered')) {
          setError('This email is already registered. Please login instead.')
        } else {
          setError(message)
        }
      } else {
        setError('Failed to create account. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-neutral-800 flex items-center justify-center px-4 relative overflow-hidden">
        <GeometricBackground />
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900/30 via-neutral-800/50 to-neutral-900/30 z-[1]" />
        
        <div className="max-w-md w-full relative z-[2]">
          <div className="bg-neutral-900/40 backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.05)] p-10 text-center">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-neutral-400/20 rounded-full blur-2xl" />
              <div className="relative w-20 h-20 bg-neutral-700/30 rounded-full flex items-center justify-center mx-auto shadow-[0_8px_24px_0_rgba(128,128,128,0.3)]">
                <svg className="w-10 h-10 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Account Created!</h2>
            <p className="text-neutral-300 mb-6 font-light">Please check your email to verify your account before logging in.</p>
            <p className="text-neutral-400 text-sm font-light flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    )
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

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-neutral-300 mb-3 tracking-wide">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-5 py-4 bg-white/5 backdrop-blur-xl text-white rounded-2xl focus:outline-none focus:bg-white/10 placeholder-neutral-500 transition-all duration-300 shadow-[0_4px_12px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.05)] focus:shadow-[0_4px_20px_0_rgba(59,130,246,0.3),inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                placeholder="John Doe"
              />
            </div>

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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-300 mb-3 tracking-wide">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                  Creating account...
                </span>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-neutral-400 font-light">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

