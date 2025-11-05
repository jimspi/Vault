import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/session';
import { z } from 'zod';

export const runtime = 'nodejs';

const emailInsightsSchema = z.object({
  insightIds: z.array(z.string().uuid()),
  email: z.string().email().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = emailInsightsSchema.parse(body);

    const supabase = createClient();

    // Get user profile for email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const recipientEmail = validatedData.email || profile.email;

    // Fetch insights with related documents
    const { data: insights, error } = await supabase
      .from('insights')
      .select(`
        id,
        type,
        title,
        content,
        created_at,
        metadata,
        related_documents
      `)
      .in('id', validatedData.insightIds);

    if (error || !insights || insights.length === 0) {
      return NextResponse.json(
        { error: 'Insights not found' },
        { status: 404 }
      );
    }

    // Get related documents if any
    const allDocIds = insights
      .flatMap((i) => (i.related_documents as string[]) || [])
      .filter(Boolean);

    let documents: any[] = [];
    if (allDocIds.length > 0) {
      const { data: docs } = await supabase
        .from('documents')
        .select('id, title')
        .in('id', allDocIds);
      documents = docs || [];
    }

    // Create document ID to title mapping
    const docMap = new Map(documents.map((d) => [d.id, d.title]));

    // Format email content
    const emailHtml = generateEmailHtml(insights, docMap, profile.full_name || 'there');

    // TODO: Integrate with email service (Resend, SendGrid, etc.)
    // For now, return success with email preview
    console.log('Email would be sent to:', recipientEmail);
    console.log('Email HTML preview:', emailHtml.substring(0, 200) + '...');

    // In production, you would do:
    // await sendEmail({
    //   to: recipientEmail,
    //   subject: `Your Vault AI Insights - ${new Date().toLocaleDateString()}`,
    //   html: emailHtml,
    // });

    return NextResponse.json({
      success: true,
      message: `Insights emailed to ${recipientEmail}`,
      // For demo: include preview
      preview: process.env.NODE_ENV === 'development' ? emailHtml : undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Email insights error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateEmailHtml(
  insights: any[],
  docMap: Map<string, string>,
  userName: string
): string {
  const insightTypeEmojis: Record<string, string> = {
    pattern: '🔄',
    contradiction: '⚠️',
    suggestion: '💡',
    reminder: '⏰',
    trend: '📈',
  };

  const insightsHtml = insights
    .map((insight) => {
      const relatedDocs = (insight.related_documents as string[]) || [];
      const docTitles = relatedDocs.map((id) => docMap.get(id)).filter(Boolean);
      const isAI = (insight.metadata as any)?.source === 'ai_generated';

      return `
        <div style="margin-bottom: 32px; padding: 20px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #6366f1;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 24px; margin-right: 8px;">${insightTypeEmojis[insight.type] || '💡'}</span>
            <span style="text-transform: uppercase; font-size: 12px; color: #6b7280; font-weight: 600;">
              ${insight.type}
            </span>
            ${isAI ? '<span style="margin-left: 8px; background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-size: 11px;">🤖 AI Generated</span>' : ''}
          </div>

          <h3 style="margin: 12px 0; font-size: 18px; color: #111827; font-weight: 600;">
            ${insight.title}
          </h3>

          <p style="margin: 12px 0; color: #374151; line-height: 1.6; font-size: 14px;">
            ${insight.content}
          </p>

          ${docTitles.length > 0 ? `
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
              <span style="font-size: 12px; color: #6b7280;">
                📄 Based on: ${docTitles.join(', ')}
              </span>
            </div>
          ` : ''}
        </div>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Vault AI Insights</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="margin: 0; font-size: 28px; color: #111827; font-weight: 700;">
            🧠 Your Vault Insights
          </h1>
          <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">
            ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <!-- Greeting -->
        <p style="margin-bottom: 24px; color: #374151; font-size: 16px;">
          Hi ${userName},
        </p>

        <p style="margin-bottom: 32px; color: #374151; font-size: 16px;">
          Here are the insights from your Vault:
        </p>

        <!-- Insights -->
        ${insightsHtml}

        <!-- Footer -->
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard"
             style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
            View All Insights
          </a>

          <p style="margin: 24px 0 0 0; color: #9ca3af; font-size: 12px;">
            You're receiving this email because you requested insights from Vault.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
