import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// DELETE - Delete an insight
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const supabase = createClient();

    // Verify insight exists and user owns it
    const { data: insight } = await supabase
      .from('insights')
      .select('*, workspaces!inner(owner_id)')
      .eq('id', id)
      .single();

    if (!insight) {
      return NextResponse.json({ error: 'Insight not found' }, { status: 404 });
    }

    if ((insight.workspaces as any).owner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete insight
    const { error } = await supabase
      .from('insights')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Insights] Delete error:', error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Insights] Delete error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete insight',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PATCH - Update insight (for dismiss functionality)
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

    if (!status) {
      return NextResponse.json({ error: 'Status required' }, { status: 400 });
    }

    const supabase = createClient();

    // Verify insight exists and user owns it
    const { data: insight } = await supabase
      .from('insights')
      .select('*, workspaces!inner(owner_id)')
      .eq('id', id)
      .single();

    if (!insight) {
      return NextResponse.json({ error: 'Insight not found' }, { status: 404 });
    }

    if ((insight.workspaces as any).owner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update insight status
    const { data: updated, error } = await supabase
      .from('insights')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Insights] Update error:', error);
      throw error;
    }

    return NextResponse.json({ insight: updated });
  } catch (error) {
    console.error('[Insights] Update error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update insight',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
