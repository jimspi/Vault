'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface UserSettings {
  id: string;
  user_id: string;
  timezone: string;
  email_notifications: boolean;
  in_app_notifications: boolean;
  auto_recommendations_enabled: boolean;
  last_auto_recommendation_at: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export default function NotificationSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch current settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/user-settings');
      if (!response.ok) throw new Error('Failed to fetch settings');

      const data = await response.json();
      setSettings(data.settings);
    } catch (error) {
      console.error('[NotificationSettings] Failed to fetch:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notification settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (field: string, value: boolean) => {
    setUpdating(field);

    try {
      const response = await fetch('/api/user-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) throw new Error('Failed to update setting');

      const data = await response.json();
      setSettings(data.settings);

      toast({
        title: 'Updated',
        description: `Notification preference updated successfully`,
      });
    } catch (error) {
      console.error('[NotificationSettings] Failed to update:', error);
      toast({
        title: 'Error',
        description: 'Failed to update setting',
        variant: 'destructive',
      });
      // Revert the change on error
      fetchSettings();
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>Manage how you receive updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5" />
          <CardTitle>Notifications</CardTitle>
        </div>
        <CardDescription>Manage how you receive updates</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Notifications */}
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-1">
            <Label htmlFor="email-notifications" className="text-base font-medium cursor-pointer">
              Email Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive notification emails for new recommendations and insights
            </p>
          </div>
          <Switch
            id="email-notifications"
            checked={settings?.email_notifications ?? true}
            onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
            disabled={updating === 'email_notifications'}
          />
        </div>

        {/* In-App Notifications */}
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-1">
            <Label htmlFor="in-app-notifications" className="text-base font-medium cursor-pointer">
              In-App Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Show notification bell icon with alerts for new activity
            </p>
          </div>
          <Switch
            id="in-app-notifications"
            checked={settings?.in_app_notifications ?? true}
            onCheckedChange={(checked) => updateSetting('in_app_notifications', checked)}
            disabled={updating === 'in_app_notifications'}
          />
        </div>

        {/* Auto Recommendations */}
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-1">
            <Label
              htmlFor="auto-recommendations"
              className="text-base font-medium cursor-pointer"
            >
              Auto-Generate Recommendations
            </Label>
            <p className="text-sm text-muted-foreground">
              Automatically generate personalized recommendations 3 times daily (8am, 2pm, 8pm MST)
            </p>
          </div>
          <Switch
            id="auto-recommendations"
            checked={settings?.auto_recommendations_enabled ?? true}
            onCheckedChange={(checked) =>
              updateSetting('auto_recommendations_enabled', checked)
            }
            disabled={updating === 'auto_recommendations_enabled'}
          />
        </div>

        {/* Status message */}
        {settings?.last_auto_recommendation_at && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Last auto-recommendation:{' '}
              {new Date(settings.last_auto_recommendation_at).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
