import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/session';

export const runtime = 'nodejs';

// PATCH - Update recommendation status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['new', 'in_progress', 'completed', 'dismissed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const supabase = createClient();

    // Verify recommendation exists and user owns it
    const { data: recommendation } = await supabase
      .from('recommendations')
      .select('*, workspaces!inner(owner_id)')
      .eq('id', id)
      .single();

    if (!recommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    if ((recommendation.workspaces as any).owner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update recommendation
    const updateData: any = { status };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    if (status === 'dismissed') {
      updateData.dismissed_at = new Date().toISOString();
    }

    const { data: updated, error } = await supabase
      .from('recommendations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ recommendation: updated });
  } catch (error) {
    console.error('[Recommendations] Update error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update recommendation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a recommendation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const supabase = createClient();

    // Verify recommendation exists and user owns it
    const { data: recommendation } = await supabase
      .from('recommendations')
      .select('*, workspaces!inner(owner_id)')
      .eq('id', id)
      .single();

    if (!recommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    if ((recommendation.workspaces as any).owner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete recommendation
    const { error } = await supabase
      .from('recommendations')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Recommendations] Delete error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete recommendation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
