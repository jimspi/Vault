-- Create notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Notification content
  type TEXT NOT NULL, -- 'recommendation', 'insight', 'system'
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Links and actions
  link TEXT, -- URL to navigate to when clicked
  action_text TEXT, -- Text for action button

  -- Related entities
  related_id UUID, -- ID of related recommendation, insight, etc.

  -- Status
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_settings table for user preferences
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Timezone preferences
  timezone TEXT DEFAULT 'America/Denver', -- User's timezone

  -- Notification preferences
  email_notifications BOOLEAN DEFAULT TRUE,
  in_app_notifications BOOLEAN DEFAULT TRUE,

  -- Auto-recommendations preferences
  auto_recommendations_enabled BOOLEAN DEFAULT TRUE,
  last_auto_recommendation_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_workspace_id ON notifications(workspace_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Notifications RLS Policies
CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications"
  ON notifications
  FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (true); -- Allow service role to insert

-- User Settings RLS Policies
CREATE POLICY "Users can read own settings"
  ON user_settings
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own settings"
  ON user_settings
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings"
  ON user_settings
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_settings
CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();
