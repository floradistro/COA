-- ============================================
-- PHASE 2: DATABASE FUNCTIONS (Stored Procedures)
-- Add powerful server-side functions for complex operations
-- ============================================

-- 1. GET COA STATISTICS
-- Returns comprehensive statistics for a specific client
CREATE OR REPLACE FUNCTION get_coa_stats(client_uuid UUID DEFAULT NULL)
RETURNS TABLE (
  total_coas BIGINT,
  coas_this_month BIGINT,
  coas_this_year BIGINT,
  coas_active BIGINT,
  coas_archived BIGINT,
  avg_thc NUMERIC,
  avg_cbd NUMERIC,
  max_thc NUMERIC,
  min_thc NUMERIC,
  most_common_strain TEXT,
  most_common_product_type TEXT,
  last_coa_date TIMESTAMPTZ,
  first_coa_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_coas,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW()))::BIGINT as coas_this_month,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('year', NOW()))::BIGINT as coas_this_year,
    COUNT(*) FILTER (WHERE status = 'active')::BIGINT as coas_active,
    COUNT(*) FILTER (WHERE status = 'archived')::BIGINT as coas_archived,
    ROUND(AVG(total_thc), 2) as avg_thc,
    ROUND(AVG(total_cbd), 2) as avg_cbd,
    MAX(total_thc) as max_thc,
    MIN(total_thc) as min_thc,
    MODE() WITHIN GROUP (ORDER BY strain) as most_common_strain,
    MODE() WITHIN GROUP (ORDER BY product_type) as most_common_product_type,
    MAX(created_at) as last_coa_date,
    MIN(created_at) as first_coa_date
  FROM coa_metadata
  WHERE (client_uuid IS NULL OR client_id = client_uuid)
    AND status IN ('active', 'archived');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. SEARCH COAS (Full-Text Search)
