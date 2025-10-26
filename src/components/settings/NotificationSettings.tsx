import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Bell, Mail, MessageSquare } from 'lucide-react';

interface NotificationPreferences {
  email_notifications: boolean;
  desktop_notifications: boolean;
  weekly_digest: boolean;
  submission_alerts: boolean;
  client_activity: boolean;
  team_mentions: boolean;
}

export function NotificationSettings() {
  const { profile } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_notifications: true,
    desktop_notifications: true,
    weekly_digest: true,
    submission_alerts: true,
    client_activity: true,
    team_mentions: true,
  });

  useEffect(() => {
    if (profile?.preferences) {
      setPreferences({
        ...preferences,
        ...profile.preferences,
      });
      setLoading(false);
    }
  }, [profile]);

  const handleToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ preferences: newPreferences })
        .eq('id', profile?.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Notification preferences updated',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      // Revert on error
      setPreferences(preferences);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Configure how you receive email notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email_notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email notifications for important updates
              </p>
            </div>
            <Switch
              id="email_notifications"
              checked={preferences.email_notifications}
              onCheckedChange={(checked) => handleToggle('email_notifications', checked)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekly_digest">Weekly Digest</Label>
              <p className="text-sm text-muted-foreground">
                Get a weekly summary of your activity
              </p>
            </div>
            <Switch
              id="weekly_digest"
              checked={preferences.weekly_digest}
              onCheckedChange={(checked) => handleToggle('weekly_digest', checked)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="submission_alerts">Submission Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when clients submit forms
              </p>
            </div>
            <Switch
              id="submission_alerts"
              checked={preferences.submission_alerts}
              onCheckedChange={(checked) => handleToggle('submission_alerts', checked)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="client_activity">Client Activity</Label>
              <p className="text-sm text-muted-foreground">
                Notify me about client activity and updates
              </p>
            </div>
            <Switch
              id="client_activity"
              checked={preferences.client_activity}
              onCheckedChange={(checked) => handleToggle('client_activity', checked)}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            In-App Notifications
          </CardTitle>
          <CardDescription>
            Manage browser and desktop notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="desktop_notifications">Desktop Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Show desktop notifications for real-time updates
              </p>
            </div>
            <Switch
              id="desktop_notifications"
              checked={preferences.desktop_notifications}
              onCheckedChange={(checked) => handleToggle('desktop_notifications', checked)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="team_mentions">Team Mentions</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when someone mentions you
              </p>
            </div>
            <Switch
              id="team_mentions"
              checked={preferences.team_mentions}
              onCheckedChange={(checked) => handleToggle('team_mentions', checked)}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
