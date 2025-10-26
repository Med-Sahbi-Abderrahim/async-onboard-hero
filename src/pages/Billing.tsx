import { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, Calendar, CheckCircle2, Crown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface BillingInfo {
  subscription_tier: string;
  subscription_status: string;
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

export default function Billing() {
  const { user } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [processingUpgrade, setProcessingUpgrade] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBillingInfo();
    }
  }, [user]);

  const fetchBillingInfo = async () => {
    try {
      const { data: membership } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user?.id)
        .single();

      if (!membership) return;

      const { data: org, error } = await supabase
        .from("organizations")
        .select("subscription_tier, subscription_status, trial_ends_at, stripe_customer_id, stripe_subscription_id")
        .eq("id", membership.organization_id)
        .single();

      if (error) throw error;
      setBillingInfo(org);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setProcessingUpgrade(true);
    try {
      // Placeholder for Stripe Checkout integration
      toast({
        title: "Stripe Integration Required",
        description: "This would redirect to Stripe Checkout for plan upgrade.",
      });
      
      // TODO: Integrate with Stripe
      // const { data } = await supabase.functions.invoke('create-checkout-session', {
      //   body: { priceId: 'price_xxx', successUrl: window.location.origin + '/billing?success=true' }
      // });
      // window.location.href = data.url;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingUpgrade(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      // Placeholder for Stripe Customer Portal integration
      toast({
        title: "Stripe Integration Required",
        description: "This would redirect to Stripe Customer Portal to manage subscription.",
      });
      
      // TODO: Integrate with Stripe
      // const { data } = await supabase.functions.invoke('create-portal-session', {
      //   body: { returnUrl: window.location.href }
      // });
      // window.location.href = data.url;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getPlanColor = (tier: string) => {
    switch (tier) {
      case 'pro':
        return 'bg-gradient-to-r from-purple-500 to-indigo-600';
      case 'enterprise':
        return 'bg-gradient-to-r from-amber-500 to-orange-600';
      default:
        return 'bg-gradient-to-r from-slate-500 to-slate-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-500">Trial</Badge>;
      case 'past_due':
        return <Badge variant="destructive">Past Due</Badge>;
      case 'canceled':
        return <Badge variant="secondary">Canceled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!billingInfo) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">No billing information available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Billing & Subscription</h2>
        <p className="text-muted-foreground mt-2">Manage your subscription and billing details</p>
      </div>

      {/* Current Plan Card */}
      <Card className="overflow-hidden">
        <div className={`h-2 ${getPlanColor(billingInfo.subscription_tier)}`} />
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Current Plan: {billingInfo.subscription_tier.charAt(0).toUpperCase() + billingInfo.subscription_tier.slice(1)}
              </CardTitle>
              <CardDescription className="mt-2">
                {getStatusBadge(billingInfo.subscription_status)}
              </CardDescription>
            </div>
            {billingInfo.subscription_tier !== 'enterprise' && (
              <Button onClick={handleUpgrade} disabled={processingUpgrade}>
                {processingUpgrade && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upgrade Plan
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {billingInfo.trial_ends_at && billingInfo.subscription_status === 'trialing' && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-sm">Trial Period</p>
                <p className="text-sm text-muted-foreground">
                  Ends {formatDistanceToNow(new Date(billingInfo.trial_ends_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          )}

          {billingInfo.stripe_customer_id && (
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium text-sm">Payment Method</p>
                <p className="text-sm text-muted-foreground">
                  Connected to Stripe
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleManageBilling}>
                Manage
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Features */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Free</CardTitle>
            <div className="text-3xl font-bold">$0</div>
            <CardDescription>per month</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Up to 3 forms
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                50 submissions/month
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Basic support
              </li>
            </ul>
            {billingInfo.subscription_tier === 'free' && (
              <Badge className="mt-4 w-full justify-center" variant="outline">Current Plan</Badge>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Pro</CardTitle>
            <div className="text-3xl font-bold">$29</div>
            <CardDescription>per month</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Unlimited forms
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Unlimited submissions
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Priority support
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Custom branding
              </li>
            </ul>
            {billingInfo.subscription_tier === 'pro' ? (
              <Badge className="mt-4 w-full justify-center" variant="outline">Current Plan</Badge>
            ) : (
              <Button className="mt-4 w-full" onClick={handleUpgrade} disabled={processingUpgrade}>
                {processingUpgrade ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Upgrade to Pro
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Enterprise</CardTitle>
            <div className="text-3xl font-bold">Custom</div>
            <CardDescription>Contact us</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Everything in Pro
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Dedicated support
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Custom integrations
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                SLA guarantee
              </li>
            </ul>
            {billingInfo.subscription_tier === 'enterprise' ? (
              <Badge className="mt-4 w-full justify-center" variant="outline">Current Plan</Badge>
            ) : (
              <Button className="mt-4 w-full" variant="outline">
                Contact Sales
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Billing Integration Note */}
      <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="text-base">Stripe Integration Required</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            To enable full payment processing, you need to enable the Stripe integration. 
            This will allow you to accept payments, manage subscriptions, and access the billing portal.
          </p>
          <Button variant="outline" className="mt-4" disabled>
            Enable Stripe Integration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
