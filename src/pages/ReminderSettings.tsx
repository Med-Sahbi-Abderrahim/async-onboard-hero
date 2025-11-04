import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, CheckCircle, XCircle, AlertCircle, Send } from "lucide-react";

export default function ReminderSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [forms, setForms] = useState<any[]>([]);
  const [testEmail, setTestEmail] = useState("");
  const [testResults, setTestResults] = useState<{
    resendConfigured: boolean | null;
    lastReminderRun: any;
    totalReminders: number;
    recentLogs: any[];
  }>({
    resendConfigured: null,
    lastReminderRun: null,
    totalReminders: 0,
    recentLogs: [],
  });
  const { toast } = useToast();

  useEffect(() => {
    loadForms();
    loadTestResults();
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

  const loadTestResults = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .single();

      if (!membership) return;

      // Get recent reminder logs
      const { data: logs, error: logsError } = await supabase
        .from("reminder_logs")
        .select("*")
        .eq("organization_id", membership.organization_id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (logsError) throw logsError;

      // Count total reminders
      const { count } = await supabase
        .from("reminder_logs")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", membership.organization_id);

      setTestResults({
        resendConfigured: logs && logs.length > 0,
        lastReminderRun: logs && logs.length > 0 ? logs[0] : null,
        totalReminders: count || 0,
        recentLogs: logs || [],
      });
    } catch (error: any) {
      console.error("Error loading test results:", error);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail || !testEmail.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Create a test submission to trigger confirmation email
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: membership } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .single();

      if (!membership) throw new Error("No organization found");

      // Get first form with confirmation enabled
      const testForm = forms.find(f => f.confirmation_email_enabled);
      if (!testForm) {
        toast({
          title: "No Form Available",
          description: "Please enable confirmation emails on at least one form first",
          variant: "destructive",
        });
        return;
      }

      // Create test client
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({
          organization_id: membership.organization_id,
          email: testEmail,
          full_name: "Test User",
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // Create test submission
      const { data: submission, error: submissionError } = await supabase
        .from("form_submissions")
        .insert({
          organization_id: membership.organization_id,
          intake_form_id: testForm.id,
          client_id: client.id,
          status: "completed",
          completion_percentage: 100,
          submitted_at: new Date().toISOString(),
          responses: { test: "Test submission" },
        })
        .select()
        .single();

      if (submissionError) throw submissionError;

      // Send confirmation email
      const { data, error } = await supabase.functions.invoke('send-submission-confirmation', {
        body: { submissionId: submission.id }
      });

      if (error) throw error;

      // Clean up test data
      await supabase.from("form_submissions").delete().eq("id", submission.id);
      await supabase.from("clients").delete().eq("id", client.id);

      toast({
        title: "Test Email Sent!",
        description: `Check ${testEmail} for the confirmation email`,
      });

      // Reload test results
      loadTestResults();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send test email",
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

      {/* Test & Diagnostics Section */}
      <Card className="mt-8 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <CardTitle>Email Integration Test & Diagnostics</CardTitle>
          </div>
          <CardDescription>
            Verify your Resend configuration and test email delivery
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Overview */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  {testResults.resendConfigured ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : testResults.resendConfigured === false ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">Resend Status</p>
                    <p className="text-xs text-muted-foreground">
                      {testResults.resendConfigured ? "Configured" : "Not tested"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Total Emails Sent</p>
                    <p className="text-xs text-muted-foreground">
                      {testResults.totalReminders} emails
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  {testResults.lastReminderRun?.email_status === "sent" ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">Last Email</p>
                    <p className="text-xs text-muted-foreground">
                      {testResults.lastReminderRun 
                        ? new Date(testResults.lastReminderRun.created_at).toLocaleString()
                        : "Never"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Send Test Email */}
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Send Test Email</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Send a test confirmation email to verify your Resend integration is working correctly
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="max-w-sm"
              />
              <Button onClick={sendTestEmail} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Test
                  </>
                )}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Recent Email Logs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Recent Email Logs</h4>
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadTestResults}
              >
                Refresh
              </Button>
            </div>
            <div className="space-y-2">
              {testResults.recentLogs.length > 0 ? (
                testResults.recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {log.email_status === "sent" ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium capitalize">{log.reminder_type.replace(/_/g, " ")}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={log.email_status === "sent" ? "default" : "destructive"}>
                      {log.email_status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No email logs yet. Send a test email to get started.</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Reminder Trigger */}
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
                loadTestResults();
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
