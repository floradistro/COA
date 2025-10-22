# How to Apply Backend Improvements

## Overview
This guide walks you through implementing the backend improvements for WhaleTools using Supabase.

---

## Step 1: Apply Database Migrations

### Option A: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase DATA instance dashboard**
   - URL: https://elhsobjvwmjfminxxcwy.supabase.co
   - Navigate to: **SQL Editor** in left sidebar

2. **Apply Migration 1: Audit & Activity Tracking**
   - Click "New query"
   - Copy contents from: `supabase/migrations/20250122000000_add_audit_and_activity_tracking.sql`
   - Paste into SQL Editor
   - Click "Run" (▶️ button)
   - Wait for: "Success. No rows returned"

3. **Apply Migration 2: Database Functions**
   - Click "New query"
   - Copy contents from: `supabase/migrations/20250122000001_add_database_functions.sql`
   - Paste into SQL Editor
   - Click "Run" (▶️ button)
   - Wait for: "Success. No rows returned"

4. **Verify Installation**
   - Run this query in SQL Editor:
   ```sql
   -- Check tables
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public'
   ORDER BY table_name;
   
   -- Check functions
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
     AND routine_type = 'FUNCTION'
   ORDER BY routine_name;
   
   -- Check triggers
   SELECT trigger_name, event_object_table
   FROM information_schema.triggers
   WHERE trigger_schema = 'public'
   ORDER BY event_object_table, trigger_name;
   ```

### Option B: Using Supabase CLI

```bash
cd /Users/f/Desktop/V1WHALETOOL

# Initialize Supabase (if not done)
supabase init

# Link to your remote project
supabase link --project-ref elhsobjvwmjfminxxcwy

# Push migrations
supabase db push

# Verify
supabase db diff
```

---

## Step 2: Test New Features

### Test 1: Audit Logging
```sql
-- Create a test client
INSERT INTO clients (name, address, email)
VALUES ('Test Client', '123 Test St', 'test@test.com');

-- Check audit log
SELECT * FROM audit_logs 
WHERE table_name = 'clients' 
ORDER BY created_at DESC 
LIMIT 5;
```

### Test 2: COA Stats Function
```sql
-- Get stats for all COAs
SELECT * FROM get_coa_stats(NULL);

-- Get stats for specific client
SELECT * FROM get_coa_stats('YOUR-CLIENT-UUID-HERE');
```

### Test 3: Search Function
```sql
-- Search for strain
SELECT * FROM search_coas('OG Kush', 10);

-- Search for sample ID
SELECT * FROM search_coas('WHP', 10);
```

### Test 4: System Health
```sql
-- Get system overview
SELECT get_system_health();
```

---

## Step 3: Update Frontend Code

### Install Required Packages
```bash
cd /Users/f/Desktop/V1WHALETOOL
npm install
```

### Create Helper Functions

Create: `src/lib/analytics.ts`
```typescript
import { supabaseData } from './supabaseClient'

export async function trackCOAView(
  coaId: string,
  viewerInfo?: {
    ip?: string
    device?: string
    browser?: string
    sessionId?: string
  }
) {
  try {
    await supabaseData.rpc('track_coa_view', {
      coa_uuid: coaId,
      viewer_ip_address: viewerInfo?.ip,
      viewer_device_type: viewerInfo?.device,
      viewer_browser_type: viewerInfo?.browser,
      session_uuid: viewerInfo?.sessionId
    })
  } catch (error) {
    console.error('Failed to track COA view:', error)
  }
}

export async function getCOAAnalytics(coaId: string) {
  const { data, error } = await supabaseData.rpc('get_coa_analytics_summary', {
    coa_uuid: coaId
  })
  
  if (error) throw error
  return data
}
```

Create: `src/lib/coaOperations.ts`
```typescript
import { supabaseData } from './supabaseClient'
import { COAData } from '@/types'

export async function getCOAStats(clientId?: string) {
  const { data, error } = await supabaseData.rpc('get_coa_stats', {
    client_uuid: clientId || null
  })
  
  if (error) throw error
  return data
}

export async function searchCOAs(
  query: string,
  options?: {
    limit?: number
    offset?: number
    clientId?: string
    status?: string
  }
) {
  const { data, error } = await supabaseData.rpc('search_coas', {
    search_query: query,
    limit_count: options?.limit || 50,
    offset_count: options?.offset || 0,
    client_filter: options?.clientId || null,
    status_filter: options?.status || 'active'
  })
  
  if (error) throw error
  return data
}

export async function getClientDashboard(clientId: string) {
  const { data, error } = await supabaseData.rpc('get_client_dashboard', {
    client_uuid: clientId
  })
  
  if (error) throw error
  return data
}

export async function getPopularStrains(clientId?: string, limit = 20) {
  const { data, error } = await supabaseData.rpc('get_popular_strains', {
    client_uuid: clientId || null,
    limit_count: limit
  })
  
  if (error) throw error
  return data
}

export async function batchCreateCOAs(coasData: any[]) {
  const { data, error } = await supabaseData.rpc('batch_create_coas', {
    coas_data: coasData
  })
  
  if (error) throw error
  return data
}
```

