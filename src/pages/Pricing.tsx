import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    name: "Basic",
    price: "$29",
    period: "per user/month",
    description: "Essential tools for small teams",
    icon: Sparkles,
    iconColor: "text-primary",
    features: [
      { text: "Unlimited clients", included: true },
      { text: "Unlimited team members", included: true },
      { text: "10 GB storage per user", included: true },
      { text: "25 automation runs per user", included: true },
      { text: "10 e-signature runs per user", included: true },
      { text: "Standard Kenly branding (color palette)", included: true },
      { text: '"Powered by Kenly" badge', included: true },
      { text: "Standard email support", included: true },
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "per user/month",
    description: "Advanced features for growing teams",
    icon: Zap,
    iconColor: "text-accent",
    badge: "Recommended",
    features: [
      { text: "Unlimited clients", included: true },
      { text: "Unlimited team members", included: true },
      { text: "100 GB storage per user", included: true },
      { text: "500 automation runs per user", included: true },
      { text: "100 e-signature runs per user", included: true },
      { text: "Custom branding (colors + logo)", included: true },
      { text: 'Remove "Powered by Kenly" badge', included: true },
      { text: "Priority support", included: true },
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "$199",
    period: "per user/month",
    description: "Complete solution for large organizations",
    icon: Crown,
    iconColor: "text-amber-500",
    features: [
      { text: "Unlimited clients", included: true },
      { text: "Unlimited team members", included: true },
      { text: "1 TB storage per user", included: true },
      { text: "Unlimited automation runs", included: true },
      { text: "Unlimited e-signatures", included: true },
      { text: "Full branding removal (no Kenly trace)", included: true },
      { text: "SLA with guaranteed uptime", included: true },
      { text: "Dedicated support channel", included: true },
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { toast } = useToast();

  const handleUpgrade = async (planName: string) => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (planName === "Free") {
      // Find user's first organization
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      
      if (orgMember) {
        navigate(`/dashboard/${orgMember.organization_id}`);
      } else {
        navigate("/");
      }
      return;
    }

    try {
      // Get user's organization
      const { data: membership } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .single();

      if (!membership) {
        throw new Error("No organization found");
      }

      const planMap: Record<string, string> = {
        "Basic": "starter",
        "Pro": "pro",
        "Enterprise": "enterprise"
      };
      
      const plan = planMap[planName] || "starter";

      if (planName === "Enterprise") {
        // For Enterprise, show contact info instead of checkout
        toast({
          title: "Contact Sales",
          description: "Please contact our sales team for Enterprise pricing and setup.",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-lemon-squeezy-checkout", {
        body: { plan, organizationId: membership.organization_id },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-12 md:mb-16 animate-fade-in">
          <Badge className="mb-4 shadow-soft">Simple, transparent pricing</Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Choose your{" "}
            <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Kenly</span>{" "}
            plan
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Simple per-user pricing. Unlimited clients and team members. Scale as you grow.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto mb-12">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.name}
                className={`relative animate-slide-up hover:scale-105 transition-all duration-300 ${
                  plan.highlighted
                    ? "border-primary shadow-strong bg-gradient-to-br from-primary/5 to-accent/5"
                    : "bg-card/80 backdrop-blur-sm"
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-primary to-primary-glow shadow-medium">{plan.badge}</Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8 pt-8">
                  <div className="rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Icon className={`h-8 w-8 ${plan.iconColor}`} />
                  </div>
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <CardDescription className="text-sm mb-4">{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground ml-2">/ {plan.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature.text} className="flex items-start gap-3">
                        <Check
                          className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                            feature.included ? "text-primary" : "text-muted-foreground/30"
                          }`}
                        />
                        <span
                          className={`text-sm ${
                            feature.included ? "text-foreground" : "text-muted-foreground/50 line-through"
                          }`}
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleUpgrade(plan.name)}
                    size="lg"
                    className={`w-full ${
                      plan.highlighted
                        ? "bg-gradient-to-r from-primary to-primary-glow shadow-medium hover:shadow-strong"
                        : ""
                    }`}
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ or Additional Info */}
        <div className="text-center max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <Card className="bg-card/80 backdrop-blur-sm border-primary/10">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold mb-4">Need help choosing?</h3>
              <p className="text-muted-foreground mb-6">
                All plans include unlimited clients, unlimited team members, and essential collaboration tools. 
                Your monthly cost is calculated as: <strong>number of active users × price per user</strong>.
              </p>
              <Button asChild variant="ghost">
                <button onClick={async () => {
                  if (user) {
                    const { data: orgMember } = await supabase
                      .from('organization_members')
                      .select('organization_id')
                      .eq('user_id', user.id)
                      .limit(1)
                      .maybeSingle();
                    
                    if (orgMember) {
                      navigate(`/dashboard/${orgMember.organization_id}`);
                    } else {
                      navigate("/");
                    }
                  } else {
                    navigate("/");
                  }
                }}>Go to Dashboard</button>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
