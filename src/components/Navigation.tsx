'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const { user, signOut } = useAuth()
  const pathname = usePathname()

  const isAuthPage = pathname === '/login' || pathname === '/signup'

  if (isAuthPage) {
    return null
  }

  return (
    <nav className="backdrop-blur-sm border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Spacer for balance */}
          <div className="flex-1"></div>
          
          {/* Centered Navigation */}
          {user && (
            <div className="flex space-x-2">
              <Link 
                href="/" 
                className="text-neutral-300 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-white/5"
              >
                Generator
              </Link>
              <Link 
                href="/live-coas" 
                className="text-neutral-300 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-white/5"
              >
                Live COAs
              </Link>
              <Link 
                href="/clients" 
                className="text-neutral-300 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-white/5"
              >
                Clients
              </Link>
            </div>
          )}
          
          {/* Right side - Sign Out */}
          <div className="flex-1 flex items-center justify-end">
            {user && (
              <button
                onClick={signOut}
                className="bg-white/5 backdrop-blur-xl hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 shadow-[0_4px_12px_0_rgba(0,0,0,0.3)] flex items-center gap-2"
                title="Sign Out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

