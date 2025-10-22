import { supabaseData } from './supabaseClient'

/**
 * Track when someone views a COA
 */
export async function trackCOAView(coaId: string) {
  try {
    const device = /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
    const browser = navigator.userAgent.includes('Chrome') ? 'Chrome' 
      : navigator.userAgent.includes('Safari') ? 'Safari' 
      : navigator.userAgent.includes('Firefox') ? 'Firefox'
      : 'Other'
    
    // Get or create session ID
    let sessionId = sessionStorage.getItem('coa_session_id')
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      sessionStorage.setItem('coa_session_id', sessionId)
    }

    const { data, error } = await supabaseData.rpc('track_coa_view', {
      coa_uuid: coaId,
      viewer_device_type: device,
      viewer_browser_type: browser,
      session_uuid: sessionId
    })

    if (error) {
      console.error('Failed to track COA view:', error)
      return false
    }

    return data
  } catch (error) {
    console.error('Track view error:', error)
    return false
  }
}

/**
 * Get analytics for a specific COA
 */
export async function getCOAAnalytics(coaId: string) {
  try {
    const { data, error } = await supabaseData.rpc('get_coa_analytics_summary', {
      coa_uuid: coaId
    })

    if (error) throw error
    return data?.[0] || null
  } catch (error) {
    console.error('Failed to get COA analytics:', error)
    return null
  }
}

/**
 * Get overall system analytics
 */
export async function getSystemHealth() {
  try {
    const { data, error } = await supabaseData.rpc('get_system_health')
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Failed to get system health:', error)
    return null
  }
}

