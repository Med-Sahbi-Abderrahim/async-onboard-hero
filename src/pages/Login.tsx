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

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Read and store context from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const context = params.get('context');
    const orgId = params.get('orgId');
    
    if (context) {
      localStorage.setItem('auth_context', context);
      console.log('Stored auth context:', context);
    }
    if (orgId) {
      localStorage.setItem('auth_org_id', orgId);
      console.log('Stored auth orgId:', orgId);
    }
    
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      if (session) {
        // User is already logged in - redirect based on context
        const storedContext = localStorage.getItem('auth_context');
        const storedOrgId = localStorage.getItem('auth_org_id');
        
        if (storedContext === 'client' && storedOrgId) {
          navigate(`/client-portal/${storedOrgId}`);
        } else if (storedContext === 'agency' && storedOrgId) {
          navigate(`/dashboard/${storedOrgId}`);
        } else {
          // No context - find user's first organization
          const { data: orgMember } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', session.user.id)
            .limit(1)
            .maybeSingle();
          
          if (orgMember) {
            navigate(`/dashboard/${orgMember.organization_id}`);
          } else {
            // Check if user is a client
            const { data: clientData } = await supabase
              .from('clients')
              .select('organization_id')
              .eq('email', session.user.email)
              .limit(1)
              .maybeSingle();
            
            if (clientData) {
              navigate(`/client-portal/${clientData.organization_id}`);
            }
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

      // Read stored context to determine redirect
      const storedContext = localStorage.getItem('auth_context');
      const storedOrgId = localStorage.getItem('auth_org_id');
      
      if (storedContext === 'client' && storedOrgId) {
        navigate(`/client-portal/${storedOrgId}`);
      } else if (storedContext === 'agency' && storedOrgId) {
        navigate(`/dashboard/${storedOrgId}`);
      } else {
        // No context - find user's first organization
        const { data: orgMember } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', data.user.id)
          .limit(1)
          .maybeSingle();
        
        if (orgMember) {
          navigate(`/dashboard/${orgMember.organization_id}`);
        } else {
          // Check if user is only a client
          const { data: clientData } = await supabase
            .from('clients')
            .select('organization_id')
            .eq('email', data.user.email)
            .limit(1)
            .maybeSingle();
          
          if (clientData) {
            navigate(`/client-portal/${clientData.organization_id}`);
          } else {
            // User has no organization or client record - shouldn't happen
            navigate("/");
          }
        }
      }
      
      // Clear stored context after use
      localStorage.removeItem('auth_context');
      localStorage.removeItem('auth_org_id');
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

  return (
    <div className="flex min-h-screen">
      {/* Left side - Gradient */}
      <div className="hidden lg:flex lg:w-1/2 gradient-auth items-center justify-center p-12">
        <div className="max-w-md text-white">
          <h1 className="text-4xl font-bold mb-6">Welcome back to Kenly</h1>
          <p className="text-lg opacity-90">
            Continue streamlining your client onboarding process with our AI-powered platform.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Log in to your account</h2>
            <p className="text-muted-foreground">Enter your credentials to continue</p>
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

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
