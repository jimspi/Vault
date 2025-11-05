-- Create profile_cache table for caching AI-generated profiles
CREATE TABLE IF NOT EXISTS profile_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  profile_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id)
);

-- Add index for faster lookups
CREATE INDEX idx_profile_cache_workspace_id ON profile_cache(workspace_id);
CREATE INDEX idx_profile_cache_updated_at ON profile_cache(updated_at);

-- Enable RLS
ALTER TABLE profile_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own workspace's profile cache
CREATE POLICY "Users can read own workspace profile cache"
  ON profile_cache
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- Policy: Users can insert their own workspace's profile cache
CREATE POLICY "Users can insert own workspace profile cache"
  ON profile_cache
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- Policy: Users can update their own workspace's profile cache
CREATE POLICY "Users can update own workspace profile cache"
  ON profile_cache
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- Policy: Users can delete their own workspace's profile cache
CREATE POLICY "Users can delete own workspace profile cache"
  ON profile_cache
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );
