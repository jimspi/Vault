-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Workspaces policies
CREATE POLICY "Users can view own workspaces"
    ON public.workspaces FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can create own workspaces"
    ON public.workspaces FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own workspaces"
    ON public.workspaces FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own workspaces"
    ON public.workspaces FOR DELETE
    USING (auth.uid() = owner_id);

-- Documents policies
CREATE POLICY "Users can view documents in their workspaces"
    ON public.documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.workspaces
            WHERE workspaces.id = documents.workspace_id
            AND workspaces.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create documents in their workspaces"
    ON public.documents FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspaces
            WHERE workspaces.id = workspace_id
            AND workspaces.owner_id = auth.uid()
        )
        AND auth.uid() = user_id
    );

CREATE POLICY "Users can update documents in their workspaces"
    ON public.documents FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.workspaces
            WHERE workspaces.id = documents.workspace_id
            AND workspaces.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete documents in their workspaces"
    ON public.documents FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.workspaces
            WHERE workspaces.id = documents.workspace_id
            AND workspaces.owner_id = auth.uid()
        )
    );

-- Chunks policies (inherit from documents)
CREATE POLICY "Users can view chunks in their documents"
    ON public.chunks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.documents
            JOIN public.workspaces ON workspaces.id = documents.workspace_id
            WHERE documents.id = chunks.document_id
            AND workspaces.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create chunks in their documents"
    ON public.chunks FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.documents
            JOIN public.workspaces ON workspaces.id = documents.workspace_id
            WHERE documents.id = document_id
            AND workspaces.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete chunks in their documents"
    ON public.chunks FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.documents
            JOIN public.workspaces ON workspaces.id = documents.workspace_id
            WHERE documents.id = chunks.document_id
            AND workspaces.owner_id = auth.uid()
        )
    );

-- Memories policies
CREATE POLICY "Users can view memories in their workspaces"
    ON public.memories FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.workspaces
            WHERE workspaces.id = memories.workspace_id
            AND workspaces.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create memories in their workspaces"
    ON public.memories FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspaces
            WHERE workspaces.id = workspace_id
            AND workspaces.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update memories in their workspaces"
    ON public.memories FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.workspaces
            WHERE workspaces.id = memories.workspace_id
            AND workspaces.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete memories in their workspaces"
    ON public.memories FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.workspaces
            WHERE workspaces.id = memories.workspace_id
            AND workspaces.owner_id = auth.uid()
        )
    );

-- Relationships policies
CREATE POLICY "Users can view relationships in their workspaces"
    ON public.relationships FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.workspaces
            WHERE workspaces.id = relationships.workspace_id
            AND workspaces.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create relationships in their workspaces"
    ON public.relationships FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspaces
            WHERE workspaces.id = workspace_id
            AND workspaces.owner_id = auth.uid()
        )
    );

-- Tags policies
CREATE POLICY "Users can view tags in their workspaces"
    ON public.tags FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.workspaces
            WHERE workspaces.id = tags.workspace_id
            AND workspaces.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create tags in their workspaces"
    ON public.tags FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspaces
            WHERE workspaces.id = workspace_id
            AND workspaces.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update tags in their workspaces"
    ON public.tags FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.workspaces
            WHERE workspaces.id = tags.workspace_id
            AND workspaces.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete tags in their workspaces"
    ON public.tags FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.workspaces
            WHERE workspaces.id = tags.workspace_id
            AND workspaces.owner_id = auth.uid()
        )
    );

-- Document tags policies (inherit from tags and documents)
CREATE POLICY "Users can view document tags in their workspaces"
    ON public.document_tags FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.documents
            JOIN public.workspaces ON workspaces.id = documents.workspace_id
            WHERE documents.id = document_tags.document_id
            AND workspaces.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create document tags in their workspaces"
    ON public.document_tags FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.documents
            JOIN public.workspaces ON workspaces.id = documents.workspace_id
            WHERE documents.id = document_id
            AND workspaces.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete document tags in their workspaces"
    ON public.document_tags FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.documents
            JOIN public.workspaces ON workspaces.id = documents.workspace_id
            WHERE documents.id = document_tags.document_id
            AND workspaces.owner_id = auth.uid()
        )
    );

-- Insights policies
CREATE POLICY "Users can view insights in their workspaces"
    ON public.insights FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.workspaces
            WHERE workspaces.id = insights.workspace_id
            AND workspaces.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update insights in their workspaces"
    ON public.insights FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.workspaces
            WHERE workspaces.id = insights.workspace_id
            AND workspaces.owner_id = auth.uid()
        )
    );

-- Collections policies
CREATE POLICY "Users can view collections in their workspaces"
    ON public.collections FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.workspaces
            WHERE workspaces.id = collections.workspace_id
            AND workspaces.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create collections in their workspaces"
    ON public.collections FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspaces
            WHERE workspaces.id = workspace_id
            AND workspaces.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update collections in their workspaces"
    ON public.collections FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.workspaces
            WHERE workspaces.id = collections.workspace_id
            AND workspaces.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete collections in their workspaces"
    ON public.collections FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.workspaces
            WHERE workspaces.id = collections.workspace_id
            AND workspaces.owner_id = auth.uid()
        )
    );

-- Collection documents policies
CREATE POLICY "Users can view collection documents in their workspaces"
    ON public.collection_documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.collections
            JOIN public.workspaces ON workspaces.id = collections.workspace_id
            WHERE collections.id = collection_documents.collection_id
            AND workspaces.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage collection documents in their workspaces"
    ON public.collection_documents FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.collections
            JOIN public.workspaces ON workspaces.id = collections.workspace_id
            WHERE collections.id = collection_documents.collection_id
            AND workspaces.owner_id = auth.uid()
        )
    );

-- Audit logs policies
CREATE POLICY "Users can view own audit logs"
    ON public.audit_logs FOR SELECT
    USING (auth.uid() = user_id);
