import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/session';
import { generateCompletion } from '@/lib/claude/client';
import { z } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 60;

const generateInsightsSchema = z.object({
  workspaceId: z.string().uuid(),
});

// Daily limit per workspace
const DAILY_GENERATION_LIMIT = 5;

interface GenerationMetadata {
  lastGeneratedDate?: string;
  generationsToday?: number;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = generateInsightsSchema.parse(body);

    const supabase = createClient();

    // Get workspace
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', validatedData.workspaceId)
      .eq('owner_id', user.id)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Check daily rate limit
    const metadata = (workspace.settings as GenerationMetadata) || {};
    const today = new Date().toISOString().split('T')[0];
    const lastGeneratedDate = metadata.lastGeneratedDate;
    const generationsToday = lastGeneratedDate === today ? (metadata.generationsToday || 0) : 0;

    if (generationsToday >= DAILY_GENERATION_LIMIT) {
      return NextResponse.json(
        {
          error: 'Daily limit reached',
          message: `You've reached the daily limit of ${DAILY_GENERATION_LIMIT} AI insight generations. Try again tomorrow or create manual insights.`,
          limit: DAILY_GENERATION_LIMIT,
          used: generationsToday,
        },
        { status: 429 }
      );
    }

    // Get recent documents with content
    const { data: documents } = await supabase
      .from('documents')
      .select('id, title, content, upload_date, metadata')
      .eq('workspace_id', validatedData.workspaceId)
      .eq('status', 'ready')
      .not('content', 'is', null)
      .order('upload_date', { ascending: false })
      .limit(20);

    // Get existing insights to include in analysis (not just to avoid duplicates!)
    const { data: existingInsights } = await supabase
      .from('insights')
      .select('id, type, title, content, created_at, metadata')
      .eq('workspace_id', validatedData.workspaceId)
      .order('created_at', { ascending: false })
      .limit(20);

    // Check if we have any content to analyze
    if ((!documents || documents.length === 0) && (!existingInsights || existingInsights.length === 0)) {
      return NextResponse.json(
        { error: 'No content available', message: 'Upload documents or create manual insights first to generate AI insights' },
        { status: 400 }
      );
    }

    // Prepare document summaries for AI
    const documentSummaries = (documents || []).map((doc) => ({
      title: doc.title,
      preview: doc.content?.slice(0, 500),
      uploadDate: doc.upload_date,
    }));

    // Prepare existing insights for AI context
    const insightSummaries = (existingInsights || []).map((insight) => ({
      type: insight.type,
      title: insight.title,
      content: insight.content,
      source: (insight.metadata as any)?.source || 'unknown',
      createdAt: insight.created_at,
    }));

    // Build comprehensive context for AI
    let contextText = '';

    if (documents && documents.length > 0) {
      contextText += `Documents in workspace (${documents.length} total):\n`;
      contextText += documentSummaries.map((doc, i) =>
        `${i + 1}. "${doc.title}" (${new Date(doc.uploadDate).toLocaleDateString()})\n   Preview: ${doc.preview}...`
      ).join('\n\n');
      contextText += '\n\n';
    }

    if (existingInsights && existingInsights.length > 0) {
      contextText += `Existing Insights (${existingInsights.length} total - including manual insights from user):\n`;
      contextText += insightSummaries.map((insight, i) =>
        `${i + 1}. [${insight.type.toUpperCase()}] "${insight.title}"\n   Content: ${insight.content}\n   Source: ${insight.source === 'manual' ? '👤 Manual (user-created)' : '🤖 AI-generated'}`
      ).join('\n\n');
    }

