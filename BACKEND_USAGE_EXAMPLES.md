# Backend Features - Usage Examples

Real-world examples of how to use the new backend features in WhaleTools.

---

## 1. Enhanced COA Upload with Auto-Tracking

### Old Way (Before)
```typescript
// Just uploads, no tracking
const handleUpload = async () => {
  const { error } = await supabase.storage
    .from('coas')
    .upload(path, blob)
  
  await supabase.from('coa_metadata').insert(data)
}
```

### New Way (After)
```typescript
'use client'

import { supabaseData } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'

const handleUpload = async () => {
  const { user } = useAuth()
  
  try {
    // 1. Upload PDF to storage
    const filePath = `${clientId}/${Date.now()}_${fileName}`
    const { data: uploadData, error: uploadError } = await supabaseData.storage
      .from('coas')
      .upload(filePath, pdfBlob)
    
    if (uploadError) throw uploadError
    
    // 2. Insert COA metadata (triggers will handle audit/notifications automatically!)
    const { data: coa, error: insertError } = await supabaseData
      .from('coa_metadata')
      .insert({
        sample_id: coaData.sampleId,
        client_id: selectedClientId,
        strain: coaData.strain,
        product_type: coaData.productType,
        batch_number: coaData.batchId,
        date_received: coaData.dateReceived,
        date_tested: coaData.dateTested,
        pdf_url: filePath,
        qr_code_url: coaData.qrCodeDataUrl,
        total_thc: coaData.totalTHC,
        total_cbd: coaData.totalCBD,
        total_cannabinoids: coaData.totalCannabinoids,
        cannabinoid_breakdown: coaData.cannabinoids,
        lab_director: coaData.labDirector,
        generated_by: user?.id,     // ✨ NEW: Track who generated
        uploaded_by: user?.id,      // ✨ NEW: Track who uploaded
        status: 'active',            // ✨ NEW: Set status
        tags: [coaData.productType], // ✨ NEW: Add searchable tags
        // Triggers will automatically:
        // - Log this insert to audit_logs
        // - Create a notification for the user
        // - Update updated_at timestamp
      })
      .select()
      .single()
    
    if (insertError) throw insertError
    
    // 3. Optionally log additional activity context
    await supabaseData.from('activity_logs').insert({
      user_id: user?.id,
      user_email: user?.email,
      action: 'coa_generated',
      entity_type: 'coa',
      entity_id: coa.id,
      metadata: {
        strain: coaData.strain,
        client_name: selectedClient.name,
        total_thc: coaData.totalTHC,
        generation_method: 'manual' // or 'batch'
      }
    })
    
    return { success: true, coa }
  } catch (error) {
    console.error('COA upload failed:', error)
    
    // Log error as activity
    await supabaseData.from('activity_logs').insert({
      user_id: user?.id,
      user_email: user?.email,
      action: 'coa_upload_failed',
      entity_type: 'coa',
      metadata: {
        error: error.message,
        strain: coaData.strain
      }
    })
    
    throw error
  }
}
```

**What happens automatically now:**
- ✅ Audit log created (who, what, when)
- ✅ User notification sent ("COA Upload Complete")
- ✅ Timestamp updated
- ✅ Activity tracked
- ✅ Full history preserved

---

## 2. Smart COA Search

### Add Search Bar to Your App
```typescript
'use client'

import { useState } from 'react'
import { supabaseData } from '@/lib/supabaseClient'

export function COASearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  const handleSearch = async (searchText: string) => {
    if (searchText.length < 2) {
      setResults([])
      return
    }

    setSearching(true)
    try {
      // ✨ NEW: Use full-text search function
      const { data, error } = await supabaseData.rpc('search_coas', {
        search_query: searchText,
        limit_count: 20,
        offset_count: 0,
        client_filter: null, // or specific client UUID
        status_filter: 'active'
      })

      if (error) throw error
      setResults(data || [])
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          handleSearch(e.target.value)
        }}
        placeholder="Search COAs by strain, sample ID, or client..."
        className="w-full px-4 py-3 bg-white/5 text-white rounded-xl"
      />

      {searching && (
        <div className="absolute right-3 top-3">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
          {results.map((result) => (
            <div
              key={result.coa_id}
              className="p-4 hover:bg-gray-50 cursor-pointer border-b"
              onClick={() => {
                // Navigate to COA or preview it
                window.location.href = `/live-coas?id=${result.coa_id}`
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    {result.strain}
                  </div>
                  <div className="text-sm text-gray-600">
                    Sample: {result.sample_id} • Client: {result.client_name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    THC: {result.total_thc}% • CBD: {result.total_cbd}%
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  Relevance: {(result.rank * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Features:**
- ✅ Searches across strain, sample ID, batch number, client name
- ✅ Relevance ranking
- ✅ Lightning fast (indexed)
- ✅ Filter by client or status

---

## 3. Client Dashboard with Stats

### Enhanced Client Page with Analytics
```typescript
'use client'

