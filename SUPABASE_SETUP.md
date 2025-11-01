# Exact Supabase Setup Instructions

Follow these step-by-step instructions to set up Supabase for your Vault deployment.

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"New Project"**
3. Sign in with GitHub (recommended)
4. Click **"New organization"** if you don't have one
5. Click **"New project"**
6. Fill in:
   - **Name**: `vault-production` (or your choice)
   - **Database Password**: Generate a strong password and **SAVE IT**
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine for MVP
7. Click **"Create new project"**
8. Wait 2-3 minutes for project creation

---

## Step 2: Get Your API Keys

1. In your Supabase project, go to **Settings** (gear icon in sidebar)
2. Click **API** in the left menu
3. Copy these values (you'll need them later):
   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   anon public key: eyJhbGc...
   service_role key: eyJhbGc... (click "Reveal" to see it)
   ```

**IMPORTANT**: Save these in a safe place. You'll add them to Vercel later.

---

## Step 3: Enable pgvector Extension

1. In your Supabase project, click **SQL Editor** in the sidebar
2. Click **"+ New query"**
3. Paste this SQL and click **"Run"**:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify it's enabled
SELECT * FROM pg_extension WHERE extname = 'vector';
```

You should see a result showing the vector extension is installed.

---

## Step 4: Run Database Migrations

### Migration 1: Initial Schema

1. In **SQL Editor**, click **"+ New query"**
2. Paste the entire contents below and click **"Run"**:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
CREATE TYPE document_status AS ENUM ('uploading', 'processing', 'ready', 'failed');
CREATE TYPE insight_status AS ENUM ('new', 'viewed', 'dismissed', 'archived');
CREATE TYPE insight_type AS ENUM ('pattern', 'contradiction', 'suggestion', 'reminder', 'trend');
CREATE TYPE relationship_type AS ENUM ('semantic', 'citation', 'temporal', 'entity');

-- Users table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspaces table
CREATE TABLE public.workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{
        "privacy": "private",
        "retention_days": null,
        "auto_tag": true,
        "auto_insights": true,
        "embedding_model": "all-MiniLM-L6-v2"
    }'::jsonb,
    health_score INTEGER DEFAULT 0,
    document_count INTEGER DEFAULT 0,
    total_size_bytes BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    content TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    status document_status DEFAULT 'uploading',
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    last_accessed TIMESTAMPTZ,
    access_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document chunks table for vector storage
CREATE TABLE public.chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(768),
    position INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memories table (extracted key information)
CREATE TABLE public.memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(768),
    confidence FLOAT DEFAULT 0.0,
    sources JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed TIMESTAMPTZ DEFAULT NOW(),
    access_count INTEGER DEFAULT 0,
    relevance_score FLOAT DEFAULT 1.0
);

-- Relationships table
CREATE TABLE public.relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    source_id UUID NOT NULL,
    target_id UUID NOT NULL,
    source_type TEXT NOT NULL,
    target_type TEXT NOT NULL,
    relationship_type relationship_type NOT NULL,
    strength FLOAT DEFAULT 0.5,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags table
CREATE TABLE public.tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    auto_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, name)
);

-- Document tags junction table
CREATE TABLE public.document_tags (
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (document_id, tag_id)
);

-- Insights table (AI-generated suggestions)
CREATE TABLE public.insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    type insight_type NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    related_documents JSONB DEFAULT '[]'::jsonb,
    status insight_status DEFAULT 'new',
    priority INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    viewed_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ
);

-- Collections table (smart collections)
CREATE TABLE public.collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    auto_generated BOOLEAN DEFAULT false,
    query JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collection documents junction table
CREATE TABLE public.collection_documents (
    collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (collection_id, document_id)
);

-- Audit logs table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_documents_workspace ON public.documents(workspace_id);
CREATE INDEX idx_documents_user ON public.documents(user_id);
CREATE INDEX idx_documents_status ON public.documents(status);
CREATE INDEX idx_documents_upload_date ON public.documents(upload_date DESC);
CREATE INDEX idx_chunks_document ON public.chunks(document_id);
CREATE INDEX idx_chunks_embedding ON public.chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_memories_workspace ON public.memories(workspace_id);
CREATE INDEX idx_memories_embedding ON public.memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_relationships_workspace ON public.relationships(workspace_id);
CREATE INDEX idx_relationships_source ON public.relationships(source_id);
CREATE INDEX idx_relationships_target ON public.relationships(target_id);
CREATE INDEX idx_tags_workspace ON public.tags(workspace_id);
CREATE INDEX idx_insights_workspace ON public.insights(workspace_id);
CREATE INDEX idx_insights_status ON public.insights(status);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_workspace ON public.audit_logs(workspace_id);

