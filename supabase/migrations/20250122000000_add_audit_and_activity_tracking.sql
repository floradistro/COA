-- ============================================
-- PHASE 1: DATABASE ENHANCEMENT
-- Add comprehensive audit logging and activity tracking
-- ============================================

-- 1. AUDIT LOGS TABLE
-- Track all changes to critical data (who, what, when)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  user_email TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- 2. ACTIVITY LOGS TABLE
-- Track user actions and system events
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT,
  action TEXT NOT NULL, 
  entity_type TEXT, 
  entity_id UUID,
  metadata JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);

-- Enable RLS on activity_logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Users can read their own activity
CREATE POLICY "Users can read own activity" ON activity_logs
  FOR SELECT USING (user_id = auth.uid());

-- Admins can read all activity
CREATE POLICY "Admins can read all activity" ON activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- System can insert activity logs
CREATE POLICY "System can insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (true);

-- 3. NOTIFICATIONS TABLE
-- Store in-app notifications for users
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('coa_ready', 'coa_uploaded', 'client_added', 'error', 'info', 'warning', 'success')),
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- System can insert notifications
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (user_id = auth.uid());

-- 4. COA ANALYTICS TABLE
-- Track COA views, downloads, and interactions
CREATE TABLE IF NOT EXISTS coa_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coa_id UUID REFERENCES coa_metadata(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'download', 'share', 'print', 'export')),
  viewer_ip INET,
  viewer_location JSONB,
  viewer_device TEXT,
  viewer_browser TEXT,
  referrer TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coa_analytics_coa ON coa_analytics(coa_id);
CREATE INDEX IF NOT EXISTS idx_coa_analytics_event ON coa_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_coa_analytics_created ON coa_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coa_analytics_session ON coa_analytics(session_id);

-- Enable RLS on coa_analytics
ALTER TABLE coa_analytics ENABLE ROW LEVEL SECURITY;

-- Anyone can insert analytics (anonymous tracking)
CREATE POLICY "Anyone can insert analytics" ON coa_analytics
  FOR INSERT WITH CHECK (true);

-- Authenticated users can read analytics
CREATE POLICY "Authenticated users can read analytics" ON coa_analytics
  FOR SELECT USING (auth.role() = 'authenticated');

-- 5. ENHANCE COA_METADATA TABLE
-- Add tracking fields
ALTER TABLE coa_metadata
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted', 'draft')),
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS parent_coa_id UUID REFERENCES coa_metadata(id),
ADD COLUMN IF NOT EXISTS generated_by UUID,
ADD COLUMN IF NOT EXISTS uploaded_by UUID,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_coa_metadata_status ON coa_metadata(status);
CREATE INDEX IF NOT EXISTS idx_coa_metadata_tags ON coa_metadata USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_coa_metadata_generated_by ON coa_metadata(generated_by);
CREATE INDEX IF NOT EXISTS idx_coa_metadata_uploaded_by ON coa_metadata(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_coa_metadata_parent ON coa_metadata(parent_coa_id);
CREATE INDEX IF NOT EXISTS idx_coa_metadata_public ON coa_metadata(is_public) WHERE is_public = true;

-- Add full-text search index
CREATE INDEX IF NOT EXISTS idx_coa_fts ON coa_metadata USING GIN (
  to_tsvector('english', 
    COALESCE(strain, '') || ' ' || 
    COALESCE(sample_id, '') || ' ' ||
    COALESCE(batch_number, '')
  )
);

-- 6. AUTO-UPDATE TIMESTAMPS TRIGGER
-- Automatically update updated_at column on changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to clients table
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at 
  BEFORE UPDATE ON clients
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to coa_metadata table
DROP TRIGGER IF EXISTS update_coa_metadata_updated_at ON coa_metadata;
CREATE TRIGGER update_coa_metadata_updated_at 
  BEFORE UPDATE ON coa_metadata
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 7. AUDIT LOGGING TRIGGERS
-- Automatically log all changes to critical tables
CREATE OR REPLACE FUNCTION audit_log_changes()
RETURNS TRIGGER AS $$
DECLARE
  user_email_val TEXT;
BEGIN
  -- Try to get user email from JWT claims, fallback to anonymous
  BEGIN
    user_email_val := current_setting('request.jwt.claims', true)::json->>'email';
  EXCEPTION WHEN OTHERS THEN
    user_email_val := 'system';
  END;

  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_data, user_email)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), user_email_val);
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, user_email)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), user_email_val);
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_logs (table_name, record_id, action, new_data, user_email)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), user_email_val);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to critical tables
DROP TRIGGER IF EXISTS audit_clients ON clients;
CREATE TRIGGER audit_clients 
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW 
  EXECUTE FUNCTION audit_log_changes();