Create: `src/lib/notifications.ts`
```typescript
import { supabaseData } from './supabaseClient'

export async function getNotifications(userId: string, unreadOnly = false) {
  let query = supabaseData
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (unreadOnly) {
    query = query.eq('is_read', false)
  }
  
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function markNotificationAsRead(notificationId: string) {
  const { error } = await supabaseData
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)
  
  if (error) throw error
}

export async function deleteNotification(notificationId: string) {
  const { error } = await supabaseData
    .from('notifications')
    .delete()
    .eq('id', notificationId)
  
  if (error) throw error
}

// Subscribe to real-time notifications
export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: any) => void
) {
  const subscription = supabaseData
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        onNotification(payload.new)
      }
    )
    .subscribe()
  
  return () => subscription.unsubscribe()
}
```

Create: `src/lib/activityLog.ts`
```typescript
import { supabaseData } from './supabaseClient'

export async function logActivity(
  action: string,
  entityType: string,
  entityId: string,
  metadata?: any
) {
  const { data: { user } } = await supabaseData.auth.getUser()
  
  if (!user) return
  
  const { error } = await supabaseData
    .from('activity_logs')
    .insert({
      user_id: user.id,
      user_email: user.email,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata
    })
  
  if (error) {
    console.error('Failed to log activity:', error)
  }
}

export async function getUserActivity(userId: string, limit = 50) {
  const { data, error } = await supabaseData
    .from('activity_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data
}
```

---

## Step 4: Update COA Generation Flow

### Before (Old Way):
```typescript
// In your COA generation component
const uploadCOA = async () => {
  // Upload PDF
  const { data, error } = await supabase.storage
    .from('coas')
    .upload(filePath, pdfBlob)
  
  // Save metadata
  await supabase.from('coa_metadata').insert({
    sample_id: coaData.sampleId,
    // ... other fields
  })
}
```

### After (New Way with Auto-Logging):
```typescript
import { logActivity } from '@/lib/activityLog'
import { supabaseData } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'

const uploadCOA = async () => {
  const { user } = useAuth()
  
  // Upload PDF
  const { data: uploadData, error: uploadError } = await supabaseData.storage
    .from('coas')
    .upload(filePath, pdfBlob)
  
  if (uploadError) throw uploadError
  
  // Save metadata (this will auto-trigger notification and audit log)
  const { data: coa, error } = await supabaseData
    .from('coa_metadata')
    .insert({
      sample_id: coaData.sampleId,
      client_id: selectedClient.id,
      strain: coaData.strain,
      total_thc: coaData.totalTHC,
      total_cbd: coaData.totalCBD,
      pdf_url: uploadData.path,
      generated_by: user?.id,  // NEW: Track who generated it
      uploaded_by: user?.id,   // NEW: Track who uploaded it
      status: 'active'          // NEW: Set status
      // ... other fields
    })
    .select()
    .single()
  
  if (error) throw error
  
  // Optional: Manual activity log for additional context
  await logActivity(
    'coa_generated',
    'coa',
    coa.id,
    {
      strain: coaData.strain,
      client_name: selectedClient.name
    }
  )
  
  return coa
}
```

---

## Step 5: Add Real-Time Features

### Add Notification System to Layout

Create: `src/components/NotificationBell.tsx`
```typescript
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getNotifications, markNotificationAsRead, subscribeToNotifications } from '@/lib/notifications'

export default function NotificationBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    if (!user) return

    // Fetch initial notifications
    getNotifications(user.id, true).then(data => {
      setNotifications(data)
      setUnreadCount(data.length)
    })

    // Subscribe to real-time updates
    const unsubscribe = subscribeToNotifications(user.id, (newNotification) => {
      setNotifications(prev => [newNotification, ...prev])
      setUnreadCount(prev => prev + 1)
      
      // Show toast notification
      alert(`${newNotification.title}: ${newNotification.message}`)
    })

    return unsubscribe
  }, [user])

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId)
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-400 hover:text-white"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No new notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="font-semibold text-gray-900">{notification.title}</div>
                  <div className="text-sm text-gray-600">{notification.message}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(notification.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

### Add to Navigation Component
```typescript
// In src/components/Navigation.tsx
import NotificationBell from './NotificationBell'

