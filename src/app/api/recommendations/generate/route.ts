import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/session';
import { generateCompletion } from '@/lib/claude/client';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for deep analysis + web searches

interface ActionItem {
  step: string;
  timeframe: string;
}

interface Resource {
  title: string;
  url: string;
  description: string;
}

interface Recommendation {
  title: string;
  description: string;
  category: string;
  action_items: ActionItem[];
  resources: Resource[];
  reasoning: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    const supabase = createClient();

    // Verify workspace ownership
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .eq('owner_id', user.id)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    console.log('[Recommendations] Starting generation for workspace:', workspaceId);

    // Get ALL documents
    const { data: documents } = await supabase
      .from('documents')
      .select('title, content, upload_date, metadata')
      .eq('workspace_id', workspaceId)
      .eq('status', 'ready')
      .not('content', 'is', null)
      .order('upload_date', { ascending: false });

    // Get ALL insights (both manual and AI)
    const { data: insights } = await supabase
      .from('insights')
      .select('type, title, content, metadata, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    // Get profile summary
    const { data: profileCache } = await supabase
      .from('profile_cache')
      .select('profile_data')
      .eq('workspace_id', workspaceId)
      .single();

    const profile = profileCache?.profile_data?.profile;

    if ((!documents || documents.length === 0) && (!insights || insights.length === 0)) {
      return NextResponse.json({
        recommendations: [],
        message: 'Upload documents or create insights to get personalized recommendations'
      });
    }

    // Build comprehensive context
    let contextText = '# USER PROFILE\n\n';

    if (profile) {
      contextText += `**Summary**: ${profile.summary}\n\n`;
      if (profile.interests?.length > 0) {
        contextText += `**Interests**: ${profile.interests.join(', ')}\n\n`;
      }
      if (profile.goals?.length > 0) {
        contextText += `**Goals**: ${profile.goals.join(', ')}\n\n`;
      }
      if (profile.patterns?.length > 0) {
        contextText += `**Patterns**: ${profile.patterns.join(', ')}\n\n`;
      }
    }

    contextText += '\n# RECENT DOCUMENTS\n\n';
    if (documents && documents.length > 0) {
      contextText += documents.slice(0, 10).map((doc, i) => {
        const daysAgo = Math.floor((Date.now() - new Date(doc.upload_date).getTime()) / (1000 * 60 * 60 * 24));
        return `${i + 1}. "${doc.title}" (${daysAgo} days ago)\n   Preview: ${doc.content?.slice(0, 1000)}`;
      }).join('\n\n');
    }

    contextText += '\n\n# INSIGHTS (AI + MANUAL)\n\n';
    if (insights && insights.length > 0) {
      contextText += insights.slice(0, 15).map((insight, i) => {
        const source = (insight.metadata as any)?.source === 'manual' ? 'USER' : 'AI';
        return `${i + 1}. [${source}] ${insight.title}\n   ${insight.content.slice(0, 500)}`;
      }).join('\n\n');
    }

    // Step 1: Analyze what's important to the user
    const analysisPrompt = `You are analyzing a user's personal knowledge vault to identify what's most important to them and generate actionable recommendations.

${contextText}

**Your Task:**
1. Identify 3-5 key areas that are most important to this user based on their content
2. For each area, determine what actionable recommendations would be most valuable
3. Consider: goals, challenges, interests, patterns, and recent activity

Respond with a JSON array of recommendation topics in this format:
[
  {
    "area": "brief area name",
    "category": "networking|learning|productivity|health|career|finance|personal",
    "priority": "low|medium|high|urgent",
    "needs": "what the user needs in this area",
    "search_query": "specific search query to find real resources for this need"
  }
]

Keep it focused on what would be MOST valuable and actionable right now.`;

    console.log('[Recommendations] Analyzing user needs...');
    const analysisResponse = await generateCompletion(
      [{ role: 'user', content: analysisPrompt }],
      {
        maxTokens: 2000,
        temperature: 0.7,
        system: 'You are an AI assistant that helps identify actionable recommendations. Always respond with valid JSON only.',
      }
    );

    let topics: any[] = [];
    try {
      console.log('[Recommendations] Raw analysis response:', analysisResponse.slice(0, 500));
      const jsonMatch = analysisResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        topics = JSON.parse(jsonMatch[0]);
        console.log('[Recommendations] Parsed topics:', JSON.stringify(topics, null, 2));
      } else {
        console.error('[Recommendations] No JSON array found in response');
        console.error('[Recommendations] Full response:', analysisResponse);
      }
    } catch (parseError) {
      console.error('[Recommendations] Failed to parse analysis:', parseError);
      console.error('[Recommendations] Raw response:', analysisResponse);
      return NextResponse.json({
        error: 'Failed to analyze user needs',
        details: parseError instanceof Error ? parseError.message : 'Parse error',
        response: analysisResponse.slice(0, 200)
      }, { status: 500 });
    }

