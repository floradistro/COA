# 🚀 Vercel Environment Variables Setup

## Add these environment variables to your Vercel project:

### Option 1: Via Vercel Dashboard (Recommended)

1. **Go to your Vercel project**
   - Visit: https://vercel.com/dashboard
   - Select your V1WHALETOOL project

2. **Navigate to Settings → Environment Variables**

3. **Add these 6 variables** (one at a time):

#### Variable 1: NEXT_PUBLIC_SUPABASE_AUTH_URL
```
Value: https://tkicdgegwqmiybpnrazs.supabase.co
Environments: ✅ Production ✅ Preview ✅ Development
```

#### Variable 2: NEXT_PUBLIC_SUPABASE_AUTH_ANON_KEY
```
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRraWNkZ2Vnd3FtaXlicG5yYXpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5Njg3MzYsImV4cCI6MjA3NTU0NDczNn0.6nWlflu_9EIsEvuBxBMKdu8tiFdSVArE4DnXb8bLMKQ
Environments: ✅ Production ✅ Preview ✅ Development
```

#### Variable 3: NEXT_PUBLIC_SUPABASE_DATA_URL
```
Value: https://elhsobjvwmjfminxxcwy.supabase.co
Environments: ✅ Production ✅ Preview ✅ Development
```

#### Variable 4: NEXT_PUBLIC_SUPABASE_DATA_ANON_KEY
```
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsaHNvYmp2d21qZm1pbnh4Y3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDQzMzAsImV4cCI6MjA2NjI4MDMzMH0.sK5ggW0XxE_Y9x5dXQvq2IPbxo0WoQs3OcfXNhEbTyQ
Environments: ✅ Production ✅ Preview ✅ Development
```

#### Variable 5: NEXT_PUBLIC_SUPABASE_VENDOR_URL
```
Value: https://uaednwpxursknmwdeejn.supabase.co
Environments: ✅ Production ✅ Preview ✅ Development
```

#### Variable 6: NEXT_PUBLIC_SUPABASE_VENDOR_ANON_KEY
```
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTcyMzMsImV4cCI6MjA3NjU3MzIzM30.N8jPwlyCBB5KJB5I-XaK6m-mq88rSR445AWFJJmwRCg
Environments: ✅ Production ✅ Preview ✅ Development
```

4. **Redeploy** your project after adding all variables

---

### Option 2: Via Vercel CLI (Automated)

Run these commands in your terminal:

```bash
cd /Users/f/Desktop/V1WHALETOOL

# Link project first (if not already linked)
vercel link

# Add Auth URL
echo "https://tkicdgegwqmiybpnrazs.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_AUTH_URL production preview development

# Add Auth Key
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRraWNkZ2Vnd3FtaXlicG5yYXpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5Njg3MzYsImV4cCI6MjA3NTU0NDczNn0.6nWlflu_9EIsEvuBxBMKdu8tiFdSVArE4DnXb8bLMKQ" | vercel env add NEXT_PUBLIC_SUPABASE_AUTH_ANON_KEY production preview development

# Add Data URL
echo "https://elhsobjvwmjfminxxcwy.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_DATA_URL production preview development

# Add Data Key
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsaHNvYmp2d21qZm1pbnh4Y3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDQzMzAsImV4cCI6MjA2NjI4MDMzMH0.sK5ggW0XxE_Y9x5dXQvq2IPbxo0WoQs3OcfXNhEbTyQ" | vercel env add NEXT_PUBLIC_SUPABASE_DATA_ANON_KEY production preview development

# Add Vendor URL
echo "https://uaednwpxursknmwdeejn.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_VENDOR_URL production preview development

# Add Vendor Key
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTcyMzMsImV4cCI6MjA3NjU3MzIzM30.N8jPwlyCBB5KJB5I-XaK6m-mq88rSR445AWFJJmwRCg" | vercel env add NEXT_PUBLIC_SUPABASE_VENDOR_ANON_KEY production preview development

# Verify all variables were added
vercel env ls

# Trigger new deployment
vercel --prod
```

---

## ✅ Verification

After adding variables and redeploying, your build should succeed.

### Check Build Logs:
1. Go to Vercel Dashboard → Deployments
2. Click on the latest deployment
3. Check build logs for any errors
4. Verify app loads correctly

### If Build Fails:
- Check that all 6 variables are present
- Make sure variable names are EXACTLY as shown (case-sensitive)
- Ensure all environments are checked (Production, Preview, Development)
- Redeploy from Vercel Dashboard

---

## 🔄 After Setup

Once variables are added:
1. ✅ Next deployment will use environment variables
2. ✅ No more hardcoded credentials in code
3. ✅ More secure and maintainable
4. ✅ Easy to rotate keys if needed

---

## 🚨 Important Notes

- These are PUBLIC anon keys (safe to expose in frontend)
- Environment variables are injected at build time
- Changes require a new deployment to take effect
- Keep this file for reference but DO NOT commit to public repos

