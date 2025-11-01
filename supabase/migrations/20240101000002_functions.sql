-- Function to create a profile after user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    );

    -- Create a default workspace
    INSERT INTO public.workspaces (owner_id, name, description)
    VALUES (
        NEW.id,
        'My Vault',
        'Your personal knowledge vault'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function for semantic search using cosine similarity
CREATE OR REPLACE FUNCTION public.match_chunks(
    query_embedding vector(768),
    match_threshold float,
    match_count int,
    filter_workspace_id uuid
)
RETURNS TABLE (
    id uuid,
    document_id uuid,
    content text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        chunks.id,
        chunks.document_id,
        chunks.content,
        1 - (chunks.embedding <=> query_embedding) as similarity
    FROM public.chunks
    JOIN public.documents ON documents.id = chunks.document_id
    WHERE documents.workspace_id = filter_workspace_id
        AND 1 - (chunks.embedding <=> query_embedding) > match_threshold
    ORDER BY chunks.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function for semantic search in memories
CREATE OR REPLACE FUNCTION public.match_memories(
    query_embedding vector(768),
    match_threshold float,
    match_count int,
    filter_workspace_id uuid
)
RETURNS TABLE (
    id uuid,
    content text,
    confidence float,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        memories.id,
        memories.content,
        memories.confidence,
        1 - (memories.embedding <=> query_embedding) as similarity
    FROM public.memories
    WHERE memories.workspace_id = filter_workspace_id
        AND 1 - (memories.embedding <=> query_embedding) > match_threshold
    ORDER BY memories.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function to update workspace statistics
CREATE OR REPLACE FUNCTION public.update_workspace_stats(workspace_uuid uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.workspaces
    SET
        document_count = (
            SELECT COUNT(*) FROM public.documents
            WHERE workspace_id = workspace_uuid AND status = 'ready'
        ),
        total_size_bytes = (
            SELECT COALESCE(SUM(file_size), 0) FROM public.documents
            WHERE workspace_id = workspace_uuid AND status = 'ready'
        ),
        updated_at = NOW()
    WHERE id = workspace_uuid;
END;
$$;

-- Function to calculate workspace health score
CREATE OR REPLACE FUNCTION public.calculate_health_score(workspace_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    health_score integer := 0;
    doc_count integer;
    recent_docs integer;
    tagged_docs integer;
    total_docs integer;
BEGIN
    -- Get total documents
    SELECT COUNT(*) INTO total_docs
    FROM public.documents
    WHERE workspace_id = workspace_uuid AND status = 'ready';

    IF total_docs = 0 THEN
        RETURN 0;
    END IF;

    -- Base score for having documents (30 points)
    health_score := LEAST(30, total_docs * 3);

    -- Score for recent activity (30 points)
    SELECT COUNT(*) INTO recent_docs
    FROM public.documents
    WHERE workspace_id = workspace_uuid
        AND status = 'ready'
        AND upload_date > NOW() - INTERVAL '30 days';

    health_score := health_score + LEAST(30, (recent_docs::float / total_docs * 100)::integer);

    -- Score for tagged documents (20 points)
    SELECT COUNT(DISTINCT document_id) INTO tagged_docs
    FROM public.document_tags dt
    JOIN public.documents d ON d.id = dt.document_id
    WHERE d.workspace_id = workspace_uuid AND d.status = 'ready';

    health_score := health_score + LEAST(20, (tagged_docs::float / total_docs * 100)::integer);

    -- Score for having memories (20 points)
    SELECT COUNT(*) INTO doc_count
    FROM public.memories
    WHERE workspace_id = workspace_uuid;

    health_score := health_score + LEAST(20, doc_count * 2);

    RETURN LEAST(100, health_score);
END;
$$;

-- Function to update relevance scores based on time decay
CREATE OR REPLACE FUNCTION public.update_memory_relevance()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.memories
    SET relevance_score = GREATEST(
        0.1,
        1.0 * EXP(
            -0.1 * EXTRACT(EPOCH FROM (NOW() - last_accessed)) / (24 * 3600)
        )
    );
END;
$$;

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit(
    p_user_id uuid,
    p_workspace_id uuid,
    p_action text,
    p_resource_type text,
    p_resource_id uuid,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.audit_logs (
        user_id,
        workspace_id,
        action,
        resource_type,
        resource_id,
        metadata
    ) VALUES (
        p_user_id,
        p_workspace_id,
        p_action,
        p_resource_type,
        p_resource_id,
        p_metadata
    );
END;
$$;

-- Function to get document with full details
CREATE OR REPLACE FUNCTION public.get_document_details(document_uuid uuid)
RETURNS TABLE (
    id uuid,
    title text,
    file_name text,
    file_type text,
    file_size bigint,
    content text,
    status document_status,
    upload_date timestamptz,
    tags jsonb,
    chunk_count bigint,
    related_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.title,
        d.file_name,
        d.file_type,
        d.file_size,
        d.content,
        d.status,
        d.upload_date,
        COALESCE(
            json_agg(
                json_build_object('id', t.id, 'name', t.name, 'color', t.color)
            ) FILTER (WHERE t.id IS NOT NULL),
            '[]'::json
        )::jsonb as tags,
        (SELECT COUNT(*) FROM public.chunks WHERE document_id = d.id) as chunk_count,
        (SELECT COUNT(*) FROM public.relationships WHERE source_id = d.id OR target_id = d.id) as related_count
    FROM public.documents d
    LEFT JOIN public.document_tags dt ON dt.document_id = d.id
    LEFT JOIN public.tags t ON t.id = dt.tag_id
    WHERE d.id = document_uuid
    GROUP BY d.id;
END;
$$;

-- Create a function to clean up old audit logs (optional, for maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs(days_to_keep integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM public.audit_logs
    WHERE created_at < NOW() - (days_to_keep || ' days')::interval;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;
