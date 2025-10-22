import { supabaseData } from './supabaseClient'

/**
 * Get unread notifications for a user
 */
export async function getUnreadNotifications(userId: string) {
  try {
    const { data, error } = await supabaseData
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Failed to get notifications:', error)
    return []
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const { error } = await supabaseData
      .from('notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('id', notificationId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Failed to mark notification as read:', error)
    return false
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string) {
  try {
    const { error } = await supabaseData
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Failed to delete notification:', error)
    return false
  }
}

/**
 * Subscribe to real-time notifications
 */
interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  read_at: string | null
  created_at: string
}

export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: Notification) => void
) {
  const channel = supabaseData
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
        onNotification(payload.new as Notification)
      }
    )
    .subscribe()

  return () => {
    channel.unsubscribe()
  }
}

