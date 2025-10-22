import { supabaseData } from './supabaseClient'

/**
 * Get comprehensive COA statistics
 */
export async function getCOAStats(clientId?: string) {
  try {
    const { data, error } = await supabaseData.rpc('get_coa_stats', {
      client_uuid: clientId || null
    })

    if (error) {
      console.error('Supabase RPC Error Details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: error
      })
      throw error
    }
    return data?.[0] || null
  } catch (error) {
    console.error('Failed to get COA stats:', error)
    return null
  }
}

/**
 * Search COAs by strain, sample ID, or client name
 */
export async function searchCOAs(query: string, limit = 50) {
  try {
    if (query.length < 2) return []

    const { data, error } = await supabaseData.rpc('search_coas', {
      search_query: query,
      limit_count: limit
    })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Failed to search COAs:', error)
    return []
  }
}

/**
 * Get most popular strains
 */
export async function getPopularStrains(limit = 10) {
  try {
    const { data, error } = await supabaseData.rpc('get_popular_strains', {
      limit_count: limit
    })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Failed to get popular strains:', error)
    return []
  }
}