    if (topics.length === 0) {
      console.error('[Recommendations] No topics identified from analysis');
      return NextResponse.json({
        error: 'No recommendation areas identified',
        message: 'Could not identify areas for recommendations based on your content. Try adding more documents or insights.',
        response: analysisResponse.slice(0, 200)
      }, { status: 400 });
    }

    console.log('[Recommendations] Found', topics.length, 'recommendation areas');

    // Step 2: For each topic, search the web for real resources
    const recommendations: Recommendation[] = [];

    for (const topic of topics.slice(0, 5)) { // Limit to top 5 to avoid excessive API calls
      try {
        console.log(`[Recommendations] Generating recommendation for: ${topic.search_query}`);

        // Note: In future, this could integrate with WebSearch to find real-time resources
        // For now, AI generates recommendations based on its knowledge

        const recommendationPrompt = `Based on this user need:
**Area**: ${topic.area}
**Category**: ${topic.category}
**Need**: ${topic.needs}

Create a detailed, actionable recommendation with:
1. Specific action items the user can take (with timeframes)
2. Real resources they can use (articles, tools, events, courses, etc.)
3. Clear reasoning for why this matters to them

Respond with JSON in this exact format:
{
  "title": "Clear, actionable title",
  "description": "2-3 sentence description of what this recommendation is about",
  "action_items": [
    {"step": "Specific action to take", "timeframe": "this week|this month|next quarter"},
    {"step": "Another specific action", "timeframe": "timeframe"}
  ],
  "resources": [
    {"title": "Resource name", "url": "https://example.com", "description": "What this resource provides"},
    {"title": "Another resource", "url": "https://example.com", "description": "What this provides"}
  ],
  "reasoning": "Why this recommendation matters to the user based on their profile and content"
}

Make it SPECIFIC and ACTIONABLE. Use real URLs when possible (Meetup.com, Eventbrite, LinkedIn Learning, etc.).`;

        const recResponse = await generateCompletion(
          [{ role: 'user', content: recommendationPrompt }],
          {
            maxTokens: 1500,
            temperature: 0.7,
            system: 'You are an AI assistant that creates actionable recommendations. Always respond with valid JSON only.',
          }
        );

        try {
          console.log(`[Recommendations] Raw recommendation response (first 300 chars):`, recResponse.slice(0, 300));
          const jsonMatch = recResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const recommendation = JSON.parse(jsonMatch[0]);
            console.log(`[Recommendations] Successfully parsed recommendation:`, recommendation.title);
            recommendations.push({
              ...recommendation,
              category: topic.category,
              priority: topic.priority,
            });
          } else {
            console.error('[Recommendations] No JSON object found in recommendation response');
            console.error('[Recommendations] Full response:', recResponse);
          }
        } catch (parseError) {
          console.error('[Recommendations] Failed to parse recommendation:', parseError);
          console.error('[Recommendations] Response was:', recResponse.slice(0, 500));
        }
      } catch (error) {
        console.error(`[Recommendations] Error generating recommendation for ${topic.area}:`, error);
      }
    }

    console.log('[Recommendations] Generated', recommendations.length, 'recommendations');

    if (recommendations.length === 0) {
      console.error('[Recommendations] No recommendations were successfully generated');
      return NextResponse.json({
        error: 'Failed to generate recommendations',
        message: 'The AI was unable to create recommendations from your content. This may be a temporary issue - please try again.',
        count: 0
      }, { status: 500 });
    }

    // Step 3: Save recommendations to database
    const savedRecommendations = [];
    const errors = [];

    for (const rec of recommendations) {
      try {
        const { data: saved, error: insertError } = await supabase
          .from('recommendations')
          .insert({
            workspace_id: workspaceId,
            title: rec.title,
            description: rec.description,
            category: rec.category,
            action_items: rec.action_items,
            resources: rec.resources,
            reasoning: rec.reasoning,
            priority: rec.priority,
            status: 'new',
          })
          .select()
          .single();

        if (insertError) {
          console.error('[Recommendations] Database insert error:', insertError);
          errors.push({ title: rec.title, error: insertError.message });
        } else if (saved) {
          savedRecommendations.push(saved);
          console.log('[Recommendations] Saved:', saved.title);
        }
      } catch (saveError) {
        console.error('[Recommendations] Failed to save recommendation:', saveError);
        errors.push({ title: rec.title, error: saveError instanceof Error ? saveError.message : 'Unknown error' });
      }
    }

    console.log(`[Recommendations] Saved ${savedRecommendations.length} of ${recommendations.length} recommendations`);
    if (errors.length > 0) {
      console.error('[Recommendations] Save errors:', errors);
    }

    return NextResponse.json({
      success: true,
      recommendations: savedRecommendations,
      count: savedRecommendations.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[Recommendations] Generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate recommendations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
