import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { getAuthRedirectUrl } from "@/lib/auth-utils";
import kenlyLogo from "@/assets/kenly-logo.png";

const signupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
  agreeToTerms: z.boolean().refine((val) => val === true, "You must agree to the terms"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

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

export default function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ strength: "", color: "" });
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  // Check for invite code in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("invite");
    if (code) {
      setInviteCode(code);
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      if (session) {
        // Check organizations
        const { data: memberships } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', session.user.id)
          .is('deleted_at', null);

        if (memberships && memberships.length > 0) {
          if (memberships.length === 1) {
            navigate(`/dashboard/${memberships[0].organization_id}`);
          } else {
            navigate('/select-organization');
          }
        } else {
          // Check if user is a client
          const { data: clientData } = await supabase
            .from('clients')
            .select('organization_id')
            .eq('user_id', session.user.id)
            .is('deleted_at', null);
          
          if (clientData && clientData.length > 0) {
            if (clientData.length === 1) {
              navigate(`/client-portal/${clientData[0].organization_id}`);
            } else {
              navigate('/client-dashboard');
            }
          } else {
            navigate('/no-organization');
          }
        }
      }
    };
    checkUser();
  }, [navigate]);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
  });

  const onSubmit = async (values: SignupFormValues) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: getAuthRedirectUrl("/auth/callback"),
          data: {
            full_name: values.fullName,
          },
        },
      });

      if (error) {
        // Handle specific errors
        if (error.message.includes("already registered") || error.message.includes("User already registered")) {
          toast({
            variant: "destructive",
            title: "This email address is already registered",
            description: (
              <span>
                Please{" "}
                <Link to="/login" className="underline font-medium">
                  log in instead
                </Link>
              </span>
            ),
          });
        } else if (error.message.includes("Invalid email")) {
          toast({
            variant: "destructive",
            title: "Invalid email format",
            description: "Please enter a valid email address (e.g., user@example.com)",
          });
        } else if (error.message.includes("Password")) {
          toast({
            variant: "destructive",
            title: "Password too weak",
            description: "Password must be at least 8 characters and include numbers and symbols",
          });
        } else {
          throw error;
        }
        return;
      }

      // Check if user already exists (when Supabase doesn't throw error but sends confirmation)
      if (data.user && !data.session && data.user.identities && data.user.identities.length === 0) {
        toast({
          variant: "destructive",
          title: "This email address is already registered",
          description: (
            <span>
              Please{" "}
              <Link to="/login" className="underline font-medium">
                log in instead
              </Link>
            </span>
          ),
        });
        return;
      }

      // If invite code exists, use it
      if (inviteCode && data.user) {
        const { data: inviteResult, error: inviteError } = await supabase.rpc(
          "use_early_access_invite",
          { invite_code: inviteCode }
        );

        if (inviteError) {
          toast({
            variant: "destructive",
            title: "Invalid invite code",
            description: inviteError.message,
          });
        } else {
          toast({
            title: "Early access activated!",
            description: "You now have 30 days of Pro plan access.",
          });
        }
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        toast({
          title: "Check your email!",
          description: "We've sent you a confirmation link. Please verify your email to continue.",
        });
      } else if (data.session) {
        // Auto-logged in - check for organization access
        // Check if user has organization memberships
        const { data: memberships } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', data.session.user.id)
          .is('deleted_at', null);

        if (memberships && memberships.length > 0) {
          toast({
            title: "Account created!",
            description: inviteCode ? "Welcome! Your early access has been activated." : "Welcome to Kenly!",
          });
          if (memberships.length === 1) {
            navigate(`/dashboard/${memberships[0].organization_id}`);
          } else {
            navigate('/select-organization');
          }
        } else {
          // Check if user is a client
          const { data: clientData } = await supabase
            .from('clients')
            .select('organization_id')
            .eq('user_id', data.session.user.id)
            .is('deleted_at', null)
            .limit(1)
            .maybeSingle();
          
          if (clientData) {
            toast({
              title: "Account created!",
              description: "Welcome to your client portal!",
            });
            navigate(`/client-portal/${clientData.organization_id}`);
          } else {
            // User has no organization access
            navigate('/no-organization');
          }
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error.message || "An error occurred during signup",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Gradient */}
      <div className="hidden lg:flex lg:w-1/2 gradient-auth items-center justify-center p-12">
        <div className="max-w-md text-white">
          <h1 className="text-4xl font-bold mb-6">Welcome to Kenly</h1>
          <p className="text-lg opacity-90">
            AI-Powered Client Onboarding for modern agencies. Stop chasing clients and start working faster.
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
            <h2 className="text-3xl font-bold text-foreground mb-2">Create your account</h2>
            <p className="text-muted-foreground">
              {inviteCode ? "🎉 You have an early access invite! Sign up to get 30 days of Pro." : "Get started with Kenly today"}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
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
                      <p className={`text-sm ${passwordStrength.color}`}>Strength: {passwordStrength.strength}</p>
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

              <FormField
                control={form.control}
                name="agreeToTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">
                        I agree to the Terms of Service and Privacy Policy
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading || !form.formState.isValid}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Sign up"
                )}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    const { error } = await supabase.auth.signInWithOAuth({
                      provider: 'google',
                      options: {
                        redirectTo: getAuthRedirectUrl("/auth/callback"),
                      },
                    });
                    if (error) {
                      toast({
                        variant: "destructive",
                        title: "Error",
                        description: error.message,
                      });
                    }
                  }}
                  disabled={isLoading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    const { error } = await supabase.auth.signInWithOAuth({
                      provider: 'apple',
                      options: {
                        redirectTo: getAuthRedirectUrl("/auth/callback"),
                      },
                    });
                    if (error) {
                      toast({
                        variant: "destructive",
                        title: "Error",
                        description: error.message,
                      });
                    }
                  }}
                  disabled={isLoading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  Apple
                </Button>
              </div>
            </form>
          </Form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
