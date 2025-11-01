# Vault - Quick Start Guide

**Get your AI-powered memory platform running in 15 minutes!**

---

## 🎯 What You Need

- [x] GitHub account
- [x] OpenAI API key → [Get it here](https://platform.openai.com/api-keys)
- [x] Supabase account (free) → [Sign up](https://supabase.com)
- [x] Vercel account (free) → [Sign up](https://vercel.com)

---

## 📋 3-Step Deployment

### Step 1: Set Up Supabase (5 minutes)

1. **Create Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Save your database password!

2. **Run SQL Migrations**
   - Open **SQL Editor** in Supabase
   - Copy/paste SQL from `SUPABASE_SETUP.md` (3 migrations)
   - Click "Run" for each migration

3. **Create Storage Bucket**
   - Go to **Storage**
   - Create bucket named `documents`
   - Set to **private**

**📖 Detailed Guide:** See `SUPABASE_SETUP.md` for exact SQL commands

---

### Step 2: Deploy to Vercel (5 minutes)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repo

3. **Add Environment Variables**

   Before clicking Deploy, add these:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   OPENAI_API_KEY=sk-proj-...
   ```

4. **Deploy!**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Copy your deployment URL

**📖 Detailed Guide:** See `VERCEL_DEPLOY.md` for screenshots

---

### Step 3: Test Your App (5 minutes)

1. Visit your Vercel URL
2. Click "Sign Up"
3. Create an account
4. Upload a test document
5. Try semantic search!

---

## 🔑 Where to Get API Keys

### OpenAI API Key
1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Copy key (starts with `sk-proj-...`)
4. Add $5-10 credit to your account

**Cost:** ~$0.002 per document processing

### Supabase Keys
1. In Supabase project → Settings → API
2. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (click Reveal)

---

## 📚 File Structure

```
Vault/
├── SUPABASE_SETUP.md     ← Exact SQL commands for database
├── VERCEL_DEPLOY.md      ← Step-by-step Vercel deployment
├── README.md             ← Project overview and features
├── API.md                ← API documentation
├── .env.example          ← Environment variable template
└── src/                  ← Application code
```

---

## ✅ Deployment Checklist

**Supabase:**
- [ ] Project created
- [ ] pgvector extension enabled
- [ ] 3 SQL migrations run
- [ ] Storage bucket "documents" created
- [ ] Storage policies configured
- [ ] API keys copied

**Vercel:**
- [ ] Code pushed to GitHub
- [ ] Project imported to Vercel
- [ ] Environment variables added
- [ ] Deployed successfully
- [ ] URL works

**Testing:**
- [ ] Can sign up
- [ ] Can log in
- [ ] Can upload document
- [ ] Document processes successfully
- [ ] Can search documents

---

## 🚨 Common Issues

### "Supabase connection failed"
- Check URL and keys in Vercel environment variables
- Make sure keys don't have extra spaces

### "OpenAI API error"
- Verify API key is correct
- Check you have credits in OpenAI account
- Make sure key starts with `sk-`

### "Storage upload failed"
- Verify bucket name is exactly "documents"
- Check storage policies are created
- Make sure bucket is private, not public

### "Database error"
- Make sure all 3 SQL migrations ran successfully
- Check pgvector extension is enabled
- Verify RLS policies are active

---

## 💰 Cost Breakdown (Monthly)

**Free Tier:**
- Supabase: FREE (500MB DB, 1GB storage)
- Vercel: FREE (100GB bandwidth)
- OpenAI: ~$10-20 (depending on usage)

**Total: ~$10-20/month** for personal use

---

## 📞 Need Help?

1. **Detailed Setup:** Read `SUPABASE_SETUP.md` and `VERCEL_DEPLOY.md`
2. **API Docs:** Check `API.md` for endpoint details
3. **Issues:** GitHub Issues or email support

---

## 🎉 You're Done!

Your Vault is now live at: `https://your-app.vercel.app`

**What's Next?**
- Add custom domain (optional)
- Invite team members
- Upload your documents
- Explore AI-powered search!

---

**Built with ❤️ using Next.js, Supabase, and OpenAI**

[GitHub](your-repo) • [Documentation](README.md) • [Support](mailto:support@yourdomain.com)
