# Supabase Setup Instructions

> **Note**: For private bucket configuration with quantixanalytics.com integration, see [PRIVATE_SUPABASE_SETUP.md](./PRIVATE_SUPABASE_SETUP.md)

This document provides step-by-step instructions for setting up Supabase storage for the COA Generator application.

## Prerequisites
- A Supabase account and project
- Your Supabase project URL and anon key

## Setup Instructions

### Option 1: Using Supabase Dashboard (Recommended)

1. **Login to Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Create Storage Bucket**
   - Navigate to **Storage** in the left sidebar
   - Click **New bucket**
   - Configure as follows:
     - Name: `coas` (must be lowercase)
     - Public bucket: **Yes** (toggle ON)
     - File size limit: `50` MB
     - Allowed MIME types: `application/pdf`
   - Click **Create bucket**

3. **Set Up Storage Policies**
   - Click on the `coas` bucket
   - Go to **Policies** tab
   - Click **New Policy** and create the following policies:

   **Policy 1: Public Read Access**
   - Policy name: `Allow public downloads`
   - Allowed operation: `SELECT`
   - Target roles: `public`
   - Click **Create policy**

   **Policy 2: Anonymous Upload**
   - Policy name: `Allow anonymous uploads`
   - Allowed operation: `INSERT`
   - Target roles: `anon`
   - Click **Create policy**

### Option 2: Using SQL Editor

1. **Login to Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Navigate to **SQL Editor** in the left sidebar
   - Click **New query**

3. **Run Setup Script**
   - Copy the entire contents of `supabase-setup.sql`
   - Paste into the SQL editor
   - Click **Run**

### Verify Setup

1. Visit http://localhost:3001/test-supabase
2. Click **Test Supabase Connection**
3. You should see:
   - ✅ Connected to Supabase!
   - ✅ Bucket "coas" exists!
   - ✅ Test upload successful!

## Troubleshooting

### Error: "new row violates row-level security policy"
This means you need admin access to create buckets. Use the dashboard method or ask your Supabase admin to run the SQL script.

### Error: "Bucket not found"
The bucket hasn't been created yet. Follow the setup instructions above.

### Error: "Permission denied"
Check that the storage policies are correctly configured for public access.

## Environment Variables (Optional)

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

The app will work without these as they're already configured in the code.

## Testing Upload Functionality

1. Generate a COA in the main app
2. Click **Upload to Cloud**
3. Check the console for the public URL
4. The PDF should be accessible at the URL with a QR code embedded 