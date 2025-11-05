# Email Setup Instructions for Vault

The email functionality is now enabled using [Resend](https://resend.com). Follow these steps to configure it:

## 1. Get a Resend API Key

1. Go to [resend.com](https://resend.com) and sign up for a free account
2. Navigate to **API Keys** in the dashboard
3. Click **Create API Key**
4. Copy your API key (it starts with `re_`)

## 2. Configure Environment Variables

### For Local Development

Add to your `.env.local` file:

```bash
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=onboarding@resend.dev  # Optional: Use Resend's test email
```

### For Vercel Production

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:
   - `RESEND_API_KEY`: Your Resend API key
   - `FROM_EMAIL` (optional): Your verified sender email

**Important:** After adding environment variables, you must redeploy your app for changes to take effect.

## 3. Verify Domain (Production Only)

For production use with a custom email address:

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records shown to your domain provider
5. Wait for verification (usually takes a few minutes)
6. Update `FROM_EMAIL` to use your domain: `Vault <insights@yourdomain.com>`

## 4. Test Email Functionality

### Using Resend's Test Email (Free)

The default `onboarding@resend.dev` email works immediately without domain verification. It's perfect for:
- Development
- Testing
- Demos

**Limitation:** Can only send to the email address associated with your Resend account.

### Using Your Own Domain

After verifying your domain, you can:
- Send to any email address
- Use a custom sender name
- Build trust with recipients

## 5. Usage in Vault

Once configured, users can:

1. **Email Single Insight**: Click "Email This" button on any AI-generated insight
2. **Email Multiple Insights**: Select multiple insights using checkboxes, then click "Email Selected (X)"

Emails will be sent to the user's registered email address by default.

## Troubleshooting

### "Email service not configured" error

**Cause:** `RESEND_API_KEY` environment variable is missing.

**Solution:**
1. Check that you added `RESEND_API_KEY` to your environment variables
2. If on Vercel, redeploy after adding the variable
3. If local, restart your dev server

### "Failed to send email" error

**Possible causes:**
1. Invalid API key
2. Sending to unverified email (when using custom domain)
3. Resend account issue

**Solution:**
1. Verify your API key is correct
2. Use `onboarding@resend.dev` as `FROM_EMAIL` for testing
3. Check Resend dashboard for any account issues

### Email not received

1. Check spam/junk folder
2. Verify recipient email address is correct
3. Check Resend dashboard → **Emails** tab for delivery status
4. If using custom domain, ensure DNS records are properly configured

## Free Tier Limits

Resend free tier includes:
- **3,000 emails/month**
- **100 emails/day**
- **1 verified domain**

Perfect for small teams and MVPs. Upgrade to paid plans for higher limits.

## Support

- Resend Documentation: https://resend.com/docs
- Resend Discord: https://discord.gg/resend
- Vault Issues: Create an issue in this repository
