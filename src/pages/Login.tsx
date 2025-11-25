import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2, Users, UserCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import kenlyLogo from "@/assets/kenly-logo.png";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type AuthContext = 'client' | 'agency' | null;

interface OrgData {
  name: string;
  logo_url: string | null;
  brand_color: string | null;
}

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authContext, setAuthContext] = useState<AuthContext>(null);
  const [orgData, setOrgData] = useState<OrgData | null>(null);

  // Read and store context from URL params, fetch org data
  useEffect(() => {
    const context = searchParams.get('context') as AuthContext;
    const orgId = searchParams.get('orgId');
    
    if (context) {
      setAuthContext(context);
      localStorage.setItem('auth_context', context);
      console.log('Stored auth context:', context);
    }
    if (orgId) {
      localStorage.setItem('auth_org_id', orgId);
      console.log('Stored auth orgId:', orgId);
      
      // Fetch organization data for branding
      const fetchOrgData = async () => {
        const { data } = await supabase
          .from('organizations')
          .select('name, logo_url, brand_color')
          .eq('id', orgId)
          .single();
        
        if (data) {
          setOrgData(data);
        }
      };
      fetchOrgData();
    }
    
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      if (session) {
        // User is already logged in - check organization count
        const { data: memberships } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', session.user.id);

        if (memberships && memberships.length > 0) {
          if (memberships.length === 1) {
            navigate(`/dashboard/${memberships[0].organization_id}`);
          } else {
            // Multiple orgs - always show selection
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

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;

      // Update last_seen_at
      if (data.user) {
        await supabase.from("users").update({ last_seen_at: new Date().toISOString() }).eq("id", data.user.id);
      }

      toast({
        title: "Welcome back!",
        description: "Successfully logged in",
      });

      // Clear any stored context
      localStorage.removeItem('auth_context');
      localStorage.removeItem('auth_org_id');
      
      // Check organizations - always use current org count as source of truth
      const { data: memberships } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', data.user.id);

      if (memberships && memberships.length > 0) {
        if (memberships.length === 1) {
          // User has only one org - redirect directly
          navigate(`/dashboard/${memberships[0].organization_id}`);
        } else {
          // User has multiple orgs - always show selector
          navigate('/select-organization');
        }
      } else {
        // Check if user is a client
        const { data: clientData } = await supabase
          .from('clients')
          .select('organization_id')
          .eq('user_id', data.user.id)
          .is('deleted_at', null);
        
        if (clientData && clientData.length > 0) {
          if (clientData.length === 1) {
            navigate(`/client-portal/${clientData[0].organization_id}`);
          } else {
            navigate('/client-dashboard');
          }
        } else {
          // User has no organization access
          navigate('/no-organization');
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Invalid email or password",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Determine UI based on context
  const isClientLogin = authContext === 'client';
  const isAgencyLogin = authContext === 'agency';

  return (
    <div className="flex min-h-screen">
      {/* Left side - Context-aware gradient */}
      <div className={`hidden lg:flex lg:w-1/2 ${isClientLogin ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'gradient-auth'} items-center justify-center p-12`}>
        <div className="max-w-md text-white">
          {isClientLogin ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <UserCircle className="h-12 w-12" />
                <h1 className="text-4xl font-bold">Client Portal</h1>
              </div>
              <p className="text-lg opacity-90">
                Access your secure client portal to view project status, upload documents, and collaborate with your team.
              </p>
              {orgData && (
                <div className="mt-8 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                  <p className="text-sm opacity-75 mb-1">Logging in to</p>
                  <p className="font-semibold text-lg">{orgData.name}</p>
                </div>
              )}
            </>
          ) : isAgencyLogin ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <Users className="h-12 w-12" />
                <h1 className="text-4xl font-bold">Agency Dashboard</h1>
              </div>
              <p className="text-lg opacity-90">
                Continue managing your client relationships and streamlining your onboarding process.
              </p>
              {orgData && (
                <div className="mt-8 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                  <p className="text-sm opacity-75 mb-1">Team workspace</p>
                  <p className="font-semibold text-lg">{orgData.name}</p>
                </div>
              )}
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold mb-6">Welcome back to Kenly</h1>
              <p className="text-lg opacity-90">
                Continue streamlining your client onboarding process with our AI-powered platform.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo - Organization or Kenly default */}
          <div className="flex justify-center mb-6">
            {orgData?.logo_url ? (
              <img src={orgData.logo_url} alt={orgData.name} className="h-16 object-contain" />
            ) : (
              <div className="flex items-center gap-2">
                <img src={kenlyLogo} alt="Kenly" className="h-12 w-12 object-contain" />
                <span className="text-2xl font-bold">Kenly</span>
              </div>
            )}
          </div>
          
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              {isClientLogin ? 'Log in to Your Portal' : isAgencyLogin ? 'Log in to Your Dashboard' : 'Log in to your account'}
            </h2>
            <p className="text-muted-foreground">
              {isClientLogin && orgData
                ? `Access your ${orgData.name} client portal`
                : isAgencyLogin && orgData
                ? `Continue to ${orgData.name} workspace`
                : 'Enter your credentials to continue'}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between">
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="text-sm font-normal cursor-pointer">Remember me</FormLabel>
                    </FormItem>
                  )}
                />

                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Log in"
                )}
              </Button>
            </form>
          </Form>

          {isClientLogin ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              First time here? Check your email for your invitation link with access instructions.
            </p>
          ) : (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
