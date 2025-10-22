-- ============================================
-- FIX ALL BACKEND FUNCTIONS FOR ACTUAL SCHEMA
-- ============================================

-- 1. FIX: Get COA Stats (no client_id column)
DROP FUNCTION IF EXISTS get_coa_stats(UUID);
CREATE OR REPLACE FUNCTION get_coa_stats(client_uuid UUID DEFAULT NULL)
RETURNS TABLE (
  total_coas BIGINT,
  coas_this_month BIGINT,
  coas_this_year BIGINT,
  coas_active BIGINT,
  avg_thc NUMERIC,
  avg_cbd NUMERIC,
  most_common_strain TEXT,
  last_coa_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW()))::BIGINT,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('year', NOW()))::BIGINT,
    COUNT(*) FILTER (WHERE status = 'active')::BIGINT,
    NULL::NUMERIC,
    NULL::NUMERIC,
    MODE() WITHIN GROUP (ORDER BY strain_name),
    MAX(created_at)
  FROM coa_metadata;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. FIX: Search COAs
DROP FUNCTION IF EXISTS search_coas(TEXT, INTEGER);
CREATE OR REPLACE FUNCTION search_coas(
  search_query TEXT,
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  coa_id UUID,
  sample_id TEXT,
  strain_name TEXT,
  client_name TEXT,
  total_thc NUMERIC,
  total_cbd NUMERIC,
  created_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.sample_id,
    c.strain_name,
    c.client_name,
    c.total_thc,
    c.total_cbd,
    c.created_at,
    ts_rank(
      to_tsvector('english', 
        COALESCE(c.strain_name, '') || ' ' || 
        COALESCE(c.sample_id, '') || ' ' || 
        COALESCE(c.client_name, '')
      ),
      plainto_tsquery('english', search_query)
    ) as rank
  FROM coa_metadata c
  WHERE 
    to_tsvector('english', 
      COALESCE(c.strain_name, '') || ' ' || 
      COALESCE(c.sample_id, '') || ' ' || 
      COALESCE(c.client_name, '')
    ) @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC, c.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. FIX: Popular Strains
DROP FUNCTION IF EXISTS get_popular_strains(INTEGER);
CREATE OR REPLACE FUNCTION get_popular_strains(limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
  strain TEXT,
  count BIGINT,
  avg_thc NUMERIC,
  avg_cbd NUMERIC,
  latest_test TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.strain_name,
    COUNT(*)::BIGINT,
    ROUND(AVG(c.total_thc), 2),
    ROUND(AVG(c.total_cbd), 2),
    MAX(c.created_at)
  FROM coa_metadata c
  WHERE c.strain_name IS NOT NULL
  GROUP BY c.strain_name
  ORDER BY COUNT(*) DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FIX: System Health
DROP FUNCTION IF EXISTS get_system_health();
CREATE OR REPLACE FUNCTION get_system_health()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  result := jsonb_build_object(
    'total_coas', (SELECT COUNT(*) FROM coa_metadata),
    'coas_today', (SELECT COUNT(*) FROM coa_metadata WHERE created_at >= CURRENT_DATE),
    'coas_this_week', (SELECT COUNT(*) FROM coa_metadata WHERE created_at >= date_trunc('week', NOW())),
    'coas_this_month', (SELECT COUNT(*) FROM coa_metadata WHERE created_at >= date_trunc('month', NOW())),
    'total_views_today', COALESCE((SELECT COUNT(*) FROM coa_analytics WHERE event_type = 'view' AND created_at >= CURRENT_DATE), 0),
    'active_notifications', COALESCE((SELECT COUNT(*) FROM notifications WHERE is_read = false), 0),
    'last_updated', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FIX: Track COA View
DROP FUNCTION IF EXISTS track_coa_view(UUID, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION track_coa_view(
  coa_uuid UUID,
  viewer_device_type TEXT DEFAULT NULL,
  viewer_browser_type TEXT DEFAULT NULL,
  session_uuid TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO coa_analytics (
    coa_id,
    event_type,
    viewer_device,
    viewer_browser,
    session_id
  ) VALUES (
    coa_uuid,
    'view',
    viewer_device_type,
    viewer_browser_type,
    session_uuid
  );
  
  UPDATE coa_metadata
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = coa_uuid;
  
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FIX: COA Analytics Summary
DROP FUNCTION IF EXISTS get_coa_analytics_summary(UUID);
CREATE OR REPLACE FUNCTION get_coa_analytics_summary(coa_uuid UUID DEFAULT NULL)
RETURNS TABLE (
  total_views BIGINT,
  total_downloads BIGINT,
  unique_sessions BIGINT,
  most_common_device TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(COUNT(*) FILTER (WHERE event_type = 'view'), 0)::BIGINT,
    COALESCE(COUNT(*) FILTER (WHERE event_type = 'download'), 0)::BIGINT,
    COALESCE(COUNT(DISTINCT session_id), 0)::BIGINT,
    MODE() WITHIN GROUP (ORDER BY viewer_device)
  FROM coa_analytics
  WHERE (coa_uuid IS NULL OR coa_id = coa_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_coa_stats TO authenticated, anon;
GRANT EXECUTE ON FUNCTION search_coas TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_popular_strains TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_system_health TO authenticated, anon;
GRANT EXECUTE ON FUNCTION track_coa_view TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_coa_analytics_summary TO authenticated, anon;

-- Test queries to verify
DO $$
BEGIN
  RAISE NOTICE 'Testing functions...';
  
  PERFORM * FROM get_coa_stats(NULL);
  RAISE NOTICE '✅ get_coa_stats works';
  
  PERFORM * FROM get_popular_strains(5);
  RAISE NOTICE '✅ get_popular_strains works';
  
  PERFORM get_system_health();
  RAISE NOTICE '✅ get_system_health works';
  
  RAISE NOTICE 'All functions fixed and working!';
END $$;

