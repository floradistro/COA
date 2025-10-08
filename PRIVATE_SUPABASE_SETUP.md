# Private Supabase Setup Guide

This guide explains how to configure your COA Generator to work with a private Supabase bucket and the quantixanalytics.com viewer.

## Overview

The system now uses:
- **Private Supabase storage** for secure PDF storage
- **www.quantixanalytics.com/coa/[filename]** URLs for public access
- **Authentication** between the generator and Supabase

## 1. Environment Variables

Create a `.env.local` file in your project root:

```env
# Your Supabase project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Your Supabase anonymous key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Service role key for enhanced access
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## 2. Supabase Bucket Configuration

### Create Private Bucket

1. Go to your Supabase dashboard
2. Navigate to **Storage** → **New bucket**
3. Create a bucket with these settings:
   - Name: `coas`
   - Public: **OFF** (Private)
   - File size limit: 50MB
   - Allowed MIME types: `application/pdf`

### Configure RLS Policies

For a private bucket, you need to set up Row Level Security (RLS) policies:

#### Upload Policy (Authenticated Users)
```sql
-- Allow authenticated users to upload PDFs
CREATE POLICY "Authenticated users can upload PDFs" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'coas' AND
  (storage.extension(name) = 'pdf')
);
```

#### Read Policy (Service Role or Authenticated)
```sql
-- Allow authenticated users to read their files
CREATE POLICY "Authenticated users can read PDFs" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'coas');
```

#### List Policy (Authenticated Users)
```sql
-- Allow authenticated users to list files
CREATE POLICY "Authenticated users can list PDFs" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'coas');
```

## 3. File Structure

Files are uploaded to: `coas/pdfs/[timestamp]_COA_[sampleName]_[sampleId].pdf`

## 4. URL Pattern

- **Storage Path**: `pdfs/1234567890_COA_BlueDream_BDS001.pdf`
- **Public URL**: `https://www.quantixanalytics.com/coa/1234567890_COA_BlueDream_BDS001`

Note: The `.pdf` extension is removed from the public URL.

## 5. Backend Integration (www.quantixanalytics.com)

The www.quantixanalytics.com site needs to implement an endpoint that:

1. Receives requests to `/coa/[filename]`
2. Authenticates with Supabase using service role key
3. Fetches the PDF from private storage
4. Serves it to the user

### Example Backend Implementation (Node.js/Express)

```javascript
const { createClient } = require('@supabase/supabase-js');

// Initialize with service role key for private bucket access
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.get('/coa/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = `pdfs/${filename}.pdf`;
    
    // Download from private bucket
    const { data, error } = await supabase.storage
      .from('coas')
      .download(filePath);
    
    if (error) {
      return res.status(404).send('COA not found');
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}.pdf"`);
    
    // Convert blob to buffer and send
    const buffer = Buffer.from(await data.arrayBuffer());
    res.send(buffer);
    
  } catch (error) {
    console.error('Error serving COA:', error);
    res.status(500).send('Internal server error');
  }
});
```

## 6. Testing

1. **Upload Test**: Generate and upload a COA
2. **Check Storage**: Verify file exists in Supabase storage
3. **Test URL**: Ensure `https://www.quantixanalytics.com/coa/[filename]` serves the PDF
4. **QR Code**: Scan the QR code to verify it points to the correct URL

## 7. Security Considerations

1. **Never expose** the service role key in client-side code
2. **Implement rate limiting** on the www.quantixanalytics.com endpoint
3. **Consider adding** access logs for compliance
4. **Regular audits** of bucket permissions and policies

## 8. Troubleshooting

### "Access Denied" Errors
- Check your Supabase credentials are correct
- Verify RLS policies are properly configured
- Ensure the bucket is set to private

### Files Not Appearing
- Check you're listing the correct path (`pdfs/`)
- Verify your authentication is working
- Check browser console for specific error messages

### QR Codes Not Working
- Ensure www.quantixanalytics.com backend is running
- Verify the URL pattern matches exactly
- Check CORS settings if needed 