import { useEffect, useState } from 'react'
import { supabaseData } from '@/lib/supabaseClient'

export function ClientDashboard({ clientId }: { clientId: string }) {
  const [dashboard, setDashboard] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [clientId])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      
      // ✨ NEW: Single function call gets everything
      const { data, error } = await supabaseData.rpc('get_client_dashboard', {
        client_uuid: clientId
      })

      if (error) throw error
      setDashboard(data)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  const stats = dashboard?.stats
  const recentCOAs = dashboard?.recent_coas || []
  const monthlyTrend = dashboard?.monthly_trend || []

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          title="Total COAs" 
          value={stats.total_coas}
          icon="📊"
        />
        <StatCard 
          title="This Month" 
          value={stats.coas_this_month}
          icon="📅"
        />
        <StatCard 
          title="Avg THC" 
          value={`${stats.avg_thc}%`}
          icon="🌿"
        />
        <StatCard 
          title="Avg CBD" 
          value={`${stats.avg_cbd}%`}
          icon="💚"
        />
      </div>

      {/* Recent COAs */}
      <div className="bg-white/5 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Recent COAs</h3>
        <div className="space-y-3">
          {recentCOAs.map((coa: any) => (
            <div key={coa.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div>
                <div className="font-semibold text-white">{coa.strain}</div>
                <div className="text-sm text-gray-400">Sample: {coa.sample_id}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-white">THC: {coa.total_thc}%</div>
                <div className="text-xs text-gray-400">
                  {new Date(coa.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="bg-white/5 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Monthly Trend</h3>
        <div className="space-y-2">
          {monthlyTrend.map((month: any) => (
            <div key={month.month} className="flex items-center gap-3">
              <div className="w-24 text-sm text-gray-400">{month.month}</div>
              <div className="flex-1 bg-white/5 rounded-full h-8 relative">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full"
                  style={{ width: `${(month.count / stats.coas_this_year) * 100}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-semibold">
                  {month.count} COAs
                </span>
              </div>
              <div className="text-sm text-gray-400">
                THC: {month.avg_thc}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon }: any) {
  return (
    <div className="bg-white/5 rounded-xl p-4">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-xs text-gray-400 mb-1">{title}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  )
}
```

**Benefits:**
- ✅ One function call gets all dashboard data
- ✅ Pre-calculated stats (fast!)
- ✅ Trend analysis
- ✅ Visual charts

---

## 4. Batch COA Upload

### Upload Multiple COAs at Once
```typescript
'use client'

import { useState } from 'react'
import { supabaseData } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'

export function BatchCOAUpload() {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleBatchUpload = async (coasData: any[]) => {
    setUploading(true)
    try {
      // Prepare batch data
      const batchData = coasData.map(coa => ({
        sample_id: coa.sampleId,
        client_id: coa.clientId,
        strain: coa.strain,
        product_type: coa.productType,
        date_received: coa.dateReceived,
        date_tested: coa.dateTested,
        pdf_url: coa.pdfUrl,
        qr_code_url: coa.qrCodeUrl,
        batch_number: coa.batchId,
        total_thc: coa.totalTHC,
        total_cbd: coa.totalCBD,
        total_cannabinoids: coa.totalCannabinoids,
        cannabinoid_breakdown: coa.cannabinoids,
        lab_director: coa.labDirector,
        generated_by: user?.id,
        uploaded_by: user?.id,
        status: 'active'
      }))

      // ✨ NEW: Batch insert with error handling
      const { data, error } = await supabaseData.rpc('batch_create_coas', {
        coas_data: batchData
      })

      if (error) throw error

      setResult(data[0])

      // Show results
      alert(`
        ✅ Successfully created: ${data[0].created_count} COAs
        ${data[0].failed_count > 0 ? `❌ Failed: ${data[0].failed_count} COAs` : ''}
      `)

      // Log batch upload activity
      await supabaseData.from('activity_logs').insert({
        user_id: user?.id,
        user_email: user?.email,
        action: 'batch_coa_upload',
        entity_type: 'coa',
        metadata: {
          total_uploaded: coasData.length,
          successful: data[0].created_count,
          failed: data[0].failed_count
        }
      })

    } catch (error) {
      console.error('Batch upload failed:', error)
      alert('Batch upload failed: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white/5 rounded-xl p-6">
      <h3 className="text-xl font-bold text-white mb-4">Batch Upload COAs</h3>
      
      {/* Your upload UI here */}
      
      {uploading && (
        <div className="flex items-center gap-3 text-white">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Uploading batch...
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
          <div className="text-white font-semibold mb-2">Batch Upload Complete</div>
          <div className="text-sm text-green-200">
            ✅ Successfully created: {result.created_count} COAs<br />
            {result.failed_count > 0 && (
              <>❌ Failed: {result.failed_count} COAs</>
            )}
          </div>
          {result.errors && result.errors.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-yellow-200">View Errors</summary>
              <pre className="mt-2 text-xs text-red-200 overflow-x-auto">
                {JSON.stringify(result.errors, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
```

**Benefits:**
- ✅ Upload 100s of COAs at once
- ✅ Transaction safety (all or nothing)
- ✅ Detailed error reporting
- ✅ Continues on error (doesn't stop entire batch)

---

## 5. Real-Time COA View Tracking

### Track When Someone Views a COA
```typescript
'use client'

import { useEffect } from 'react'
import { supabaseData } from '@/lib/supabaseClient'

export function COAViewer({ coaId }: { coaId: string }) {
  useEffect(() => {
    // Track COA view when component mounts
    trackView()
  }, [coaId])

  const trackView = async () => {
    try {
      // Get viewer info
      const device = /Mobile|Android|iPhone/i.test(navigator.userAgent) 
        ? 'mobile' 
        : 'desktop'
      const browser = navigator.userAgent.includes('Chrome') 
        ? 'Chrome' 
        : navigator.userAgent.includes('Safari') 
        ? 'Safari' 
        : 'Other'

      // ✨ NEW: Track view (updates analytics + view count)
      await supabaseData.rpc('track_coa_view', {
        coa_uuid: coaId,
        viewer_device_type: device,
        viewer_browser_type: browser,
        session_uuid: sessionStorage.getItem('session_id') || crypto.randomUUID()
      })
    } catch (error) {
      console.error('Failed to track view:', error)
    }
  }

  return (
    <div>
      {/* Your COA display here */}
    </div>
  )
}
```

### Show View Count
```typescript
export function COAViewCount({ coaId }: { coaId: string }) {
  const [analytics, setAnalytics] = useState<any>(null)

  useEffect(() => {
    loadAnalytics()
  }, [coaId])

  const loadAnalytics = async () => {
    const { data } = await supabaseData.rpc('get_coa_analytics_summary', {
      coa_uuid: coaId
    })
    setAnalytics(data?.[0])
  }

  if (!analytics) return null

  return (
    <div className="flex items-center gap-4 text-sm text-gray-400">
      <span>👁️ {analytics.total_views} views</span>
      <span>⬇️ {analytics.total_downloads} downloads</span>
      <span>🖨️ {analytics.total_prints} prints</span>
    </div>
  )
}
```

**Benefits:**
- ✅ Track every COA view automatically
- ✅ Device/browser analytics
- ✅ Session tracking
- ✅ Performance metrics

---

## 6. Popular Strains Widget

### Show Most Tested Strains
```typescript
'use client'

import { useEffect, useState } from 'react'
import { supabaseData } from '@/lib/supabaseClient'

export function PopularStrainsWidget({ clientId }: { clientId?: string }) {
  const [strains, setStrains] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPopularStrains()
  }, [clientId])

  const loadPopularStrains = async () => {
    try {
      // ✨ NEW: Get popular strains with stats
      const { data, error } = await supabaseData.rpc('get_popular_strains', {
        client_uuid: clientId || null,
        limit_count: 10
      })

      if (error) throw error
      setStrains(data || [])
    } catch (error) {
      console.error('Failed to load popular strains:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="bg-white/5 rounded-xl p-6">
      <h3 className="text-xl font-bold text-white mb-4">🔥 Popular Strains</h3>
      <div className="space-y-2">
        {strains.map((strain, idx) => (
          <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition">
            <div className="text-2xl font-bold text-gray-500">#{idx + 1}</div>
            <div className="flex-1">
              <div className="font-semibold text-white">{strain.strain}</div>
              <div className="text-sm text-gray-400">
                {strain.count} tests • Avg THC: {strain.avg_thc}% • CBD: {strain.avg_cbd}%
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Last tested: {new Date(strain.latest_test).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Benefits:**
- ✅ See trending strains
- ✅ Filter by client
- ✅ Average potency stats
- ✅ Last test date

---

## 7. Audit Log Viewer (Admin Only)

### View All System Changes
```typescript
'use client'

import { useEffect, useState } from 'react'
import { supabaseData } from '@/lib/supabaseClient'

export function AuditLogViewer() {
  const [logs, setLogs] = useState<any[]>([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadAuditLogs()
  }, [filter])

  const loadAuditLogs = async () => {
    let query = supabaseData
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (filter !== 'all') {
      query = query.eq('table_name', filter)
    }

    const { data, error } = await query
    if (error) {
      console.error('Failed to load audit logs:', error)
      return
    }

    setLogs(data || [])
  }

  return (
    <div className="bg-white/5 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">🔍 Audit Log</h3>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 bg-white/10 text-white rounded-lg"
        >
          <option value="all">All Tables</option>
          <option value="clients">Clients</option>
          <option value="coa_metadata">COAs</option>
        </select>
      </div>

      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="p-3 bg-white/5 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    log.action === 'INSERT' ? 'bg-green-500/20 text-green-300' :
                    log.action === 'UPDATE' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {log.action}
                  </span>
                  <span className="text-white font-semibold">{log.table_name}</span>
                </div>
                <div className="text-sm text-gray-400">
                  By: {log.user_email || 'system'} • {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
              <details className="text-xs">
                <summary className="cursor-pointer text-blue-300">View Details</summary>
                <pre className="mt-2 p-2 bg-black/30 rounded overflow-x-auto">
                  {JSON.stringify({
                    old: log.old_data,
                    new: log.new_data
                  }, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Benefits:**
- ✅ Complete change history
- ✅ Who changed what and when
- ✅ Before/after data comparison
- ✅ Filter by table

---

## 8. System Health Dashboard

### Monitor App Performance
```typescript
'use client'

import { useEffect, useState } from 'react'
import { supabaseData } from '@/lib/supabaseClient'

export function SystemHealthDashboard() {
  const [health, setHealth] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHealth()
    // Refresh every 30 seconds
    const interval = setInterval(loadHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadHealth = async () => {
    try {
      const { data, error } = await supabaseData.rpc('get_system_health')
      if (error) throw error
      setHealth(data)
    } catch (error) {
      console.error('Failed to load health:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">System Health</h2>
        <div className="text-sm text-gray-400">
          Last updated: {new Date(health.last_updated).toLocaleString()}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard 
          label="Total Clients" 
          value={health.total_clients}
          icon="👥"
        />
        <MetricCard 
          label="Active COAs" 
          value={health.total_coas}
          icon="📄"
        />
        <MetricCard 
          label="COAs Today" 
          value={health.coas_today}
          trend={health.coas_today > health.coas_yesterday ? 'up' : 'down'}
          icon="📈"
        />
        <MetricCard 
          label="Views Today" 
          value={health.total_views_today}
          icon="👁️"
        />
      </div>

      {/* Database Stats */}
      <div className="bg-white/5 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Database</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-400">Size</div>
            <div className="text-xl font-bold text-white">{health.database_size}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Pending Notifications</div>
            <div className="text-xl font-bold text-white">{health.active_notifications}</div>
          </div>
        </div>
      </div>

      {/* Largest Tables */}
      <div className="bg-white/5 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Storage Usage</h3>
        <div className="space-y-2">
          {health.largest_tables?.map((table: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-white/5 rounded">
              <span className="text-white">{table.table}</span>
              <span className="text-gray-400 text-sm">{table.size}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, icon, trend }: any) {
  return (
    <div className="bg-white/5 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className={`text-xs px-2 py-1 rounded ${
            trend === 'up' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
          }`}>
            {trend === 'up' ? '↗' : '↘'}
          </span>
        )}
      </div>
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  )
}
```

**Benefits:**
- ✅ Real-time system status
- ✅ Database size monitoring
- ✅ Activity trends
- ✅ Performance metrics

---

## Summary

### What You Get:
1. **Auto-tracking** - Everything logged automatically
2. **Smart Search** - Full-text search across all data
3. **Real-time Updates** - See changes instantly
4. **Analytics** - Understand your data
5. **Batch Operations** - Handle bulk actions efficiently
6. **Audit Trail** - Complete change history
7. **Performance** - Lightning fast queries
8. **Monitoring** - System health at a glance

### Next Steps:
1. ✅ Apply migrations (see APPLY_BACKEND_IMPROVEMENTS.md)
2. ✅ Copy the helper functions into your `src/lib/` folder
3. ✅ Replace old upload code with new tracked version
4. ✅ Add notification system to navigation
5. ✅ Create analytics dashboard page
6. 🚀 Deploy and enjoy!

---

**All these features use 100% Supabase - no custom backend needed! 🎉**

