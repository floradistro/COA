# Quick Fix: Vendor COA Upload Issues

## ✅ Fixed
1. **UI Issue:** Multiple COAs showing "Uploading..." when only one is clicked
   - Changed from single `uploading` state to `uploadingCoaId` 
   - Now only the clicked COA button shows "Uploading..."
   - Other buttons remain enabled

## ❌ Still Need to Fix
**RLS Policy Error:** `Failed to save COA metadata: new row violates row-level security policy for table "vendor_coas"`

### The vendor_coas table doesn't exist in vendor Supabase yet.

## 🚀 Action Required

### Run SQL Setup in Vendor Supabase:

1. **Go to:** https://supabase.com/dashboard/project/uaednwpxursknmwdeejn

2. **Open SQL Editor:**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Copy & Execute:**
   - Open `vendor-storage-setup.sql` 
   - Copy ALL contents
   - Paste into SQL Editor
   - Click "Run"

4. **Verify Results:**
   You should see checkmarks:
   - ✅ vendor_coas table Created
   - ✅ vendor-coas bucket Created  
   - ✅ Table RLS policies Configured
   - ✅ Storage RLS policies Configured

5. **Test Upload:**
   - Go to http://localhost:3000/vendor-coas
   - Select a vendor
   - Click "Upload" on any COA
   - Should now work without errors

## What the SQL Does

Creates:
- `vendor_coas` table with proper schema
- 6 RLS policies allowing anon key to insert
- `vendor-coas` storage bucket (public, 50MB, PDF only)
- 6 storage RLS policies allowing anon uploads

## Files Changed
- ✅ `src/app/vendor-coas/page.tsx` - Fixed upload button state
- 📄 `vendor-storage-setup.sql` - Run this in vendor Supabase
- 📖 `VENDOR_STORAGE_SETUP.md` - Full documentation

## Need Help?
See `VENDOR_STORAGE_SETUP.md` for detailed instructions and troubleshooting.

