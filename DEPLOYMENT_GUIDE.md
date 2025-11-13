# 🚀 Auto-Intelligence System Deployment Guide

## Issues Found and Fixed

### 1. ✅ Notification Bell Not Visible
**Status**: Already implemented correctly
- NotificationBell component is in DashboardNav.tsx
- It should appear in the top-right navigation bar next to your name

### 2. ✅ View Recommendations Button Covered
**Status**: FIXED
- Added `pb-32` (bottom padding) to right sidebar
- Floating action buttons no longer cover the button

### 3. ⚠️ Environment Variables Need Real Values
**Status**: NEEDS YOUR ACTION
- You have placeholders like `<generate-secure-random-string>`
- These need to be replaced with actual values

### 4. ⚠️ Database Migration Not Run
**Status**: NEEDS YOUR ACTION
- The `notifications` and `user_settings` tables need to be created

---

## Step-by-Step Deployment Instructions

### STEP 1: Run Database Migration

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the ENTIRE contents of this file:
   ```
   /supabase/migrations/20240101000006_auto_intelligence.sql
   ```
6. Paste into the SQL Editor
7. Click **Run** (or press Cmd/Ctrl + Enter)
8. Verify success - you should see:
   ```
   Success. No rows returned
   ```

**To verify tables were created:**
1. Go to **Table Editor** in Supabase
2. Look for these new tables:
   - `notifications`
   - `user_settings`

---

### STEP 2: Set Up Environment Variables

Go to your **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

#### A. CRON_SECRET (Required for CRON jobs)

**Generate a secure random string:**

**Option 1 - Using Node.js (if you have it installed locally):**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option 2 - Using OpenSSL:**
```bash
openssl rand -hex 32
```

**Option 3 - Using online generator:**
Go to https://generate-secret.vercel.app/32

**Set the variable:**
- Name: `CRON_SECRET`
- Value: (paste the generated string, e.g., `a3f8d9e2b4c6f1a8d3e7b9c2f5a8d1e4b7c9f2a5d8e1b4c7f9a2d5e8b1c4f7a9`)
- Environment: Production, Preview, Development (check all three)

#### B. RESEND_API_KEY (Required for email notifications)

