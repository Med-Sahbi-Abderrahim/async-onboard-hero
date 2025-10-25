import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

interface ClientFormSuccessProps {
  form: any;
}

export function ClientFormSuccess({ form }: ClientFormSuccessProps) {
  const branding = form.custom_branding || {};
  const settings = form.settings || {};
  const successMessage = settings.success_message || "Thank you for your submission!";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        {branding.logo_url && (
          <div className="flex justify-center pt-6">
            <img src={branding.logo_url} alt="Logo" className="h-16 object-contain" />
          </div>
        )}
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle>Submission Complete!</CardTitle>
          <CardDescription>{successMessage}</CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          <p>We've received your information and will be in touch soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
