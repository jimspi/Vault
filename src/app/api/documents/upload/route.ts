import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/session';
import { extractContent, isSupportedFileType, sanitizeFilename } from '@/lib/processing/documents';
import { generateEmbedding, chunkText } from '@/lib/embeddings';
import { extractKeyInformation } from '@/lib/claude/client';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const workspaceId = formData.get('workspaceId') as string;

    if (!file || !workspaceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!isSupportedFileType(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
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

    // Upload file to storage
    const sanitizedName = sanitizeFilename(file.name);
    const storagePath = `${user.id}/${workspaceId}/${Date.now()}-${sanitizedName}`;

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Create document record
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        workspace_id: workspaceId,
        user_id: user.id,
        title: file.name.replace(/\.[^/.]+$/, ''),
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: storagePath,
        status: 'processing',
      })
      .select()
      .single();

    if (docError) {
      console.error('Document creation error:', docError);
      // Clean up uploaded file
      await supabase.storage.from('documents').remove([storagePath]);
      return NextResponse.json(
        { error: 'Failed to create document record' },
        { status: 500 }
      );
    }

    // Process document asynchronously
    processDocumentAsync(document.id, fileBuffer, file.type, workspaceId);

    return NextResponse.json({
      documentId: document.id,
      status: 'processing',
      message: 'Document upload successful. Processing in background.',
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processDocumentAsync(
  documentId: string,
  fileBuffer: Buffer,
  mimeType: string,
  workspaceId: string
) {
  const supabase = createClient();

  try {
    // Extract text content
    const { text, metadata } = await extractContent(fileBuffer, mimeType);

    // Update document with extracted content
    await supabase
      .from('documents')
      .update({
        content: text,
        metadata: metadata as any,
      })
      .eq('id', documentId);

    // Generate chunks
    const chunks = chunkText(text, { chunkSize: 512, overlap: 50 });

    // Generate embeddings and store chunks
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await generateEmbedding(chunk);

      await supabase.from('chunks').insert({
        document_id: documentId,
        content: chunk,
        embedding: embedding as any,
        position: i,
      });
    }

    // Extract key information using Claude
    const aiExtraction = await extractKeyInformation(text);

    // Create tags
    for (const tagName of aiExtraction.tags) {
      // Find or create tag
      const { data: existingTag } = await supabase
        .from('tags')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('name', tagName)
        .single();

      let tagId = existingTag?.id;

      if (!tagId) {
        const { data: newTag } = await supabase
          .from('tags')
          .insert({
            workspace_id: workspaceId,
            name: tagName,
            auto_generated: true,
          })
          .select('id')
          .single();

        tagId = newTag?.id;
      }

      if (tagId) {
        await supabase.from('document_tags').insert({
          document_id: documentId,
          tag_id: tagId,
        });
      }
    }

    // Store memories
    for (const memory of aiExtraction.memories) {
      const memoryEmbedding = await generateEmbedding(memory.content);

      await supabase.from('memories').insert({
        workspace_id: workspaceId,
        content: memory.content,
        embedding: memoryEmbedding as any,
        confidence: memory.confidence,
        sources: [{ documentId, type: 'extraction' }],
        metadata: memory.metadata as any,
      });
    }

    // Mark document as ready
    await supabase
      .from('documents')
      .update({
        status: 'ready',
        processed_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    // Update workspace stats
    await supabase.rpc('update_workspace_stats', {
      workspace_uuid: workspaceId,
    });

    console.log(`Document ${documentId} processed successfully`);
  } catch (error) {
    console.error(`Error processing document ${documentId}:`, error);

    // Mark document as failed
    await supabase
      .from('documents')
      .update({
        status: 'failed',
        metadata: { error: String(error) } as any,
      })
      .eq('id', documentId);
  }
}
