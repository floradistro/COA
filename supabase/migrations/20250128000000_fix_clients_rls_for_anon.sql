-- Fix RLS policies for clients table to allow anon access
-- This is needed because we use a dual-auth system where:
-- - supabaseAuth handles admin authentication
-- - supabaseData handles data operations with anon key
-- The app-level ProtectedRoute provides the actual access control

-- Drop the existing restrictive policies for clients table
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON clients;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON clients;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON clients;

-- Create new policies that allow anon access (protected by app-level auth)
CREATE POLICY "Enable insert for all users" ON clients
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON clients
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON clients
  FOR DELETE USING (true);

-- Also update coa_metadata policies for consistency
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON coa_metadata;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON coa_metadata;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON coa_metadata;

CREATE POLICY "Enable insert for all users" ON coa_metadata
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON coa_metadata
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON coa_metadata
  FOR DELETE USING (true);
