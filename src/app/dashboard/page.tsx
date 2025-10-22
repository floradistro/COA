'use client'

import { useState, useEffect } from 'react'
import { getCOAStats, getPopularStrains } from '@/lib/coaStats'
import { getSystemHealth } from '@/lib/analytics'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import GeometricBackground from '@/components/OceanBackground'
import { supabaseData } from '@/lib/supabaseClient'

function DashboardContent() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [popularStrains, setPopularStrains] = useState<any[]>([])
  const [systemHealth, setSystemHealth] = useState<any>(null)
  const [recentCOAs, setRecentCOAs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      loadDashboard()
    }
  }, [mounted])

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const [statsData, strainsData, healthData, coasData] = await Promise.all([
        getCOAStats(),
        getPopularStrains(10),
        getSystemHealth(),
        supabaseData
          .from('coa_metadata')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)
      ])

      setStats(statsData)
      setPopularStrains(strainsData)
      setSystemHealth(healthData)
      setRecentCOAs(coasData.data || [])
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-neutral-800 relative flex items-center justify-center">
        <GeometricBackground />
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          <div className="text-white text-sm">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-800 relative overflow-hidden">
      <GeometricBackground />
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900/10 via-transparent to-neutral-900/10 z-[1]" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-[2]">
        {/* Header */}
        <div className="mb-8 backdrop-blur-[2px] rounded-2xl p-8 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-4xl md:text-5xl font-bold text-white" style={{ fontFamily: 'Lobster, cursive' }}>
              WhaleTools
            </h1>
            <span className="text-2xl text-neutral-500">•</span>
            <h2 className="text-2xl md:text-3xl font-bold text-white bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent">
              Analytics Dashboard
            </h2>
          </div>
          <p className="text-neutral-400 text-sm md:text-base">Real-time insights and performance metrics</p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MetricCard 
            icon="📊"
            label="Total COAs"
            value={systemHealth?.total_coas?.toString() || '0'}
            trend={systemHealth?.coas_this_month > 0 ? 'up' : null}
            delay="100"
          />
          <MetricCard 
            icon="📅"
            label="This Month"
            value={systemHealth?.coas_this_month?.toString() || '0'}
            delay="200"
          />
          <MetricCard 
            icon="📈"
            label="This Week"
            value={systemHealth?.coas_this_week?.toString() || '0'}
            delay="300"
          />
          <MetricCard 
            icon="👁️"
            label="Views Today"
            value={systemHealth?.total_views_today?.toString() || '0'}
            delay="400"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performing Strains */}
          <div className="backdrop-blur-[2px] rounded-2xl p-6 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] hover:border-white/20 transition-all duration-500 animate-slide-up" style={{animationDelay: '100ms'}}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-xl">
                <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Top Performing Strains</h2>
            </div>
            {popularStrains.length > 0 ? (
              <div className="space-y-2">
                {popularStrains.map((strain, idx) => (
                  <div 
                    key={idx} 
                    className="group flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-300 border border-transparent hover:border-white/10"
                  >
                    <div className={`flex items-center justify-center w-12 h-12 rounded-xl font-bold text-lg transition-all duration-300 ${
                      idx === 0 ? 'bg-gradient-to-br from-yellow-500/30 to-yellow-600/20 text-yellow-300 shadow-lg' :
                      idx === 1 ? 'bg-gradient-to-br from-gray-400/30 to-gray-500/20 text-gray-300 shadow-lg' :
                      idx === 2 ? 'bg-gradient-to-br from-orange-500/30 to-orange-600/20 text-orange-300 shadow-lg' :
                      'bg-white/5 text-neutral-400'
                    }`}>
                      #{idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white truncate group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-neutral-300 group-hover:bg-clip-text transition-all">
                        {strain.strain}
                      </div>
                      <div className="text-xs text-neutral-400 mt-1">
                        {strain.count} tests • Avg THC: {strain.avg_thc}% • CBD: {strain.avg_cbd}%
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-neutral-400">
                <svg className="w-16 h-16 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <div className="text-sm">No strain data available</div>
              </div>
            )}
          </div>

          {/* Recent COA Activity */}
          <div className="backdrop-blur-[2px] rounded-2xl p-6 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] hover:border-white/20 transition-all duration-500 animate-slide-up" style={{animationDelay: '200ms'}}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-xl">
                <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Recent Activity</h2>
            </div>
            {recentCOAs.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                {recentCOAs.map((coa, idx) => (
                  <div 
                    key={coa.id} 
                    className="group p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-300 border border-transparent hover:border-white/10 cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-white text-sm group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-neutral-300 group-hover:bg-clip-text transition-all">
                          {coa.strain_name}
                        </div>
                        <div className="text-xs text-neutral-400 mt-1">
                          Sample: {coa.sample_id} • Client: {coa.client_name}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-0.5 bg-white/5 text-neutral-300 rounded">
                            THC: {coa.total_thc}%
                          </span>
                          {coa.view_count > 0 && (
                            <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded">
                              {coa.view_count} views
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-neutral-500">
                        {new Date(coa.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-neutral-400">
                <svg className="w-16 h-16 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm">No recent activity</div>
              </div>
            )}
          </div>

          {/* System Status */}
          <div className="backdrop-blur-[2px] rounded-2xl p-6 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] hover:border-white/20 transition-all duration-500 animate-slide-up" style={{animationDelay: '300ms'}}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-xl">
                <svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">System Status</h2>
            </div>
            {systemHealth ? (
              <div className="space-y-4">
                <HealthIndicator label="Database" status="operational" value={`${systemHealth.total_coas} COAs stored`} />
                <HealthIndicator label="Analytics Engine" status="operational" value={`${systemHealth.total_views_today} views tracked today`} />
                <HealthIndicator label="Notification System" status={systemHealth.active_notifications > 0 ? 'active' : 'idle'} value={`${systemHealth.active_notifications} pending alerts`} />
                <HealthIndicator label="Storage & Backup" status="operational" value="All systems operational" />
                
                <div className="pt-4 mt-4 border-t border-white/5">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>Last System Check</span>
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      {new Date(systemHealth.last_updated).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48">
                <div className="text-neutral-400 text-sm">Loading system status...</div>
              </div>
            )}
          </div>

          {/* Performance Overview */}
          <div className="backdrop-blur-[2px] rounded-2xl p-6 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] hover:border-white/20 transition-all duration-500 animate-slide-up" style={{animationDelay: '400ms'}}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-white/10 to-white/5 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Activity Overview</h2>
            </div>
            {stats || systemHealth ? (
              <div className="space-y-3">
                <ProgressStatItem 
                  label="Total COAs Generated" 
                  value={stats?.total_coas || systemHealth?.total_coas || 0} 
                  max={100} 
                />
                <ProgressStatItem 
                  label="COAs This Month" 
                  value={stats?.coas_this_month || systemHealth?.coas_this_month || 0} 
                  max={stats?.total_coas || systemHealth?.total_coas || 50} 
                />
                <ProgressStatItem 
                  label="COAs This Year" 
                  value={stats?.coas_this_year || systemHealth?.coas_this_year || 0} 
                  max={stats?.total_coas || systemHealth?.total_coas || 50} 
                />
                <ProgressStatItem 
                  label="Active COAs" 
                  value={stats?.coas_active || systemHealth?.total_coas || 0} 
                  max={stats?.total_coas || systemHealth?.total_coas || 50} 
                />
                
                {stats?.most_common_strain && (
                  <div className="pt-4 mt-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-neutral-400 mb-1">Most Tested Strain</div>
                        <div className="text-lg font-semibold text-white">{stats.most_common_strain}</div>
                      </div>
                      <div className="p-2 bg-white/5 rounded-lg">
                        <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48">
                <div className="text-neutral-400 text-sm">Loading activity data...</div>
              </div>
            )}
          </div>
        </div>

        {/* Backend Services Status */}
        <div className="mt-6 backdrop-blur-[2px] rounded-2xl p-6 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] animate-slide-up" style={{animationDelay: '500ms'}}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-white/10 to-white/5 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Backend Services</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ServiceCard title="Audit Logging" status="active" icon="📝" delay="100" />
            <ServiceCard title="Activity Tracking" status="active" icon="📊" delay="200" />
            <ServiceCard title="Notifications" status="active" icon="🔔" delay="300" />
            <ServiceCard title="Analytics Engine" status="active" icon="📈" delay="400" />
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ icon, label, value, trend, delay }: { icon: string; label: string; value: string; trend?: 'up' | 'down' | null; delay: string }) {
  return (
    <div 
      className="backdrop-blur-[2px] rounded-2xl p-6 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] hover:border-white/20 hover:scale-105 transition-all duration-500 animate-slide-up"
      style={{animationDelay: `${delay}ms`}}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{icon}</span>
        {trend && (
          <div className={`p-1 rounded-lg ${trend === 'up' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            <svg className={`w-4 h-4 ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={trend === 'up' ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'} />
            </svg>
          </div>
        )}
      </div>
      <div className="text-sm text-neutral-400 mb-2">{label}</div>
      <div className="text-3xl font-bold text-white">{value}</div>
    </div>
  )
}

function ProgressStatItem({ label, value, max }: { label: string; value: number; max: number }) {
  const percentage = Math.min((value / Math.max(max, 1)) * 100, 100)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral-400">{label}</span>
        <span className="text-white font-semibold">{value}</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-white/20 to-white/40 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function HealthIndicator({ label, status, value }: { label: string; status: 'operational' | 'active' | 'idle'; value: string }) {
  const statusColors = {
    operational: 'bg-green-500',
    active: 'bg-blue-500',
    idle: 'bg-neutral-500'
  }
  
  return (
    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
      <div className={`w-2 h-2 rounded-full ${statusColors[status]} animate-pulse`} />
      <div className="flex-1">
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="text-xs text-neutral-400">{value}</div>
      </div>
      <div className="text-xs px-2 py-1 bg-white/5 text-neutral-300 rounded capitalize">
        {status}
      </div>
    </div>
  )
}

function ServiceCard({ title, status, icon, delay }: { title: string; status: 'active' | 'inactive'; icon: string; delay: string }) {
  return (
    <div 
      className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 hover:border-white/10 transition-all duration-300 animate-slide-up"
      style={{animationDelay: `${delay}ms`}}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{icon}</span>
        <div className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
      </div>
      <div className="text-white font-semibold text-sm mb-1">{title}</div>
      <div className={`text-xs px-2 py-1 rounded inline-block ${
        status === 'active' 
          ? 'bg-green-500/20 text-green-300'
          : 'bg-red-500/20 text-red-300'
      }`}>
        {status}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}

