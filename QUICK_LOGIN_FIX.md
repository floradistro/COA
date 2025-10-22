# Quick Login Fix

## Problem
Logins not working because email confirmation is required by default.

## Solution - Disable Email Confirmation

### For WhaleTools (Port 3000):
1. Go to: https://supabase.com/dashboard/project/tkicdgegwqmiybpnrazs/auth/providers
2. Click "Email"
3. **UNCHECK** "Confirm email"
4. Click "Save"
5. Go to: http://localhost:3000/signup
6. Create your admin account
7. Login immediately at: http://localhost:3000/login

### For Quantix LAB (Port 3001):
1. Go to: https://supabase.com/dashboard/project/elhsobjvwmjfminxxcwy/auth/providers
2. Click "Email"  
3. **UNCHECK** "Confirm email"
4. Click "Save"
5. Go to: http://localhost:3001/client-portal/register
6. Create your client account
7. Login immediately at: http://localhost:3001/client-portal

## Alternative: Manually Create & Auto-Confirm Users

### WhaleTools:
1. Go to: https://supabase.com/dashboard/project/tkicdgegwqmiybpnrazs/auth/users
2. Click "Add User"
3. Enter email/password
4. **CHECK** "Auto Confirm User"
5. Save
6. Login at: http://localhost:3000/login

### Quantix LAB:
1. Go to: https://supabase.com/dashboard/project/elhsobjvwmjfminxxcwy/auth/users
2. Click "Add User"
3. Enter email/password
4. **CHECK** "Auto Confirm User"
5. Save
6. Login at: http://localhost:3001/client-portal

## Test URLs
- WhaleTools Admin: http://localhost:3000/login
- WhaleTools Signup: http://localhost:3000/signup
- Quantix Client Portal: http://localhost:3001/client-portal
- Quantix Register: http://localhost:3001/client-portal/register

