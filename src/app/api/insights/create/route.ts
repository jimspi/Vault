import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/session';
import { z } from 'zod';

export const runtime = 'nodejs';

const createInsightSchema = z.object({
  workspaceId: z.string().uuid(),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(2000),
  type: z.enum(['pattern', 'contradiction', 'suggestion', 'reminder', 'trend']),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createInsightSchema.parse(body);

    const supabase = createClient();

    // Verify workspace ownership
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', validatedData.workspaceId)
      .eq('owner_id', user.id)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Create the insight
    const { data: insight, error: insertError } = await supabase
      .from('insights')
      .insert({
        workspace_id: validatedData.workspaceId,
        type: validatedData.type,
        title: validatedData.title,
        content: validatedData.content,
        status: 'new',
        priority: 50, // Medium priority for manual insights
        metadata: { source: 'manual', created_by: user.id },
        related_documents: [],
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating insight:', insertError);
      return NextResponse.json(
        { error: 'Failed to create insight' },
        { status: 500 }
      );
    }

    return NextResponse.json({ insight });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create insight error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
