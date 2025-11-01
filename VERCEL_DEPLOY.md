# Exact Vercel Deployment Instructions

Follow these steps to deploy Vault to Vercel.

## Prerequisites

Before starting, make sure you have:
- ✅ Completed Supabase setup (see SUPABASE_SETUP.md)
- ✅ GitHub account
- ✅ OpenAI API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- ✅ Code pushed to GitHub repository

---

## Step 1: Get Your OpenAI API Key

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign in to your OpenAI account
3. Click **"Create new secret key"**
4. Give it a name like "Vault Production"
5. Click **"Create secret key"**
6. **COPY THE KEY** (you won't see it again!)
   - Should start with `sk-`
7. Save it somewhere safe

---

## Step 2: Push Code to GitHub

If you haven't already:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add -A

# Commit
git commit -m "Initial commit for Vault"

# Add GitHub remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push
git push -u origin main
```

---

## Step 3: Deploy to Vercel

### Option A: One-Click Deploy (Recommended)

1. Go to [https://vercel.com](https://vercel.com)
2. Click **"Sign Up"** or **"Login"**
3. Choose **"Continue with GitHub"**
4. Click **"Import Project"**
5. Find your GitHub repository and click **"Import"**
6. Vercel will auto-detect it's a Next.js app

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

---

## Step 4: Configure Environment Variables

**IMPORTANT**: Do this BEFORE clicking Deploy!

1. On the Vercel import screen, scroll to **"Environment Variables"**
2. Add these variables one by one:

### Required Variables:

#### 1. NEXT_PUBLIC_SUPABASE_URL
```
Value: https://xxxxxxxxxxxxx.supabase.co
```
*(Get from Supabase → Settings → API → Project URL)*

#### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
```
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
*(Get from Supabase → Settings → API → Project API keys → anon public)*

#### 3. SUPABASE_SERVICE_ROLE_KEY
```
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
*(Get from Supabase → Settings → API → Project API keys → service_role - click "Reveal")*

#### 4. OPENAI_API_KEY
```
Value: sk-proj-...
```
*(Your OpenAI API key from Step 1)*

#### 5. NEXT_PUBLIC_APP_URL
```
Value: Leave EMPTY for now (will add after deployment)
```

### Screenshot of Environment Variables:

It should look like this:

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://abcdefghijk.supabase.co
Environment: Production, Preview, Development ✓

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGc...
Environment: Production, Preview, Development ✓

Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGc...
Environment: Production, Preview, Development ✓

Name: OPENAI_API_KEY
Value: sk-proj-...
Environment: Production, Preview, Development ✓
```

---

## Step 5: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. You'll see "Congratulations!" when done
4. Click **"Visit"** to see your live app

---

## Step 6: Update NEXT_PUBLIC_APP_URL

1. Copy your Vercel deployment URL (e.g., `https://vault-xyz.vercel.app`)
2. Go to your Vercel project dashboard
3. Click **"Settings"**
4. Click **"Environment Variables"**
5. Click **"Add New"**
6. Add:
   ```
   Name: NEXT_PUBLIC_APP_URL
   Value: https://your-app-name.vercel.app
   Environment: ✓ Production ✓ Preview ✓ Development
   ```
7. Click **"Save"**
8. Go to **"Deployments"** tab
9. Click **"Redeploy"** on the latest deployment
10. Wait for redeployment to finish

---

## Step 7: Update Supabase Authentication URLs

1. Go to your Supabase project
2. Click **"Authentication"** → **"URL Configuration"**
3. Add these URLs:

**Site URL:**
```
https://your-app-name.vercel.app
```

**Redirect URLs:**
```
https://your-app-name.vercel.app/auth/callback
https://your-app-name.vercel.app/**
```

4. Click **"Save"**

---

## Step 8: Test Your Deployment

1. Visit your Vercel URL
2. Click **"Sign Up"**
3. Create an account with your email
4. Check your email for confirmation (if enabled)
5. Log in
6. Try uploading a document
7. Test search functionality

---

## Custom Domain (Optional)

### Add Custom Domain

1. In Vercel project, go to **"Settings"** → **"Domains"**
2. Click **"Add"**
3. Enter your domain (e.g., `vault.yourdomain.com`)
4. Follow Vercel's DNS instructions
5. Wait for DNS propagation (can take up to 48 hours)

### Update Environment Variables

After adding custom domain:

1. Update `NEXT_PUBLIC_APP_URL` to your custom domain
2. Update Supabase redirect URLs to include custom domain
3. Redeploy

---

## Vercel Project Settings

### Recommended Settings:

1. **Build & Development Settings**
   ```
   Framework Preset: Next.js
   Build Command: next build
   Output Directory: .next
   Install Command: npm install
   Development Command: next dev
   ```

2. **Root Directory**: Leave empty (or `.` if needed)

3. **Node.js Version**: 18.x (automatic)

4. **Environment Variables**: Already configured in Step 4

---

## Monitoring & Analytics

### Enable Vercel Analytics (Free)

1. In Vercel project, click **"Analytics"**
2. Click **"Enable"**
3. Add to your `layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Enable Speed Insights (Free)

1. Install package:
```bash
npm install @vercel/speed-insights
```

2. Add to `layout.tsx`:
```typescript
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

---

## Troubleshooting

### Build Fails

**Error: "Module not found"**
- Run `npm install` locally
- Make sure `package.json` is committed
- Check for typos in import statements

**Error: "Environment variable missing"**
- Double-check all env vars are set in Vercel
- Make sure they're enabled for Production
- Redeploy after adding variables

### Runtime Errors

**Error: "Supabase connection failed"**
- Verify Supabase URL and keys
- Check Supabase project is running
- Verify RLS policies are set up

**Error: "OpenAI API error"**
- Verify API key is correct
- Check OpenAI account has credits
- Verify key starts with `sk-`

**Error: "Storage upload failed"**
- Check Supabase storage bucket exists
- Verify storage policies are configured
- Check bucket name is exactly "documents"

### Performance Issues

**Slow cold starts:**
- This is normal for Vercel free tier
- Consider upgrading to Pro for faster performance

**API timeouts:**
- Check function timeout settings (default 10s, max 60s on Pro)
- Optimize document processing
- Consider background jobs for large files

---

## Important Notes

### Free Tier Limits

**Vercel Free:**
- 100 GB bandwidth/month
- 100 deployments/day
- 10s function execution (60s on Pro)

**Supabase Free:**
- 500 MB database
- 1 GB file storage
- 50,000 monthly active users
- 2 GB bandwidth

**OpenAI:**
- Pay-as-you-go pricing
- ~$0.002 per request for GPT-4

### Security Checklist

- ✅ Environment variables set as secrets
- ✅ Service role key never exposed to client
- ✅ RLS policies enabled on all tables
- ✅ HTTPS enabled (automatic on Vercel)
- ✅ CORS configured properly

---

## Quick Reference

### Environment Variables Summary

```bash
# Supabase (from Supabase dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# OpenAI (from platform.openai.com)
OPENAI_API_KEY=sk-proj-...

# App (from Vercel deployment)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Useful Commands

```bash
# Redeploy
vercel --prod

# View logs
vercel logs

# Pull environment variables
vercel env pull

# List deployments
vercel ls
```

---

## ✅ Deployment Complete!

Your Vault app should now be live at:
- **Production**: https://your-app-name.vercel.app
- **Dashboard**: https://vercel.com/your-username/your-app

**Next Steps:**
1. Share the URL with beta testers
2. Monitor analytics and errors
3. Set up custom domain (optional)
4. Enable monitoring tools

---

## Support

Issues? Check:
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- GitHub Issues: [your-repo/issues]

Need help? Email: support@yourdomain.com
