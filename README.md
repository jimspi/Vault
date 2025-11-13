# Vault - AI-Powered Document Intelligence

**Autonomous AI system that analyzes your documents and generates personalized recommendations**

## Features

### 📄 Document Management
- Upload PDFs, DOCX, TXT, MD, and images (with OCR)
- Automatic content extraction and processing
- Secure document storage with row-level security

### 🧠 AI Insights
- AI-generated insights from your documents
- Manual insight creation and organization
- Visual distinction between AI and manual insights
- AI Profile Summary - comprehensive analysis of all your content

### 🎯 Auto-Intelligence System
- **Autonomous Recommendations**: AI analyzes your content 3x daily (8am, 2pm, 8pm MST)
- **Actionable Recommendations**: Specific steps, resources, and timeframes
- **Smart Notifications**: In-app notification bell + email alerts
- **Customizable Settings**: Control email, in-app notifications, and auto-generation

### 🔔 Notifications
- Real-time notification bell with unread count
- Email notifications for new recommendations
- User-configurable notification preferences

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Anthropic API key (Claude)
- Resend account (for emails)

### Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_key

# Resend (for emails)
RESEND_API_KEY=your_resend_key

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.com

# CRON Secret (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
CRON_SECRET=your_secure_random_string
```

### Installation

```bash
# Install dependencies
npm install

# Run database migrations (see SUPABASE_SETUP.md)

# Start development server
npm run dev
```

Visit `http://localhost:3000`

### Database Setup

1. Go to Supabase Dashboard → SQL Editor
2. Run migrations from `supabase/migrations/` in order:
   - `20240101000000_initial_schema.sql`
   - `20240101000001_rls_policies.sql`
   - `20240101000002_functions.sql`
   - `20240101000003_fix_insights_rls.sql`
   - `20240101000004_profile_cache.sql`
   - `20240101000005_recommendations.sql`
   - `20240101000006_auto_intelligence.sql`

See `SUPABASE_SETUP.md` for detailed instructions.

## Deployment

### Vercel Deployment

1. **Connect your GitHub repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel will build and deploy automatically

### CRON Configuration

The auto-intelligence system runs via Vercel CRON:
- Schedule: `0 3,15,21 * * *` (8am, 2pm, 8pm MST)
- Configured in `vercel.json`
- Requires `CRON_SECRET` environment variable

### First-Time Setup

After deployment:

1. **Sign up** for a new account
2. **Upload documents** to your workspace
3. **Generate insights** (manual or AI)
4. **Go to Settings** → Configure notification preferences
5. **Wait for auto-recommendations** or generate manually

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **AI**: Claude 3.5 Sonnet (Anthropic)
- **Email**: Resend
- **Deployment**: Vercel
- **Language**: TypeScript
- **Styling**: Tailwind CSS

## Key Files

### API Routes
- `/api/insights/generate` - Generate AI insights
- `/api/recommendations/generate` - Generate recommendations
- `/api/notifications` - Notification management
- `/api/user-settings` - User preferences
- `/api/cron/auto-recommendations` - Auto-intelligence CRON job

### Components
- `DashboardLayout` - Main dashboard
- `NotificationBell` - Notification indicator
- `NotificationsPanel` - Notification dropdown
- `NotificationSettings` - Settings toggles
- `RecommendationsPanel` - Recommendations display
- `ProfileSummary` - AI profile summary

### Database Tables
- `workspaces` - User workspaces
- `documents` - Uploaded files
- `insights` - AI and manual insights
- `recommendations` - Actionable recommendations
- `notifications` - In-app notifications
- `user_settings` - User preferences
- `profile_cache` - Cached AI profiles

## Scripts

```bash
# Development
npm run dev              # Start dev server
npm run type-check       # Check TypeScript

# Production
npm run build            # Build for production
npm run start            # Start production server
```

## Architecture

### Auto-Intelligence Flow

1. **CRON Trigger** (3x daily)
   - Vercel CRON calls `/api/cron/auto-recommendations`
   - Checks users with `auto_recommendations_enabled: true`

2. **Activity Check**
   - Looks for documents/insights from last 7 days
   - Skips users with no recent activity

3. **AI Analysis**
   - Fetches all documents, insights, and profile
   - Claude analyzes to identify important areas
   - Generates 3-5 personalized recommendations

4. **Recommendation Creation**
   - Saves to `recommendations` table
   - Creates in-app notification
   - Sends email notification

5. **User Notification**
   - Notification bell shows unread count
   - Email sent with preview link
   - User can view/manage recommendations

## Support

For issues or questions:
- Check `SUPABASE_SETUP.md` for database setup
- Verify environment variables are set correctly
- Check Vercel function logs for errors
- Ensure CRON secret is configured

## License

MIT