// Add to your navigation bar
<NotificationBell />
```

---

## Step 6: Add Analytics Dashboard

Create: `src/app/analytics/page.tsx`
```typescript
'use client'

import { useEffect, useState } from 'react'
import { getCOAStats, getPopularStrains } from '@/lib/coaOperations'
import { supabaseData } from '@/lib/supabaseClient'
import { ProtectedRoute } from '@/components/ProtectedRoute'

function AnalyticsDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [popularStrains, setPopularStrains] = useState<any[]>([])
  const [systemHealth, setSystemHealth] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      
      // Get overall stats
      const statsData = await getCOAStats()
      setStats(statsData[0])
      
      // Get popular strains
      const strainsData = await getPopularStrains(null, 10)
      setPopularStrains(strainsData)
      
      // Get system health
      const { data: healthData } = await supabaseData.rpc('get_system_health')
      setSystemHealth(healthData)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8">Loading analytics...</div>
  }

  return (
    <div className="min-h-screen bg-neutral-800 p-8">
      <h1 className="text-4xl font-bold text-white mb-8">Analytics Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total COAs" value={stats?.total_coas || 0} />
        <StatCard title="This Month" value={stats?.coas_this_month || 0} />
        <StatCard title="Avg THC" value={`${stats?.avg_thc || 0}%`} />
        <StatCard title="Avg CBD" value={`${stats?.avg_cbd || 0}%`} />
      </div>

      {/* Popular Strains */}
      <div className="bg-white/5 rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Popular Strains</h2>
        <div className="space-y-3">
          {popularStrains.map((strain, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div>
                <div className="font-semibold text-white">{strain.strain}</div>
                <div className="text-sm text-gray-400">
                  {strain.count} tests • Avg THC: {strain.avg_thc}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Health */}
      {systemHealth && (
        <div className="bg-white/5 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">System Health</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <InfoItem label="Total Clients" value={systemHealth.total_clients} />
            <InfoItem label="COAs Today" value={systemHealth.coas_today} />
            <InfoItem label="This Week" value={systemHealth.coas_this_week} />
            <InfoItem label="Database Size" value={systemHealth.database_size} />
            <InfoItem label="Views Today" value={systemHealth.total_views_today} />
            <InfoItem label="Pending Notifications" value={systemHealth.active_notifications} />
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white/5 rounded-xl p-6">
      <div className="text-sm text-gray-400 mb-2">{title}</div>
      <div className="text-3xl font-bold text-white">{value}</div>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-lg font-semibold text-white">{value}</div>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <AnalyticsDashboard />
    </ProtectedRoute>
  )
}
```

---

## Step 7: Enable Scheduled Jobs (Optional)

### Using Supabase Dashboard

1. Go to **Database > Extensions**
2. Enable `pg_cron` extension

3. Run this SQL to schedule automated tasks:

```sql
-- Clean up old notifications daily at 2 AM
SELECT cron.schedule(
  'cleanup-old-notifications',
  '0 2 * * *',
  $$SELECT cleanup_old_notifications(30);$$
);

-- Archive old COAs monthly on 1st at 3 AM
SELECT cron.schedule(
  'archive-old-coas',
  '0 3 1 * *',
  $$SELECT archive_old_coas(730, false);$$
);
```

---

## Troubleshooting

### Issue: Functions not found
**Solution:** Make sure you applied migrations to the correct Supabase instance (DATA instance, not AUTH)

### Issue: RLS policy errors
**Solution:** Check that you're authenticated when calling functions

### Issue: Triggers not firing
**Solution:** Verify triggers are enabled:
```sql
SELECT * FROM information_schema.triggers WHERE trigger_schema = 'public';
```

### Issue: Can't see notifications
**Solution:** Check that notifications table has RLS policies for your user

---

## Next Steps

1. ✅ Apply migrations
2. ✅ Test all functions
3. ✅ Create helper libraries
4. ✅ Update COA generation flow
5. ✅ Add notification system
6. ✅ Create analytics dashboard
7. 🚀 Deploy to production

---

**Questions? Check the main BACKEND_IMPROVEMENT_PLAN.md for detailed explanations.**