-- Advanced search across COAs with relevance ranking
CREATE OR REPLACE FUNCTION search_coas(
  search_query TEXT,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0,
  client_filter UUID DEFAULT NULL,
  status_filter TEXT DEFAULT 'active'
)
RETURNS TABLE (
  coa_id UUID,
  sample_id TEXT,
  strain TEXT,
  client_name TEXT,
  client_id UUID,
  product_type TEXT,
  total_thc NUMERIC,
  total_cbd NUMERIC,
  date_tested TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as coa_id,
    c.sample_id,
    c.strain,
    cl.name as client_name,
    c.client_id,
    c.product_type,
    c.total_thc,
    c.total_cbd,
    c.date_tested,
    c.created_at,
    ts_rank(
      to_tsvector('english', 
        COALESCE(c.strain, '') || ' ' || 
        COALESCE(c.sample_id, '') || ' ' || 
        COALESCE(c.batch_number, '') || ' ' ||
        COALESCE(cl.name, '')
      ),
      plainto_tsquery('english', search_query)
    ) as rank
  FROM coa_metadata c
  LEFT JOIN clients cl ON c.client_id = cl.id
  WHERE 
    to_tsvector('english', 
      COALESCE(c.strain, '') || ' ' || 
      COALESCE(c.sample_id, '') || ' ' || 
      COALESCE(c.batch_number, '') || ' ' ||
      COALESCE(cl.name, '')
    ) @@ plainto_tsquery('english', search_query)
    AND (client_filter IS NULL OR c.client_id = client_filter)
    AND (status_filter IS NULL OR c.status = status_filter)
  ORDER BY rank DESC, c.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. BATCH CREATE COAS
-- Handle bulk COA uploads with transaction safety and error handling
CREATE OR REPLACE FUNCTION batch_create_coas(
  coas_data JSONB
)
RETURNS TABLE (
  success BOOLEAN,
  created_count INTEGER,
  failed_count INTEGER,
  created_ids UUID[],
  errors JSONB
) AS $$
DECLARE
  coa_item JSONB;
  created INTEGER := 0;
  failed INTEGER := 0;
  error_list JSONB := '[]'::JSONB;
  created_id_list UUID[] := ARRAY[]::UUID[];
  new_coa_id UUID;
BEGIN
  FOR coa_item IN SELECT * FROM jsonb_array_elements(coas_data)
  LOOP
    BEGIN
      INSERT INTO coa_metadata (
        sample_id,
        client_id,
        strain,
        product_type,
        date_received,
        date_tested,
        pdf_url,
        qr_code_url,
        batch_number,
        total_thc,
        total_cbd,
        total_cannabinoids,
        cannabinoid_breakdown,
        lab_director,
        generated_by,
        uploaded_by,
        status
      ) VALUES (
        coa_item->>'sample_id',
        (coa_item->>'client_id')::UUID,
        coa_item->>'strain',
        coa_item->>'product_type',
        (coa_item->>'date_received')::TIMESTAMPTZ,
        (coa_item->>'date_tested')::TIMESTAMPTZ,
        coa_item->>'pdf_url',
        coa_item->>'qr_code_url',
        coa_item->>'batch_number',
        (coa_item->>'total_thc')::NUMERIC,
        (coa_item->>'total_cbd')::NUMERIC,
        (coa_item->>'total_cannabinoids')::NUMERIC,
        coa_item->'cannabinoid_breakdown',
        coa_item->>'lab_director',
        (coa_item->>'generated_by')::UUID,
        (coa_item->>'uploaded_by')::UUID,
        COALESCE(coa_item->>'status', 'active')
      )
      RETURNING id INTO new_coa_id;
      
      created := created + 1;
      created_id_list := array_append(created_id_list, new_coa_id);
    EXCEPTION WHEN OTHERS THEN
      failed := failed + 1;
      error_list := error_list || jsonb_build_object(
        'sample_id', coa_item->>'sample_id',
        'error', SQLERRM,
        'error_detail', SQLSTATE
      );
    END;
  END LOOP;

  RETURN QUERY SELECT true, created, failed, created_id_list, error_list;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. GET CLIENT DASHBOARD DATA
-- Comprehensive dashboard data for a specific client
CREATE OR REPLACE FUNCTION get_client_dashboard(client_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  stats RECORD;
  recent_coas JSONB;
  monthly_trend JSONB;
BEGIN
  -- Get basic stats
  SELECT * INTO stats FROM get_coa_stats(client_uuid);
  
  -- Get recent COAs (last 10)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'sample_id', sample_id,
      'strain', strain,
      'total_thc', total_thc,
      'total_cbd', total_cbd,
      'created_at', created_at
    )
  ) INTO recent_coas
  FROM (
    SELECT id, sample_id, strain, total_thc, total_cbd, created_at
    FROM coa_metadata
    WHERE client_id = client_uuid AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 10
  ) recent;
  
  -- Get monthly trend (last 12 months)
  SELECT jsonb_agg(
    jsonb_build_object(
      'month', month,
      'count', count,
      'avg_thc', avg_thc,
      'avg_cbd', avg_cbd
    )
  ) INTO monthly_trend
  FROM (
    SELECT 
      to_char(date_trunc('month', created_at), 'YYYY-MM') as month,
      COUNT(*)::INTEGER as count,
      ROUND(AVG(total_thc), 2) as avg_thc,
      ROUND(AVG(total_cbd), 2) as avg_cbd
    FROM coa_metadata
    WHERE client_id = client_uuid 
      AND status = 'active'
      AND created_at >= NOW() - INTERVAL '12 months'
    GROUP BY date_trunc('month', created_at)
    ORDER BY date_trunc('month', created_at) DESC
  ) trend;
  
  -- Build result
  result := jsonb_build_object(
    'stats', to_jsonb(stats),
    'recent_coas', COALESCE(recent_coas, '[]'::jsonb),
    'monthly_trend', COALESCE(monthly_trend, '[]'::jsonb)
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. GET POPULAR STRAINS
-- Returns most frequently tested strains with stats
CREATE OR REPLACE FUNCTION get_popular_strains(
  client_uuid UUID DEFAULT NULL,
  limit_count INTEGER DEFAULT 20
)
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
    c.strain,
    COUNT(*)::BIGINT as count,
    ROUND(AVG(c.total_thc), 2) as avg_thc,
    ROUND(AVG(c.total_cbd), 2) as avg_cbd,
    MAX(c.created_at) as latest_test
  FROM coa_metadata c
  WHERE (client_uuid IS NULL OR c.client_id = client_uuid)
    AND c.status = 'active'
    AND c.strain IS NOT NULL
  GROUP BY c.strain
  ORDER BY COUNT(*) DESC, MAX(c.created_at) DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. GET COA ANALYTICS SUMMARY
-- Analytics for specific COA or all COAs
CREATE OR REPLACE FUNCTION get_coa_analytics_summary(
  coa_uuid UUID DEFAULT NULL,
  start_date TIMESTAMPTZ DEFAULT NULL,
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  total_views BIGINT,
  total_downloads BIGINT,
  total_shares BIGINT,
  total_prints BIGINT,
  unique_sessions BIGINT,
  most_common_device TEXT,
  most_common_browser TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE event_type = 'view')::BIGINT as total_views,
    COUNT(*) FILTER (WHERE event_type = 'download')::BIGINT as total_downloads,
    COUNT(*) FILTER (WHERE event_type = 'share')::BIGINT as total_shares,
    COUNT(*) FILTER (WHERE event_type = 'print')::BIGINT as total_prints,
    COUNT(DISTINCT session_id)::BIGINT as unique_sessions,
    MODE() WITHIN GROUP (ORDER BY viewer_device) as most_common_device,
    MODE() WITHIN GROUP (ORDER BY viewer_browser) as most_common_browser
  FROM coa_analytics
  WHERE (coa_uuid IS NULL OR coa_id = coa_uuid)
    AND (start_date IS NULL OR created_at >= start_date)
    AND created_at <= end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. ARCHIVE OLD COAS
-- Bulk archive COAs older than specified days
CREATE OR REPLACE FUNCTION archive_old_coas(
  days_old INTEGER DEFAULT 730, -- 2 years default
  dry_run BOOLEAN DEFAULT true
)
RETURNS TABLE (
  total_archived INTEGER,
  coa_ids UUID[]
) AS $$
DECLARE
  archived_count INTEGER;
  archived_ids UUID[];
BEGIN
  IF dry_run THEN
    -- Just count what would be archived
    SELECT 
      COUNT(*)::INTEGER,
      array_agg(id)
    INTO archived_count, archived_ids
    FROM coa_metadata
    WHERE created_at < NOW() - (days_old || ' days')::INTERVAL
      AND status = 'active';
  ELSE
    -- Actually archive them
    WITH archived AS (
      UPDATE coa_metadata
      SET status = 'archived', archived_at = NOW()
      WHERE created_at < NOW() - (days_old || ' days')::INTERVAL
        AND status = 'active'
      RETURNING id
    )
    SELECT COUNT(*)::INTEGER, array_agg(id)
    INTO archived_count, archived_ids
    FROM archived;
  END IF;
  
  RETURN QUERY SELECT archived_count, archived_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. CLEANUP OLD NOTIFICATIONS
-- Remove old read notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications(
  days_old INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE created_at < NOW() - (days_old || ' days')::INTERVAL
    AND is_read = true;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. TRACK COA VIEW
-- Convenience function to track COA views
CREATE OR REPLACE FUNCTION track_coa_view(
  coa_uuid UUID,
  viewer_ip_address INET DEFAULT NULL,
  viewer_device_type TEXT DEFAULT NULL,
  viewer_browser_type TEXT DEFAULT NULL,
  session_uuid TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Insert analytics record
  INSERT INTO coa_analytics (
    coa_id,
    event_type,
    viewer_ip,
    viewer_device,
    viewer_browser,
    session_id
  ) VALUES (
    coa_uuid,
    'view',
    viewer_ip_address,
    viewer_device_type,
    viewer_browser_type,
    session_uuid
  );
  
  -- Update view count
  UPDATE coa_metadata
  SET view_count = COALESCE(view_count, 0) + 1,
      last_viewed_at = NOW()
  WHERE id = coa_uuid;
  
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. GET SYSTEM HEALTH
-- Returns system health metrics
CREATE OR REPLACE FUNCTION get_system_health()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  result := jsonb_build_object(
    'total_clients', (SELECT COUNT(*) FROM clients),
    'total_coas', (SELECT COUNT(*) FROM coa_metadata WHERE status = 'active'),
    'coas_today', (SELECT COUNT(*) FROM coa_metadata WHERE created_at >= CURRENT_DATE),
    'coas_this_week', (SELECT COUNT(*) FROM coa_metadata WHERE created_at >= date_trunc('week', NOW())),
    'coas_this_month', (SELECT COUNT(*) FROM coa_metadata WHERE created_at >= date_trunc('month', NOW())),
    'total_views_today', (SELECT COUNT(*) FROM coa_analytics WHERE event_type = 'view' AND created_at >= CURRENT_DATE),
    'active_notifications', (SELECT COUNT(*) FROM notifications WHERE is_read = false),
    'database_size', (
      SELECT pg_size_pretty(pg_database_size(current_database()))
    ),
    'largest_tables', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'table', tablename,
          'size', pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
        )
      )
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 5
    ),
    'last_updated', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION get_coa_stats TO authenticated;
GRANT EXECUTE ON FUNCTION search_coas TO authenticated;
GRANT EXECUTE ON FUNCTION batch_create_coas TO authenticated;
GRANT EXECUTE ON FUNCTION get_client_dashboard TO authenticated;
GRANT EXECUTE ON FUNCTION get_popular_strains TO authenticated;
GRANT EXECUTE ON FUNCTION get_coa_analytics_summary TO authenticated;
GRANT EXECUTE ON FUNCTION archive_old_coas TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION track_coa_view TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_system_health TO authenticated;

-- ============================================
-- VERIFICATION
-- ============================================

-- List all functions
SELECT 
  routine_name as function_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND routine_name IN (
    'get_coa_stats',
    'search_coas',
    'batch_create_coas',
    'get_client_dashboard',
    'get_popular_strains',
    'get_coa_analytics_summary',
    'archive_old_coas',
    'cleanup_old_notifications',
    'track_coa_view',
    'get_system_health'
  )
ORDER BY routine_name;

