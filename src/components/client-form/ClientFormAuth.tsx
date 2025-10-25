import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ClientFormAuthProps {
  form: any;
  onAuthenticated: (client: any, submission?: any) => void;
}

export function ClientFormAuth({ form, onAuthenticated }: ClientFormAuthProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if client exists
      let { data: client, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("email", email)
        .eq("organization_id", form.organization_id)
        .single();

      // Create client if doesn't exist
      if (clientError || !client) {
        const { data: newClient, error: createError } = await supabase
          .from("clients")
          .insert({
            email,
            organization_id: form.organization_id,
            status: "active",
          })
          .select()
          .single();

        if (createError) throw createError;
        client = newClient;
      }

      // Check for existing draft submission
      const { data: existingSubmission } = await supabase
        .from("form_submissions")
        .select("*")
        .eq("intake_form_id", form.id)
        .eq("client_id", client.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      onAuthenticated(client, existingSubmission);

      toast({
        title: "Access granted",
        description: "You can now fill out the form.",
      });
    } catch (error: any) {
      console.error("Auth error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to authenticate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const branding = form.custom_branding || {};
  const primaryColor = branding.primary_color || "#4F46E5";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        {branding.logo_url && (
          <div className="flex justify-center pt-6">
            <img src={branding.logo_url} alt="Logo" className="h-16 object-contain" />
          </div>
        )}
        <CardHeader>
          <CardTitle>{form.title}</CardTitle>
          <CardDescription>
            {form.description || "Please enter your email to access this form."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              style={{ backgroundColor: primaryColor }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Continue to Form"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
