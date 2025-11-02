import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out Async",
    icon: Sparkles,
    iconColor: "text-gray-500",
    features: [
      { text: "1 active client portal", included: true },
      { text: "1 GB file storage", included: true },
      { text: "Basic email notifications", included: true },
      { text: "Async branding required", included: true },
      { text: "Custom branding", included: false },
      { text: "Workflow automations", included: false },
      { text: "Integrations", included: false },
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Starter",
    price: "$29",
    period: "per month",
    description: "For growing businesses",
    icon: Zap,
    iconColor: "text-primary",
    features: [
      { text: "Up to 5 client portals", included: true },
      { text: "3 GB file storage", included: true },
      { text: "Custom branding (logo + colors)", included: true },
      { text: "Files, contracts, meetings & feedback", included: true },
      { text: "Basic email notifications", included: true },
      { text: "Async footer branding", included: true },
      { text: "Workflow automations", included: false },
    ],
    cta: "Upgrade to Starter",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "per month",
    description: "For teams that want it all",
    icon: Crown,
    iconColor: "text-accent",
    badge: "Recommended",
    features: [
      { text: "Unlimited client portals", included: true },
      { text: "10 GB file storage", included: true },
      { text: "Full custom branding", included: true },
      { text: "Workflow automations", included: true },
      { text: "Integrations (Google Drive, Notion)", included: true },
      { text: "Priority email support", included: true },
      { text: "Remove Async branding (white-label)", included: true },
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-12 md:mb-16 animate-fade-in">
          <Badge className="mb-4 shadow-soft">Simple, transparent pricing</Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Choose your <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Async</span> plan
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Start free, upgrade as you grow. No hidden fees, cancel anytime.
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
                    <Badge className="bg-gradient-to-r from-primary to-primary-glow shadow-medium">
                      {plan.badge}
                    </Badge>
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
                    asChild
                    size="lg"
                    className={`w-full ${
                      plan.highlighted
                        ? "bg-gradient-to-r from-primary to-primary-glow shadow-medium hover:shadow-strong"
                        : ""
                    }`}
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    <Link to="/billing">{plan.cta}</Link>
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
                All plans include secure client portals, form submissions, and essential collaboration tools.
                Start with Free and upgrade anytime as your needs grow.
              </p>
              <Button asChild variant="ghost">
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
