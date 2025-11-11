-- Create recommendations table for actionable AI recommendations
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Recommendation content
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- networking, learning, productivity, health, etc.

  -- Actionable items
  action_items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of action steps
  resources JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {title, url, description}

  -- Context
  reasoning TEXT, -- Why this recommendation was made
  priority TEXT DEFAULT 'medium', -- low, medium, high, urgent

  -- Status tracking
  status TEXT DEFAULT 'new', -- new, in_progress, completed, dismissed

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for faster queries
CREATE INDEX idx_recommendations_workspace_id ON recommendations(workspace_id);
CREATE INDEX idx_recommendations_status ON recommendations(status);
CREATE INDEX idx_recommendations_category ON recommendations(category);
CREATE INDEX idx_recommendations_priority ON recommendations(priority);
CREATE INDEX idx_recommendations_created_at ON recommendations(created_at DESC);

-- Enable RLS
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own workspace's recommendations
CREATE POLICY "Users can read own workspace recommendations"
  ON recommendations
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- Policy: Users can insert their own workspace's recommendations
CREATE POLICY "Users can insert own workspace recommendations"
  ON recommendations
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- Policy: Users can update their own workspace's recommendations
CREATE POLICY "Users can update own workspace recommendations"
  ON recommendations
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- Policy: Users can delete their own workspace's recommendations
CREATE POLICY "Users can delete own workspace recommendations"
  ON recommendations
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_recommendations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER recommendations_updated_at
  BEFORE UPDATE ON recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_recommendations_updated_at();
