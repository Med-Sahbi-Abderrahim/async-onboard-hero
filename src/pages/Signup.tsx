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

const signupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  agreeToTerms: z.boolean().refine((val) => val === true, "You must agree to the terms"),
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
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ strength: "", color: "" });

  // Redirect if already logged in
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
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
        if (error.message.includes("already registered")) {
          toast({
            variant: "destructive",
            title: "Email already registered",
            description: (
              <span>
                This email is already in use.{" "}
                <Link to="/login" className="underline font-medium">
                  Log in instead
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

      // Check if email confirmation is required
      if (data.user && !data.session) {
        toast({
          title: "Check your email!",
          description: "We've sent you a confirmation link. Please verify your email to continue.",
        });
      } else {
        // Auto-logged in
        toast({
          title: "Account created!",
          description: "Welcome to Kenly!",
        });
        navigate("/dashboard");
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
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Create your account</h2>
            <p className="text-muted-foreground">Get started with Kenly today</p>
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