DROP TRIGGER IF EXISTS audit_coa_metadata ON coa_metadata;
CREATE TRIGGER audit_coa_metadata 
  AFTER INSERT OR UPDATE OR DELETE ON coa_metadata
  FOR EACH ROW 
  EXECUTE FUNCTION audit_log_changes();

-- 8. NOTIFICATION TRIGGER
-- Auto-create notifications on important events
CREATE OR REPLACE FUNCTION notify_on_coa_upload()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if uploaded_by is set
  IF NEW.uploaded_by IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      NEW.uploaded_by,
      'coa_uploaded',
      'COA Upload Complete',
      'Your COA for ' || COALESCE(NEW.strain, 'unknown strain') || ' (Sample: ' || NEW.sample_id || ') has been processed successfully',
      jsonb_build_object(
        'coa_id', NEW.id, 
        'sample_id', NEW.sample_id,
        'strain', NEW.strain,
        'client_id', NEW.client_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notify_coa_upload ON coa_metadata;
CREATE TRIGGER notify_coa_upload 
  AFTER INSERT ON coa_metadata
  FOR EACH ROW 
  EXECUTE FUNCTION notify_on_coa_upload();

-- 9. GRANT PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON audit_logs TO authenticated;
GRANT SELECT, INSERT ON activity_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT SELECT, INSERT ON coa_analytics TO anon, authenticated;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check all new tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM (
  VALUES 
    ('audit_logs'),
    ('activity_logs'),
    ('notifications'),
    ('coa_analytics')
) AS t(table_name)
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND information_schema.tables.table_name = t.table_name
);

-- Check new columns in coa_metadata
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'coa_metadata'
  AND column_name IN ('status', 'version', 'tags', 'is_public', 'view_count', 'generated_by', 'uploaded_by')
ORDER BY ordinal_position;

-- Check triggers exist
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'update_clients_updated_at',
    'update_coa_metadata_updated_at',
    'audit_clients',
    'audit_coa_metadata',
    'notify_coa_upload'
  )
ORDER BY event_object_table, trigger_name;

-- Final status check
SELECT 
  'Audit Logs Table' as feature,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') 
    THEN '✅ Created' ELSE '❌ Missing' END as status
UNION ALL
SELECT 
  'Activity Logs Table',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs') 
    THEN '✅ Created' ELSE '❌ Missing' END
UNION ALL
SELECT 
  'Notifications Table',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') 
    THEN '✅ Created' ELSE '❌ Missing' END
UNION ALL
SELECT 
  'COA Analytics Table',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'coa_analytics') 
    THEN '✅ Created' ELSE '❌ Missing' END
UNION ALL
SELECT 
  'Enhanced COA Metadata',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'coa_metadata' AND column_name = 'status'
  ) THEN '✅ Enhanced' ELSE '❌ Missing' END
UNION ALL
SELECT 
  'Audit Triggers',
  CASE WHEN (
    SELECT COUNT(*) FROM information_schema.triggers 
    WHERE trigger_name LIKE 'audit_%'
  ) >= 2 THEN '✅ Active' ELSE '⚠️ Incomplete' END
UNION ALL
SELECT 
  'Auto-Update Triggers',
  CASE WHEN (
    SELECT COUNT(*) FROM information_schema.triggers 
    WHERE trigger_name LIKE '%updated_at%'
  ) >= 2 THEN '✅ Active' ELSE '⚠️ Incomplete' END;

