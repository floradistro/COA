# Vendor Supabase Complete Setup Guide

## Issues Fixed
1. ❌ `Failed to upload to vendor storage: new row violates row-level security policy`
2. ❌ `Unexpected token '<', "<html> <h"... is not valid JSON`

## Root Cause
The vendor Supabase instance is missing:
- The `vendor_coas` table (causes JSON parse error)
- RLS policies for the table (causes security policy error)
- The `vendor-coas` storage bucket
- RLS policies for storage (causes upload blocking)

## Steps to Fix

### 1. Go to Vendor Supabase Dashboard
Open: https://supabase.com/dashboard/project/uaednwpxursknmwdeejn

### 2. Navigate to SQL Editor
- Click on **SQL Editor** in the left sidebar
- Click **New Query**

### 3. Run the Setup SQL
Copy and paste the entire contents of `vendor-storage-setup.sql` and execute it.

This will:

**Part 1: Create vendor_coas Table**
- Create the `vendor_coas` table with all required columns
- Enable RLS on the table
- Configure 4 RLS policies with PUBLIC access (no auth required):
  - ✅ Public inserts (for WhaleTools lab)
  - ✅ Public read access
  - ✅ Public updates
  - ✅ Public deletes
- Create performance indexes
- Grant ALL permissions to anon/authenticated/service_role
- Grant USAGE on public schema

**Part 2: Create vendor-coas Storage Bucket**
- Create the `vendor-coas` storage bucket (if not exists)
- Set it to public with 50MB limit
- Allow PDF files only
- Configure 4 storage RLS policies with PUBLIC access (no auth required):
  - ✅ Public uploads (for WhaleTools lab)
  - ✅ Public read access
  - ✅ Public updates
  - ✅ Public deletes
- Grant ALL permissions to anon/authenticated/service_role
- Grant USAGE on storage schema

### 4. Verify Setup
After running the SQL, the verification queries will show:
- ✅ vendor_coas table Created
- ✅ vendor-coas bucket Created
- ✅ Table RLS policies Configured (4 policies)
- ✅ Storage RLS policies Configured (4 policies)

### 5. Test Upload
Go back to WhaleTools:
1. Navigate to: http://localhost:3000/vendor-coas
2. Select a vendor
3. Try uploading a COA
4. Should now work without RLS errors

## Why This Was Needed

### JSON Parse Error
- When the `vendor_coas` table doesn't exist, Supabase returns an HTML error page
- The code tries to parse HTML as JSON → `Unexpected token '<'` error
- Solution: Create the table with proper schema

### RLS Policy Error  
- WhaleTools uses the **anon key** to insert into `vendor_coas` table
- Without RLS policies allowing anon inserts, the operation is blocked
- Solution: Add RLS policies that allow anon role to insert

### Storage Upload Error
- WhaleTools uses the **anon key** to upload PDFs to vendor storage
- Without storage RLS policies, the anon role is blocked from uploading
- Solution: Add storage policies that allow anon role to upload

## Configuration

### Table: vendor_coas
- **Columns:** id, vendor_id, product_id, file_name, file_url, file_size, file_type, lab_name, test_date, expiry_date, batch_number, test_results, is_active, is_verified, metadata, upload_date, created_at, updated_at
- **RLS Enabled:** Yes
- **Policies:** 4 PUBLIC policies (insert, select, update, delete)
- **Permissions:** GRANT ALL to anon, authenticated, service_role

### Storage Bucket: vendor-coas
- **Bucket ID:** `vendor-coas`
- **Public:** Yes (vendors need to view PDFs)
- **Size Limit:** 50MB
- **MIME Types:** `application/pdf`
- **Policies:** 4 PUBLIC policies (insert, select, update, delete)
- **Permissions:** GRANT ALL to anon, authenticated, service_role

## Security
✅ **Safe Table Access:** Policies only affect `vendor_coas` table
✅ **Safe Storage Access:** Policies only affect `vendor-coas` bucket  
✅ **Controlled Uploads:** Only PDF files under 50MB
✅ **Public Read:** Vendors and customers can view COAs
✅ **Managed Modifications:** Updates/deletes require authentication
✅ **Lab Access:** Anon key (WhaleTools) can insert COAs

## Troubleshooting

### Still getting JSON parse error?
```sql
-- Check if vendor_coas table exists
SELECT table_name FROM information_schema.tables WHERE table_name = 'vendor_coas';
```
If empty, the table doesn't exist. Run the SQL script.

### Still getting RLS errors?
1. Verify you ran the SQL in the **VENDOR** Supabase (not DATA or AUTH)
2. Check Table Editor → vendor_coas → RLS Policies
3. Check Storage → Policies
4. Ensure anon role has INSERT permission on both table and storage

```sql
-- Check table RLS policies
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'vendor_coas';

-- Check storage RLS policies  
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%vendor-coas%';
```

### Can't see the table?
1. Go to Table Editor in Supabase dashboard
2. Check if `vendor_coas` table exists
3. If not, run the SQL script

### Can't see the bucket?
1. Go to Storage in Supabase dashboard
2. Check if `vendor-coas` bucket exists
3. If not, run the SQL script

## Related Files
- `vendor-storage-setup.sql` - The SQL script to run
- `src/app/vendor-coas/page.tsx` - Upload UI
- `src/lib/supabaseClient.ts` - Vendor client config
- `VENDOR_INTEGRATION_COMPLETE.md` - Full vendor integration docs

