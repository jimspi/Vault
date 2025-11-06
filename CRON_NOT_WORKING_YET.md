# Daily Insights Cron Job - Setup Instructions

## Current Status
⚠️ **The cron job will NOT run until the application is deployed to Vercel.**

The cron job is configured to run at **7pm MST (2am UTC)** daily, but it only works on Vercel's platform, not in local development.

## How It Works

### Schedule
- **Time**: 7pm MST / 2am UTC
- **Frequency**: Once per day
- **Trigger**: Automatic (Vercel Cron)

### What It Does
1. Finds all workspaces with activity that day (documents uploaded or insights created)
2. For each active workspace:
   - Analyzes ALL documents and manual insights
   - Generates comprehensive AI insights
   - Marks insights with `auto_daily: true` metadata
3. Uses same analysis engine as manual "Generate Insights" button

## Setup Requirements

### 1. Deploy to Vercel
The application must be deployed to Vercel for cron jobs to work. Local development does not support cron.

```bash
# Deploy to Vercel
vercel --prod
```

### 2. Set Environment Variable
In your Vercel project settings, add:

**Environment Variable:**
- Name: `CRON_SECRET`
- Value: Generate a random secret (e.g., use `openssl rand -base64 32`)
- Scope: Production, Preview, Development

### 3. Verify Configuration
The cron is configured in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-insights",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### 4. Check Cron Status
After deployment, verify in Vercel dashboard:
1. Go to your project
2. Click "Cron Jobs" tab
3. Verify `/api/cron/daily-insights` is listed
4. Check execution logs

## Testing Locally (Without Cron)

You can manually trigger the cron endpoint for testing:

```bash
# Set CRON_SECRET in your .env.local
CRON_SECRET=your-secret-here

# Call the endpoint
curl -X GET http://localhost:3000/api/cron/daily-insights \
  -H "Authorization: Bearer your-secret-here"
```

## Troubleshooting

### Cron Not Running
1. ✅ Is app deployed to Vercel?
2. ✅ Is `CRON_SECRET` set in Vercel environment variables?
3. ✅ Is `vercel.json` in the root directory?
4. ✅ Check Vercel cron logs for errors

### No Insights Generated
1. ✅ Were documents uploaded today?
2. ✅ Were manual insights created today?
3. ✅ Check server logs for errors
4. ✅ Verify database permissions

## Manual Alternative

If you need insights generated before 7pm, use the "Generate Insights" button in the dashboard:
1. Click floating action button (sparkles icon)
2. Click "Generate AI Insights"
3. AI will analyze all content immediately

## Timeline Note

**MST Timezone Conversion:**
- 7pm MST = 8pm MDT (during daylight saving time)
- 7pm MST = 2am UTC (next day)
- If you're in a different timezone, adjust accordingly

## Future Enhancements

Possible improvements:
- User-configurable schedule time
- Email notifications when insights are generated
- Weekly summary instead of daily
- Skip days with no activity
