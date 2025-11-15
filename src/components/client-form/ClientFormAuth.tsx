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
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if client exists with this email
      const { data: client } = await supabase
        .from("clients")
        .select("*")
        .eq("email", email)
        .eq("organization_id", form.organization_id)
        .is("deleted_at", null)
        .maybeSingle();

      if (!client) {
        toast({
          title: "Not found",
          description: "No client account found with this email. Please contact the organization.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Send magic link to client's email
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/client-intake/${form.slug}`,
        },
      });

      if (magicLinkError) throw magicLinkError;

      setMagicLinkSent(true);
      toast({
        title: "Check your email",
        description: "We've sent you a magic link to access this form.",
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

  if (magicLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          {branding.logo_url && (
            <div className="flex justify-center pt-6">
              <img src={branding.logo_url} alt="Logo" className="h-16 object-contain" />
            </div>
          )}
          <CardHeader>
            <CardTitle>Check Your Email</CardTitle>
            <CardDescription>
              We've sent a magic link to <strong>{email}</strong>. Click the link in your email to access this form.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setMagicLinkSent(false)}
            >
              Try Different Email
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
