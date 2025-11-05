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

    // Get ALL documents with content (no limit - use everything)
    const { data: documents } = await supabase
      .from('documents')
      .select('id, title, content, upload_date, metadata')
      .eq('workspace_id', validatedData.workspaceId)
      .eq('status', 'ready')
      .not('content', 'is', null)
      .order('upload_date', { ascending: false }); // Most recent first

    // Get ALL existing insights (no limit - complete memory)
    const { data: existingInsights } = await supabase
      .from('insights')
      .select('id, type, title, content, created_at, metadata')
      .eq('workspace_id', validatedData.workspaceId)
      .order('created_at', { ascending: false }); // Most recent first

    // Check if we have any content to analyze
    if ((!documents || documents.length === 0) && (!existingInsights || existingInsights.length === 0)) {
      return NextResponse.json(
        { error: 'No content available', message: 'Upload documents or create manual insights first to generate AI insights' },
        { status: 400 }
      );
    }

    // Prepare document summaries for AI with substantial content
    const documentSummaries = (documents || []).map((doc, index) => {
      const uploadDate = new Date(doc.upload_date);
      const now = new Date();
      const daysAgo = Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24));
      const isRecent = daysAgo <= 1; // Uploaded today or yesterday

      return {
        title: doc.title,
        // Include much more content (3000 chars) so AI can properly analyze
        preview: doc.content?.slice(0, 3000),
        uploadDate: doc.upload_date,
        daysAgo,
        isRecent,
        position: index + 1, // Position in recency order (1 = most recent)
      };
    });

    // Prepare existing insights for AI context
    const insightSummaries = (existingInsights || []).map((insight) => ({
      type: insight.type,
      title: insight.title,
      content: insight.content,
      source: (insight.metadata as any)?.source || 'unknown',
      createdAt: insight.created_at,
    }));

    // Build comprehensive context for AI with recency indicators
    let contextText = '';

    if (documents && documents.length > 0) {
      const recentDocs = documentSummaries.filter(d => d.isRecent);
      contextText += `Documents in workspace (${documents.length} total - ${recentDocs.length} uploaded recently):\n`;
      contextText += `**NOTE: Documents are ordered by recency (most recent first). Focus more on recent uploads but consider ALL documents.**\n\n`;

      contextText += documentSummaries.map((doc) => {
        const recencyLabel = doc.isRecent ? 'RECENT - uploaded today/yesterday' : `${doc.daysAgo} days ago`;
        return `${doc.position}. "${doc.title}" (${recencyLabel})\n   Content: ${doc.preview}${doc.preview && doc.preview.length >= 3000 ? '...' : ''}`;
      }).join('\n\n');
      contextText += '\n\n';
    }

    if (existingInsights && existingInsights.length > 0) {
      const manualInsights = insightSummaries.filter(i => i.source === 'manual');
      contextText += `Existing Insights (${existingInsights.length} total - ${manualInsights.length} manual from user):\n`;
      contextText += `**These represent the user's observations and thoughts. Consider them as part of the user's memory.**\n\n`;

      contextText += insightSummaries.map((insight, i) =>
        `${i + 1}. [${insight.type.toUpperCase()}] "${insight.title}"\n   Content: ${insight.content}\n   Source: ${insight.source === 'manual' ? 'Manual (user-created)' : 'AI-generated'}\n   Created: ${new Date(insight.createdAt).toLocaleDateString()}`
      ).join('\n\n');
    }

    // Generate insights using AI with enhanced prompt
    const prompt = `You are an expert analyst helping users maintain their continual memory and discover valuable insights.

${contextText}

Your task is to generate 2-3 NEW HIGH-VALUE insights by analyzing ALL the documents AND existing insights above.

**CRITICAL REQUIREMENTS:**
1. **USE ALL DOCUMENTS**: You MUST consider every document listed above, not just one or two. The user expects insights that synthesize information from their entire knowledge base.
2. **PRIORITIZE RECENT CONTENT**: Documents marked as "RECENT" should have more weight in your analysis, but don't ignore older documents.
3. **SYNTHESIZE ACROSS SOURCES**: Look for patterns, contradictions, and connections across ALL documents and manual insights.
4. **REMEMBER EVERYTHING**: This is the user's continual memory system - treat all content as important context.

**Analysis Approach:**
- Start with recently uploaded documents (marked RECENT), but scan through ALL documents
- Cross-reference findings across multiple documents
- Build upon user's manual insights - they represent the user's own observations
- Identify patterns that emerge when you consider the COMPLETE picture
- Find contradictions between different sources
- Suggest connections the user might not have noticed

**Focus Areas:**
1. **Comprehensive Patterns**: What themes emerge when you analyze ALL documents together?
2. **Recent Context**: What new information from recent uploads relates to older content?
3. **Cross-Document Connections**: How do different documents relate to each other?
4. **Memory Integration**: How do manual insights provide context for understanding documents?
5. **Actionable Synthesis**: What can the user do with this information?

**AVOID:**
- Analyzing only 1-2 documents (use everything provided!)
- Simply restating existing insights
- Generic advice without specific references
- Ignoring the user's manual observations

**IMPORTANT**: In relatedDocumentTitles, include ALL document titles that contributed to this insight, not just one.

Respond with a JSON array of insights in this exact format:
[
  {
    "type": "pattern" | "contradiction" | "suggestion" | "reminder" | "trend",
    "title": "Concise, specific title (max 100 chars)",
    "content": "Detailed explanation referencing MULTIPLE documents and insights (200-500 chars)",
    "priority": 1-100 (higher = more important based on recency and relevance),
    "relatedDocumentTitles": ["doc title 1", "doc title 2", "doc title 3"]
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

    // Create document title to ID mapping (handle case where no documents exist)
    const titleToId = new Map((documents || []).map((doc) => [doc.title, doc.id]));

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