1. Go to https://resend.com/
2. Sign up for a free account (100 emails/day free)
3. Once logged in, go to **API Keys**
4. Click **Create API Key**
5. Give it a name like "Vault Production"
6. Click **Create**
7. **COPY THE KEY IMMEDIATELY** (you won't see it again)

**The key looks like:** `re_ABC123def456GHI789jkl012MNO345pqr678`

**Set the variable:**
- Name: `RESEND_API_KEY`
- Value: (paste your Resend API key starting with `re_`)
- Environment: Production, Preview, Development

#### C. NEXT_PUBLIC_APP_URL (Required for email links)

This is your production URL where the app is deployed.

**Set the variable:**
- Name: `NEXT_PUBLIC_APP_URL`
- Value: Your production URL (e.g., `https://vault.yourdomain.com` or `https://your-project.vercel.app`)
  - **Do NOT include trailing slash**
  - **Must start with https://**
- Environment: Production, Preview

**For Preview environment, use:**
- Value: `https://$VERCEL_URL`
- This will automatically use the preview deployment URL

#### D. Verify All Existing Variables

Make sure you also have these (you should already have them):
- `ANTHROPIC_API_KEY` - Your Claude API key
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

---

### STEP 3: Verify Deployment

1. After setting environment variables, Vercel will automatically redeploy
2. Wait for deployment to complete (check Deployments tab)
3. Once deployed, go to your project in Vercel
4. Click **Settings** → **Cron Jobs**
5. You should see:
   ```
   /api/cron/auto-recommendations
   Schedule: 0 3,15,21 * * *
   ```

---

### STEP 4: Verify CRON is Working

#### Check CRON Job Logs

1. Go to Vercel Dashboard → Your Project
2. Click **Deployments** → Select latest deployment
3. Click **Functions** tab
4. Look for `/api/cron/auto-recommendations`
5. After the scheduled time (8am, 2pm, or 8pm MST), check logs

**You should see logs like:**
```
[Auto-Recommendations] Starting scheduled run at 2025-11-13T15:00:00Z
[Auto-Recommendations] Processing 5 users with auto-recommendations enabled
[Auto-Recommendations] Generating recommendations for user abc123...
[Auto-Recommendations] Completed: 3 processed, 2 skipped, 0 errors
```

#### Manual Test (Optional)

You can manually trigger the CRON job to test it:

```bash
# Replace with your actual CRON_SECRET and production URL
curl -X GET https://your-production-url.vercel.app/api/cron/auto-recommendations \
  -H "Authorization: Bearer YOUR_ACTUAL_CRON_SECRET_HERE"
```

**Expected response:**
```json
{
  "success": true,
  "processed": 1,
  "errors": 0,
  "skipped": 0
}
```

---

### STEP 5: Verify Notifications Work

1. **Upload some documents** to your Vault (if you haven't already)
2. **Create some insights** (manual or AI-generated)
3. **Wait for the next scheduled time** (8am, 2pm, or 8pm MST)
   - Or trigger manually using the curl command above
4. **Check the notification bell** in the top-right navigation bar
   - You should see a red badge with a number
5. **Click the bell** to see your notifications
6. **Check your email** for the notification email

---

## Troubleshooting

### Problem: CRON job shows "0 2 * * *" instead of "0 3,15,21 * * *"

**Cause**: Your local code doesn't match what's deployed

**Fix**:
1. Make sure you've pulled the latest code: `git pull`
2. Check `vercel.json` - it should have:
   ```json
   {
     "path": "/api/cron/auto-recommendations",
     "schedule": "0 3,15,21 * * *"
   }
   ```
3. Redeploy to Vercel

### Problem: No notification bell visible

**Check**:
1. Hard refresh your browser (Cmd/Ctrl + Shift + R)
2. Check browser console for any errors
3. Verify deployment completed successfully

### Problem: "Unauthorized" error in CRON logs

**Check**:
- `CRON_SECRET` environment variable is set correctly in Vercel
- The value doesn't have extra spaces or quotes
- All three environments (Production, Preview, Development) have the value

### Problem: Emails not sending

**Check**:
1. `RESEND_API_KEY` is set correctly (starts with `re_`)
2. Go to Resend dashboard → Emails to see delivery status
3. Check if you're within the free tier limit (100 emails/day)
4. For production use, verify your domain in Resend

### Problem: No recommendations being generated

**Check**:
1. Database migration was run successfully
2. You have recent activity (documents or insights uploaded in last 7 days)
3. Check the CRON logs for specific errors
4. Try manual generation first: Go to `/dashboard/recommendations` and click "Generate Recommendations"

### Problem: Environment variables not taking effect

**Fix**:
1. After changing environment variables, you must **redeploy**
2. Go to Deployments → Click "..." menu → Redeploy
3. Or push a new commit to trigger auto-deploy

---

## Understanding the CRON Schedule

```
0 3,15,21 * * *
│ │
│ └─ Hours: 3am, 3pm, 9pm UTC
│
└─ Minute: 0 (on the hour)
```

**UTC to MST Conversion:**
- 3am UTC = 8pm MST (previous day)
- 3pm UTC = 8am MST
- 9pm UTC = 2pm MST

**If you want different times:**
Edit `vercel.json` and change the schedule. Use https://crontab.guru/ to build your schedule.

---

## Verifying Everything Is Working

### ✅ Checklist

- [ ] Database migration run successfully (tables exist in Supabase)
- [ ] `CRON_SECRET` set with real value (not placeholder)
- [ ] `RESEND_API_KEY` set with real value (not placeholder)
- [ ] `NEXT_PUBLIC_APP_URL` set with production URL
- [ ] Vercel deployment completed
- [ ] CRON job shows correct schedule in Vercel settings
- [ ] Uploaded documents and created insights
- [ ] Notification bell appears in navigation bar
- [ ] Can click bell and see notifications panel
- [ ] Received email notification (after CRON runs)

---

## Getting Help

If you're still having issues:

1. **Check Vercel Function Logs**:
   - Vercel Dashboard → Deployments → Functions
   - Look for error messages

2. **Check Supabase Logs**:
   - Supabase Dashboard → Logs
   - Filter by "API" and "postgres" to see queries

3. **Check Browser Console**:
   - Press F12 → Console tab
   - Look for error messages

4. **Common Issues**:
   - Environment variables have spaces or quotes
   - Migration wasn't run
   - API keys are expired or invalid
   - Free tier limits exceeded

---

## Next Steps After Deployment

1. **Test the system**: Wait for the next scheduled time or trigger manually
2. **Monitor logs**: Check Vercel function logs for the first few runs
3. **Adjust frequency**: If needed, modify the CRON schedule in `vercel.json`
4. **Customize emails**: Edit `/src/app/api/notifications/email/route.ts` to change email design
5. **Add user preferences**: Let users customize when they receive notifications

---

## Security Notes

- Never commit environment variables to git
- Keep your `CRON_SECRET` private
- Use Vercel's environment variable encryption
- Rotate API keys periodically
- Use different keys for production vs development

---

## Summary: What You Need To Do Right Now

1. **Run the database migration in Supabase SQL Editor**
   - Copy file: `/supabase/migrations/20240101000006_auto_intelligence.sql`
   - Paste and run in Supabase

2. **Set real values for environment variables in Vercel:**
   - `CRON_SECRET` = Generate using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `RESEND_API_KEY` = Sign up at https://resend.com/ and create API key
   - `NEXT_PUBLIC_APP_URL` = Your production URL (e.g., https://your-app.vercel.app)

3. **Redeploy** if needed after setting environment variables

4. **Test** by waiting for scheduled time or triggering manually

That's it! The notification bell and auto-intelligence system will start working automatically.
