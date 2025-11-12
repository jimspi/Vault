import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export const runtime = 'nodejs';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailNotificationRequest {
  to: string;
  recommendationCount: number;
  userName?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal service call
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as EmailNotificationRequest;
    const { to, recommendationCount, userName } = body;

    if (!to || !recommendationCount) {
      return NextResponse.json(
        { error: 'Missing required fields: to, recommendationCount' },
        { status: 400 }
      );
    }

    console.log(`[Email] Sending recommendation notification to ${to}`);

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'Vault <notifications@vault-ai.com>',
      to: [to],
      subject: `🎯 ${recommendationCount} New Recommendations Available`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background: #ffffff;
                border-radius: 8px;
                padding: 32px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 32px;
              }
              .logo {
                font-size: 32px;
                font-weight: bold;
                color: #000;
                margin-bottom: 8px;
              }
              h1 {
                color: #000;
                font-size: 24px;
                margin: 0 0 16px 0;
              }
              .count {
                font-size: 48px;
                font-weight: bold;
                color: #22c55e;
                margin: 16px 0;
              }
              .description {
                color: #666;
                margin-bottom: 24px;
              }
              .cta {
                text-align: center;
                margin: 32px 0;
              }
              .button {
                display: inline-block;
                background: #000;
                color: #fff;
                padding: 14px 32px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                font-size: 16px;
              }
              .button:hover {
                background: #333;
              }
              .features {
                margin: 24px 0;
                padding: 20px;
                background: #f9fafb;
                border-radius: 6px;
              }
              .feature {
                margin: 12px 0;
                display: flex;
                align-items: center;
              }
              .feature-icon {
                margin-right: 12px;
                font-size: 20px;
              }
              .footer {
                text-align: center;
                margin-top: 32px;
                padding-top: 24px;
                border-top: 1px solid #e5e7eb;
                color: #666;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🧠 Vault</div>
                <h1>New Recommendations Ready!</h1>
              </div>

              <div style="text-align: center;">
                <div class="count">${recommendationCount}</div>
                <p class="description">
                  ${userName ? `Hi ${userName}! ` : ''}Your AI assistant has analyzed your recent documents and insights to generate personalized, actionable recommendations just for you.
                </p>
              </div>

              <div class="features">
                <div class="feature">
                  <span class="feature-icon">🎯</span>
                  <span><strong>Personalized:</strong> Tailored to your goals and interests</span>
                </div>
                <div class="feature">
                  <span class="feature-icon">✅</span>
                  <span><strong>Actionable:</strong> Clear steps you can take today</span>
                </div>
                <div class="feature">
                  <span class="feature-icon">🔗</span>
                  <span><strong>Resourceful:</strong> Curated links, tools, and materials</span>
                </div>
              </div>

              <div class="cta">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://vault-ai.com'}/dashboard/recommendations" class="button">
                  View Your Recommendations →
                </a>
              </div>

              <div class="footer">
                <p>You're receiving this email because you have auto-recommendations enabled in your Vault settings.</p>
                <p style="margin-top: 8px;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://vault-ai.com'}/dashboard/settings" style="color: #666;">Manage notification preferences</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('[Email] Resend error:', error);
      throw error;
    }

    console.log(`[Email] Successfully sent to ${to}, ID: ${data?.id}`);

    return NextResponse.json({
      success: true,
      emailId: data?.id,
      recipient: to,
    });
  } catch (error) {
    console.error('[Email] Failed to send notification:', error);
    return NextResponse.json(
      {
        error: 'Failed to send email notification',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
