import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function ReminderSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [forms, setForms] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .single();

      if (!membership) return;

      const { data, error } = await supabase
        .from("intake_forms")
        .select("*")
        .eq("organization_id", membership.organization_id)
        .is("deleted_at", null);

      if (error) throw error;
      setForms(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFormSettings = async (formId: string, updates: any) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("intake_forms")
        .update(updates)
        .eq("id", formId);

      if (error) throw error;

      setForms(forms.map(f => 
        f.id === formId ? { ...f, ...updates } : f
      ));

      toast({
        title: "Success",
        description: "Reminder settings updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Reminder Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure automated reminders and confirmations for your forms
        </p>
      </div>

      <div className="space-y-6">
        {forms.map((form) => (
          <Card key={form.id}>
            <CardHeader>
              <CardTitle>{form.title}</CardTitle>
              <CardDescription>
                Configure reminder settings for this form
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor={`reminder-${form.id}`}>Enable Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Send reminders to clients who haven't completed the form
                  </p>
                </div>
                <Switch
                  id={`reminder-${form.id}`}
                  checked={form.reminder_enabled}
                  onCheckedChange={(checked) =>
                    updateFormSettings(form.id, { reminder_enabled: checked })
                  }
                  disabled={saving}
                />
              </div>

              {form.reminder_enabled && (
                <div className="space-y-2">
                  <Label htmlFor={`delay-${form.id}`}>
                    Reminder Delay (hours)
                  </Label>
                  <Input
                    id={`delay-${form.id}`}
                    type="number"
                    min="1"
                    max="168"
                    value={form.reminder_delay_hours}
                    onChange={(e) =>
                      updateFormSettings(form.id, {
                        reminder_delay_hours: parseInt(e.target.value),
                      })
                    }
                    disabled={saving}
                  />
                  <p className="text-sm text-muted-foreground">
                    Send reminders after this many hours of inactivity
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor={`confirmation-${form.id}`}>
                    Enable Confirmation Emails
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Send a confirmation email when the form is submitted
                  </p>
                </div>
                <Switch
                  id={`confirmation-${form.id}`}
                  checked={form.confirmation_email_enabled}
                  onCheckedChange={(checked) =>
                    updateFormSettings(form.id, {
                      confirmation_email_enabled: checked,
                    })
                  }
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>
        ))}

        {forms.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No forms found. Create a form to configure reminder settings.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Manual Reminder Trigger</CardTitle>
          <CardDescription>
            Manually trigger the reminder job to send reminders to clients with incomplete forms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={async () => {
              setSaving(true);
              try {
                const { data, error } = await supabase.functions.invoke('send-form-reminder');
                if (error) throw error;
                toast({
                  title: "Success",
                  description: `Reminder job completed. ${data?.successful || 0} reminders sent.`,
                });
              } catch (error: any) {
                toast({
                  title: "Error",
                  description: error.message,
                  variant: "destructive",
                });
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Reminders Now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