    // Generate insights using AI with enhanced prompt
    const prompt = `You are an expert analyst helping users discover valuable insights from their knowledge base.

${contextText}

Your task is to generate 2-3 NEW HIGH-VALUE insights by analyzing BOTH the documents AND the existing insights above.

**IMPORTANT - Analyze Across All Content:**
- Look for patterns that emerge across BOTH documents AND manual insights
- Identify contradictions between documents and user's manual insights
- Find connections between what's in documents and what the user has observed manually
- Build upon existing insights to reach deeper conclusions
- Consider how manual insights (marked 👤) provide context for understanding documents

Focus on:
1. **Meta-Patterns**: Connections between manual insights and document content
2. **Validation**: Do documents support or contradict manual insights?
3. **Synthesis**: Combine information from multiple sources into higher-level understanding
4. **Gaps**: What's missing when you compare manual insights to document evidence?
5. **Deeper Conclusions**: What can we infer by analyzing everything together?

AVOID:
- Simply restating existing insights (they're already captured)
- Ignoring the manual insights - they're valuable user observations!
- Generic advice that doesn't reference specific content

Generate insights that show you've considered ALL available information - both documents and manual insights together.

Respond with a JSON array of insights in this exact format:
[
  {
    "type": "pattern" | "contradiction" | "suggestion" | "reminder" | "trend",
    "title": "Concise, specific title (max 100 chars)",
    "content": "Detailed explanation referencing documents AND/OR existing insights (200-500 chars)",
    "priority": 1-100 (higher = more important),
    "relatedDocumentTitles": ["doc title 1", "doc title 2"]
  }
]`;

    const aiResponse = await generateCompletion(
      [{ role: 'user', content: prompt }],
      {
        maxTokens: 2000,
        temperature: 0.7,
        system: 'You are a helpful AI assistant that generates valuable, specific insights from documents. Always respond with valid JSON only.',
      }
    );

    // Parse AI response
    let generatedInsights;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      generatedInsights = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      return NextResponse.json(
        { error: 'Failed to generate insights', message: 'AI response parsing failed' },
        { status: 500 }
      );
    }

    // Create document title to ID mapping
    const titleToId = new Map(documents.map((doc) => [doc.title, doc.id]));

    // Valid insight types as defined in the database enum
    const validTypes = ['pattern', 'contradiction', 'suggestion', 'reminder', 'trend'];

    // Insert insights into database
    const insightsToInsert = generatedInsights
      .filter((insight: any) => {
        // Filter out insights with invalid types
        if (!validTypes.includes(insight.type)) {
          console.warn(`Skipping insight with invalid type: ${insight.type}`);
          return false;
        }
        return true;
      })
      .map((insight: any) => {
        // Map document titles to IDs
        const relatedDocIds = (insight.relatedDocumentTitles || [])
          .map((title: string) => titleToId.get(title))
          .filter((id: string | undefined): id is string => id !== null && id !== undefined);

        return {
          workspace_id: validatedData.workspaceId,
          type: insight.type,
          title: insight.title?.slice(0, 200) || 'Untitled Insight',
          content: insight.content?.slice(0, 2000) || '',
          priority: Math.min(100, Math.max(1, insight.priority || 50)),
          status: 'new',
          metadata: {
            source: 'ai_generated',
            generated_at: new Date().toISOString(),
            model: 'gpt-4',
          },
          related_documents: relatedDocIds,
        };
      });

    // Check if we have any valid insights to insert
    if (insightsToInsert.length === 0) {
      console.error('No valid insights generated after filtering');
      return NextResponse.json(
        {
          error: 'No valid insights generated',
          message: 'AI generated insights, but they had invalid types. Please try again.'
        },
        { status: 500 }
      );
    }

    console.log(`Attempting to insert ${insightsToInsert.length} insights`);

    const { data: createdInsights, error: insertError } = await supabase
      .from('insights')
      .insert(insightsToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting insights:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        insightsData: insightsToInsert,
      });
      return NextResponse.json(
        {
          error: 'Failed to save insights',
          details: insertError.message,
          code: insertError.code,
        },
        { status: 500 }
      );
    }

    // Update workspace generation count
    const newMetadata = {
      ...workspace.settings,
      lastGeneratedDate: today,
      generationsToday: generationsToday + 1,
    };

    await supabase
      .from('workspaces')
      .update({ settings: newMetadata })
      .eq('id', validatedData.workspaceId);

    return NextResponse.json({
      insights: createdInsights,
      limit: {
        daily: DAILY_GENERATION_LIMIT,
        used: generationsToday + 1,
        remaining: DAILY_GENERATION_LIMIT - (generationsToday + 1),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Generate insights error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
