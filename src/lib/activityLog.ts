import { supabaseData } from './supabaseClient'

/**
 * Log user activity
 */
export async function logActivity(
  action: string,
  entityType: string,
  entityId: string,
  metadata?: Record<string, string | number | boolean>
) {
  try {
    const { data: { user } } = await supabaseData.auth.getUser()
    
    if (!user) {
      console.warn('No user found, skipping activity log')
      return
    }

    const { error } = await supabaseData
      .from('activity_logs')
      .insert({
        user_id: user.id,
        user_email: user.email,
        action,
        entity_type: entityType,
        entity_id: entityId,
        metadata: metadata || {}
      })

    if (error) {
      console.error('Failed to log activity:', error)
    }
  } catch (error) {
    console.error('Activity log error:', error)
  }
}

/**
 * Get user's recent activity
 */
export async function getUserActivity(userId: string, limit = 50) {
  try {
    const { data, error } = await supabaseData
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Failed to get user activity:', error)
    return []
  }
}

