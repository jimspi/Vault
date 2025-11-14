import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/session';
import { extractContent, isSupportedFileType, sanitizeFilename } from '@/lib/processing/documents';
import { generateEmbedding } from '@/lib/embeddings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
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

    // Process document synchronously
    try {
      // Extract text content
      const { text, metadata } = await extractContent(fileBuffer, file.type);

      if (!text || text.trim().length === 0) {
        throw new Error('No text content extracted from document');
      }

      // Update document with extracted content and mark as ready
      await supabase
        .from('documents')
        .update({
          content: text.slice(0, 50000), // Limit content size to avoid DB issues
          metadata: metadata as any,
          status: 'ready',
          processed_at: new Date().toISOString(),
        })
        .eq('id', document.id);

      // Generate embedding for first chunk asynchronously (don't wait)
      const firstChunk = text.slice(0, 1000);
      generateEmbedding(firstChunk)
        .then((embedding) => {
          return supabase.from('chunks').insert({
            document_id: document.id,
            content: firstChunk,
            embedding: embedding as any,
            position: 0,
          });
        })
        .catch((err) => {
          console.error('Background embedding error:', err);
        });

      return NextResponse.json({
        documentId: document.id,
        status: 'ready',
        message: 'Document uploaded and processed successfully',
      });
    } catch (processingError) {
      console.error(`Error processing document ${document.id}:`, processingError);

      // Mark document as failed
      await supabase
        .from('documents')
        .update({
          status: 'failed',
          metadata: { error: String(processingError) } as any,
        })
        .eq('id', document.id);

      return NextResponse.json({
        documentId: document.id,
        status: 'failed',
        message: 'Document uploaded but processing failed',
        error: processingError instanceof Error ? processingError.message : 'Processing error',
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