-- Full-text search indexes
CREATE INDEX idx_documents_content_fts ON public.documents USING gin(to_tsvector('english', content));
CREATE INDEX idx_documents_title_trgm ON public.documents USING gin(title gin_trgm_ops);
CREATE INDEX idx_chunks_content_fts ON public.chunks USING gin(to_tsvector('english', content));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON public.workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON public.collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**WAIT** for this to complete (should take 5-10 seconds). You should see "Success. No rows returned".

---

### Migration 2: Row Level Security (RLS) Policies

1. Click **"+ New query"** again
2. Paste this SQL and click **"Run"**:

```sql
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

-- Chunks policies
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

-- Document tags policies
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
```

You should see "Success. No rows returned".

---

### Migration 3: Database Functions

1. Click **"+ New query"** again
2. Paste this SQL and click **"Run"**:

```sql
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
    SELECT COUNT(*) INTO total_docs
    FROM public.documents
    WHERE workspace_id = workspace_uuid AND status = 'ready';

    IF total_docs = 0 THEN
        RETURN 0;
    END IF;

    health_score := LEAST(30, total_docs * 3);

    SELECT COUNT(*) INTO recent_docs
    FROM public.documents
    WHERE workspace_id = workspace_uuid
        AND status = 'ready'
        AND upload_date > NOW() - INTERVAL '30 days';

    health_score := health_score + LEAST(30, (recent_docs::float / total_docs * 100)::integer);

    SELECT COUNT(DISTINCT document_id) INTO tagged_docs
    FROM public.document_tags dt
    JOIN public.documents d ON d.id = dt.document_id
    WHERE d.workspace_id = workspace_uuid AND d.status = 'ready';

    health_score := health_score + LEAST(20, (tagged_docs::float / total_docs * 100)::integer);

    SELECT COUNT(*) INTO doc_count
    FROM public.memories
    WHERE workspace_id = workspace_uuid;

    health_score := health_score + LEAST(20, doc_count * 2);

    RETURN LEAST(100, health_score);
END;
$$;
```

You should see "Success. No rows returned".

---

## Step 5: Create Storage Bucket

1. In Supabase, click **Storage** in the sidebar
2. Click **"Create a new bucket"**
3. Fill in:
   - **Name**: `documents`
   - **Public bucket**: Toggle **OFF** (keep it private)
   - **File size limit**: `10 MB`
   - **Allowed MIME types**: Leave empty for now
4. Click **"Create bucket"**

---

## Step 6: Configure Storage Policies

1. Click on the **documents** bucket you just created
2. Click **"Policies"** tab
3. Click **"New policy"**
4. Select **"For full customization"**
5. Create a policy for **INSERT**:

```sql
CREATE POLICY "Users can upload to own workspace"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

6. Click **"Review"** then **"Save policy"**

7. Create another policy for **SELECT**:

```sql
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

8. Create another policy for **DELETE**:

```sql
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## Step 7: Configure Authentication

1. Click **Authentication** in the sidebar
2. Click **"Providers"**
3. Make sure **Email** is enabled (it should be by default)
4. Optional: Enable **Google** or **GitHub** OAuth if you want

---

## Step 8: Verify Setup

Run this query in SQL Editor to verify everything is set up:

```sql
-- Check tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check pgvector extension
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check storage bucket
SELECT * FROM storage.buckets WHERE name = 'documents';
```

You should see:
- 12 tables in public schema
- pgvector extension enabled
- documents bucket created

---

## ✅ Supabase Setup Complete!

Your Supabase project is now ready. You have:
- ✅ 12 database tables created
- ✅ Row-level security enabled
- ✅ Vector search functions
- ✅ Storage bucket configured
- ✅ Authentication enabled

**Next**: Save your API keys for Vercel deployment!

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

---

## Troubleshooting

**Error: "extension vector does not exist"**
- Run: `CREATE EXTENSION IF NOT EXISTS vector;`

**Error: "permission denied"**
- Make sure you're logged in as project owner
- Check that RLS policies are correct

**Tables not showing up**
- Refresh the Table Editor page
- Check SQL Editor for error messages

**Storage upload fails**
- Verify storage policies are created
- Check bucket name is exactly "documents"
