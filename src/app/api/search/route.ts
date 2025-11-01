import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/session';
import { generateEmbedding } from '@/lib/embeddings';
import { searchSchema } from '@/lib/validations';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = searchSchema.parse(body);

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

    // Generate query embedding
    const queryEmbedding = await generateEmbedding(validatedData.query);

    // Semantic search using pgvector
    const { data: results, error: searchError } = await supabase.rpc(
      'match_chunks',
      {
        query_embedding: queryEmbedding as any,
        match_threshold: validatedData.threshold || 0.7,
        match_count: validatedData.limit || 10,
        filter_workspace_id: validatedData.workspaceId,
      }
    );

    if (searchError) {
      console.error('Search error:', searchError);
      return NextResponse.json(
        { error: 'Search failed' },
        { status: 500 }
      );
    }

    // Fetch document details for results
    const documentIds = [...new Set(results?.map((r: any) => r.document_id))];

    const { data: documents } = await supabase
      .from('documents')
      .select('id, title, file_name, upload_date')
      .in('id', documentIds);

    const documentsMap = new Map(documents?.map((d) => [d.id, d]));

    // Format results
    const formattedResults = results?.map((result: any) => {
      const doc = documentsMap.get(result.document_id);
      return {
        id: result.id,
        documentId: result.document_id,
        content: result.content,
        similarity: result.similarity,
        document: doc
          ? {
              id: doc.id,
              title: doc.title,
              fileName: doc.file_name,
              uploadDate: doc.upload_date,
            }
          : null,
      };
    });

    return NextResponse.json({
      results: formattedResults,
      total: formattedResults?.length || 0,
      query: validatedData.query,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
