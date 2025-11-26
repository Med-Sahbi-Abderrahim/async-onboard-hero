import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import kenlyLogo from "@/assets/kenly-logo.png";

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const getPasswordStrength = (password: string): { strength: string; color: string } => {
  if (password.length === 0) return { strength: "", color: "" };
  if (password.length < 8) return { strength: "Too short", color: "text-destructive" };
  
  let score = 0;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  if (score <= 1) return { strength: "Weak", color: "text-orange-500" };
  if (score <= 2) return { strength: "Medium", color: "text-yellow-500" };
  return { strength: "Strong", color: "text-green-500" };
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ strength: "", color: "" });
  const [hasValidToken, setHasValidToken] = useState(false);

  useEffect(() => {
    // Check if we have a valid reset token
    const checkToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setHasValidToken(true);
      } else {
        toast({
          variant: "destructive",
          title: "Invalid or expired reset link",
          description: "Please request a new password reset link.",
        });
        navigate("/forgot-password");
      }
    };
    checkToken();
  }, [navigate]);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your password has been reset successfully",
      });

      // Read stored context to determine redirect
      const storedContext = localStorage.getItem('auth_context');
      const storedOrgId = localStorage.getItem('auth_org_id');
      
      console.log("Reset password - stored context:", storedContext, storedOrgId);
      
      if (storedContext === 'client' && storedOrgId) {
        localStorage.removeItem('auth_context');
        localStorage.removeItem('auth_org_id');
        navigate(`/client-portal/${storedOrgId}`, { replace: true });
        return;
      }
      
      if (storedContext === 'agency' && storedOrgId) {
        localStorage.removeItem('auth_context');
        localStorage.removeItem('auth_org_id');
        navigate(`/dashboard/${storedOrgId}`, { replace: true });
        return;
      }
      
      // No stored context - determine based on user's roles
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check if user is an organization member first
        const { data: orgMember } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .limit(1)
          .maybeSingle();
        
        if (orgMember) {
          navigate(`/dashboard/${orgMember.organization_id}`, { replace: true });
          return;
        }
        
        // Otherwise check if user is a client
        const { data: clientData } = await supabase
          .from('clients')
          .select('organization_id')
          .eq('email', user.email)
          .is('deleted_at', null)
          .limit(1)
          .maybeSingle();

        if (clientData) {
          navigate(`/client-portal/${clientData.organization_id}`, { replace: true });
        } else {
          navigate("/login", { replace: true });
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to reset password. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasValidToken) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Gradient */}
      <div className="hidden lg:flex lg:w-1/2 gradient-auth items-center justify-center p-12">
        <div className="max-w-md text-white">
          <h1 className="text-4xl font-bold mb-6">Reset your password</h1>
          <p className="text-lg opacity-90">
            Choose a strong password to keep your account secure.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Kenly Logo */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2">
              <img src={kenlyLogo} alt="Kenly" className="h-12 w-12 object-contain" />
              <span className="text-2xl font-bold">Kenly</span>
            </div>
          </div>
          
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Create new password</h2>
            <p className="text-muted-foreground">
              Enter your new password below
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setPasswordStrength(getPasswordStrength(e.target.value));
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    {passwordStrength.strength && (
                      <p className={`text-sm ${passwordStrength.color}`}>
                        Strength: {passwordStrength.strength}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting password...
                  </>
                ) : (
                  "Reset password"
                )}
              </Button>
            </form>
          </Form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
