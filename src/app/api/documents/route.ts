import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/session';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Verify workspace ownership
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspaceId)
      .eq('owner_id', user.id)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Fetch documents with tags
    const { data: documents, error, count } = await supabase
      .from('documents')
      .select(
        `
        *,
        tags:document_tags(tag:tags(*))
      `,
        { count: 'exact' }
      )
      .eq('workspace_id', workspaceId)
      .order('upload_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Documents fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    // Transform tags structure
    const formattedDocuments = documents?.map((doc: any) => ({
      ...doc,
      tags: doc.tags?.map((t: any) => t.tag).filter(Boolean) || [],
    }));

    return NextResponse.json({
      documents: formattedDocuments,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Documents API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Fetch document to verify ownership and get storage path
    const { data: document } = await supabase
      .from('documents')
      .select('storage_path, workspace_id, workspaces!inner(owner_id)')
      .eq('id', documentId)
      .single();

    if (!document || (document as any).workspaces.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Document not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete from storage
    await supabase.storage.from('documents').remove([document.storage_path]);

    // Delete document record (cascades to chunks and tags)
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      console.error('Document deletion error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      );
    }

    // Update workspace stats
    await supabase.rpc('update_workspace_stats', {
      workspace_uuid: document.workspace_id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Document deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
