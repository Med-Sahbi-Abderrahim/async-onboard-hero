import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Mail, Users } from 'lucide-react';
import kenlyLogo from '@/assets/kenly-logo.png';

export default function NoOrganization() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <img src={kenlyLogo} alt="Kenly" className="h-12 w-12 object-contain" />
            <span className="text-2xl font-bold">Kenly</span>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Welcome to Kenly!</CardTitle>
            <CardDescription>
              Your account has been created successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                To start using Kenly, you need to be invited to an organization.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Mail className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium mb-1">Check Your Email</h4>
                  <p className="text-sm text-muted-foreground">
                    If your team has invited you, check your email for an invitation link.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Users className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium mb-1">Contact Your Administrator</h4>
                  <p className="text-sm text-muted-foreground">
                    Ask your team administrator to send you an invitation to join their organization.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <Button onClick={handleSignOut} variant="outline" className="w-full">
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
