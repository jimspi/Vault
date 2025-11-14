import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/session';
import { generateCompletion } from '@/lib/claude/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // Required for API routes that use cookies/getUser
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

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

    // Check for cached profile (24-hour cache)
    // Wrap in try-catch in case table doesn't exist yet
    try {
      const { data: cachedProfile, error: cacheError } = await supabase
        .from('profile_cache')
        .select('*')
        .eq('workspace_id', workspaceId)
        .single();

      if (!cacheError && cachedProfile) {
        const cacheAge = Date.now() - new Date(cachedProfile.updated_at).getTime();
        const twentyFourHours = 24 * 60 * 60 * 1000;

        // Return cached profile if less than 24 hours old
        if (cacheAge < twentyFourHours) {
          console.log(`[Profile] Returning cached profile for workspace ${workspaceId}, age: ${Math.floor(cacheAge / 1000 / 60)} minutes`);
          return NextResponse.json({
            ...cachedProfile.profile_data,
            metadata: {
              ...cachedProfile.profile_data.metadata,
              cached: true,
              cacheAge: Math.floor(cacheAge / 1000 / 60), // minutes
              nextRefresh: new Date(new Date(cachedProfile.updated_at).getTime() + twentyFourHours).toISOString()
            }
          });
        }
      }
    } catch (cacheCheckError) {
      // Cache table might not exist yet - continue to generate
      console.log('[Profile] Cache check failed (table may not exist yet):', cacheCheckError);
    }

    // Cache miss or expired - generate new profile
    // Get ALL documents
    const { data: documents } = await supabase
      .from('documents')
      .select('title, content, upload_date, metadata')
      .eq('workspace_id', workspaceId)
      .eq('status', 'ready')
      .not('content', 'is', null)
      .order('upload_date', { ascending: false });

    // Get ALL manual insights (user's own observations)
    const { data: manualInsights } = await supabase
      .from('insights')
      .select('type, title, content, created_at')
      .eq('workspace_id', workspaceId)
      .eq('metadata->>source', 'manual')
      .order('created_at', { ascending: false });

    // Get AI insights to understand what patterns AI has found
    const { data: aiInsights } = await supabase
      .from('insights')
      .select('type, title, content')
      .eq('workspace_id', workspaceId)
      .eq('metadata->>source', 'ai_generated')
      .order('created_at', { ascending: false })
      .limit(10);

    if ((!documents || documents.length === 0) && (!manualInsights || manualInsights.length === 0)) {
      const emptyProfile = {
        profile: {
          summary: "Start uploading documents and creating insights to help me understand your interests and goals.",
          interests: [],
          goals: [],
          patterns: [],
          characteristics: []
        },
        metadata: {
          documentCount: 0,
          manualInsightCount: 0,
          lastUpdated: new Date().toISOString(),
          cached: false,
        }
      };

      // Cache empty profile too (so we don't keep hitting AI with no data)
      try {
        await supabase
          .from('profile_cache')
          .upsert({
            workspace_id: workspaceId,
            profile_data: emptyProfile,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'workspace_id'
          });
      } catch (cacheSaveError) {
        console.log('[Profile] Failed to save empty profile to cache:', cacheSaveError);
      }

      return NextResponse.json(emptyProfile);
    }

    // Build context for AI analysis
    let contextText = '';

    if (documents && documents.length > 0) {
      contextText += `DOCUMENTS (${documents.length} total):\n`;
      contextText += documents.map((doc, i) => {
        const uploadDate = new Date(doc.upload_date);
        const daysAgo = Math.floor((Date.now() - uploadDate.getTime()) / (1000 * 60 * 60 * 24));
        return `${i + 1}. "${doc.title}" (${daysAgo} days ago)\n   Content preview: ${doc.content?.slice(0, 2000)}`;
      }).join('\n\n');
      contextText += '\n\n';
    }

    if (manualInsights && manualInsights.length > 0) {
      contextText += `USER'S MANUAL INSIGHTS (${manualInsights.length} total):\n`;
      contextText += manualInsights.map((insight, i) =>
        `${i + 1}. [${insight.type.toUpperCase()}] "${insight.title}"\n   ${insight.content}`
      ).join('\n\n');
      contextText += '\n\n';
    }

    if (aiInsights && aiInsights.length > 0) {
      contextText += `AI-DISCOVERED PATTERNS:\n`;
      contextText += aiInsights.map((insight, i) =>
        `${i + 1}. ${insight.title}`
      ).join('\n');
    }

    // Generate profile using AI
    const prompt = `You are analyzing a user's continual memory vault to create a personalized profile summary.

${contextText}

Based on ALL the content above (documents, manual insights, and AI patterns), create a comprehensive profile that shows what you've learned about this person.

**Your task:** Analyze the content to understand:
1. **Who they are**: Professional role, background, identity
2. **What they're interested in**: Topics, domains, areas of focus
3. **What they want**: Goals, aspirations, objectives
4. **Key characteristics**: Working style, priorities, values
5. **Current focus**: What they're actively working on now

Be specific and reference actual content. Use "you" to speak directly to the user.

Respond with a JSON object in this exact format:
{
  "summary": "2-3 sentence overview of who this person is and what drives them",
  "interests": ["interest 1", "interest 2", "interest 3"],
  "goals": ["goal 1", "goal 2", "goal 3"],
  "patterns": ["pattern 1", "pattern 2", "pattern 3"],
  "characteristics": ["characteristic 1", "characteristic 2", "characteristic 3"]
}

Keep each item concise but specific. Reference actual topics from their content.`;

    const aiResponse = await generateCompletion(
      [{ role: 'user', content: prompt }],
      {
        maxTokens: 1500,
        temperature: 0.7,
        system: 'You are a helpful AI assistant that creates insightful user profiles. Always respond with valid JSON only.',
      }
    );

    // Parse AI response
    let profile;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      profile = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse profile response:', aiResponse);
      return NextResponse.json({
        profile: {
          summary: "I'm learning about you as you add more content to your vault.",
          interests: [],
          goals: [],
          patterns: [],
          characteristics: []
        }
      });
    }

    // Add metadata
    const result = {
      profile,
      metadata: {
        documentCount: documents?.length || 0,
        manualInsightCount: manualInsights?.length || 0,
        lastUpdated: new Date().toISOString(),
        cached: false,
      }
    };

    // Save to cache (upsert)
    try {
      console.log(`[Profile] Saving new profile to cache for workspace ${workspaceId}`);
      await supabase
        .from('profile_cache')
        .upsert({
          workspace_id: workspaceId,
          profile_data: result,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'workspace_id'
        });
    } catch (cacheSaveError) {
      console.log('[Profile] Failed to save profile to cache:', cacheSaveError);
      // Continue anyway - profile will still be returned, just not cached
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Profile generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
