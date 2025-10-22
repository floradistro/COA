'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { searchCOAs } from '@/lib/coaStats'

export default function Navigation() {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)

  const isAuthPage = pathname === '/login' || pathname === '/signup'

  if (isAuthPage) {
    return null
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    const results = await searchCOAs(query, 10)
    setSearchResults(results)
    setShowResults(true)
  }

  const handleSelectResult = (result: any) => {
    setShowResults(false)
    setSearchQuery('')
    router.push(`/live-coas?search=${result.sample_id}`)
  }

  return (
    <nav className="backdrop-blur-sm border-b border-white/5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          {/* Left - Navigation Links */}
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
              <Link 
                href="/vendor-coas" 
                className="text-neutral-300 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-white/5"
              >
                Vendors
              </Link>
              <Link 
                href="/dashboard" 
                className="text-neutral-300 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-white/5"
              >
                Dashboard
              </Link>
            </div>
          )}
          
          {/* Center - Search Bar */}
          {user && (
            <div className="flex-1 max-w-md relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                placeholder="Search COAs..."
                className="w-full px-4 py-2 pl-10 bg-white/5 backdrop-blur-xl text-white placeholder-neutral-500 rounded-xl focus:outline-none focus:bg-white/10 transition-all duration-300 border border-white/5 hover:border-white/10 focus:border-white/20 text-sm"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>

              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-neutral-900 border border-white/10 rounded-xl shadow-2xl max-h-96 overflow-y-auto z-50">
                  {searchResults.map((result) => (
                    <div
                      key={result.coa_id}
                      onMouseDown={() => handleSelectResult(result)}
                      className="p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-b-0 transition-all"
                    >
                      <div className="font-semibold text-white text-sm">{result.strain_name}</div>
                      <div className="text-xs text-neutral-400 mt-1">
                        Sample: {result.sample_id} • Client: {result.client_name}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-neutral-500">THC: {result.total_thc}%</span>
                        <span className="text-xs px-1.5 py-0.5 bg-blue-500/10 text-blue-300 rounded">
                          {(result.rank * 100).toFixed(0)}% match
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Right - Sign Out */}
          <div className="flex items-center justify-end">
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

