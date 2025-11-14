import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/session';
import { generateEmbedding } from '@/lib/embeddings';
import { answerQuestion } from '@/lib/claude/client';
import { askSchema } from '@/lib/validations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = askSchema.parse(body);

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
    const queryEmbedding = await generateEmbedding(validatedData.question);

    // Find relevant chunks
    const { data: chunks } = await supabase.rpc('match_chunks', {
      query_embedding: queryEmbedding as any,
      match_threshold: 0.7,
      match_count: 5,
      filter_workspace_id: validatedData.workspaceId,
    });

    if (!chunks || chunks.length === 0) {
      return NextResponse.json({
        answer: "I couldn't find relevant information in your documents to answer this question.",
        sources: [],
        confidence: 0,
      });
    }

    // Get document details
    const documentIds = [...new Set(chunks.map((c: any) => c.document_id))];
    const { data: documents } = await supabase
      .from('documents')
      .select('id, title, file_name')
      .in('id', documentIds);

    const documentsMap = new Map(documents?.map((d) => [d.id, d]));

    // Prepare context for Claude
    const context = chunks.map((chunk: any) => {
      const doc = documentsMap.get(chunk.document_id);
      return {
        content: chunk.content,
        source: doc?.title || doc?.file_name || 'Unknown',
      };
    });

    // Get answer from Claude
    const aiResponse = await answerQuestion(validatedData.question, context);

    // Format sources
    const sources = chunks.slice(0, 3).map((chunk: any) => {
      const doc = documentsMap.get(chunk.document_id);
      return {
        documentId: chunk.document_id,
        title: doc?.title || doc?.file_name || 'Unknown',
        excerpt: chunk.content.slice(0, 200),
        relevance: chunk.similarity,
      };
    });

    return NextResponse.json({
      answer: aiResponse.answer,
      sources,
      confidence: aiResponse.confidence,
    });
  } catch (error) {
    console.error('Ask error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
