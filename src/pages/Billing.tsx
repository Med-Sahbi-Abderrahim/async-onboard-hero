import { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, HardDrive, Sparkles, Zap, Crown, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface Organization {
  id: string;
  plan: "free" | "starter" | "pro";
  max_portals: number;
  max_storage_gb: number;
  storage_used_bytes: number;
  subscription_status?: string;
  subscription_renewal_date?: string;
  lemonsqueezy_subscription_id?: string;
  features: {
    custom_branding: boolean;
    automations: boolean;
    integrations: boolean;
    white_label: boolean;
    priority_support: boolean;
  };
}

export default function Billing() {
  const { user } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [clientCount, setClientCount] = useState(0);

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
        .select("id, plan, max_portals, max_storage_gb, storage_used_bytes, features, subscription_status, subscription_renewal_date, lemonsqueezy_subscription_id")
        .eq("id", membership.organization_id)
        .single();

      if (error) throw error;
      setOrganization(org as Organization);

      // Get client count
      const { count } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", membership.organization_id)
        .is("deleted_at", null);

      setClientCount(count || 0);
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

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case "free":
        return <Sparkles className="h-5 w-5 text-muted-foreground" />;
      case "starter":
        return <Zap className="h-5 w-5 text-primary" />;
      case "pro":
        return <Crown className="h-5 w-5 text-accent" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };

  const getPlanName = (plan: string) => {
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  const getPlanPrice = (plan: string) => {
    switch (plan) {
      case "free":
        return "$0";
      case "starter":
        return "$29";
      case "pro":
        return "$49";
      default:
        return "$0";
    }
  };

  const handleUpgrade = async () => {
    try {
      const plan = organization?.plan === 'free' ? 'starter' : 'pro';
      
      const { data, error } = await supabase.functions.invoke('create-lemon-squeezy-checkout', {
        body: { plan, organizationId: organization?.id }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
    }
  };

  const handleManageBilling = () => {
    // Open Lemon Squeezy customer portal
    const customerPortalUrl = `https://app.lemonsqueezy.com/my-orders`;
    window.open(customerPortalUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">No billing information available.</p>
      </div>
    );
  }

  const storageUsedGB = organization.storage_used_bytes / (1024 * 1024 * 1024);
  const storagePercentage = (storageUsedGB / organization.max_storage_gb) * 100;
  const clientPercentage = organization.max_portals === 999999 
    ? 0 
    : (clientCount / organization.max_portals) * 100;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Billing & Usage</h2>
          <p className="text-muted-foreground mt-2">Manage your plan and track usage limits</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/pricing">
            View All Plans <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Current Plan Card */}
      <Card className="overflow-hidden animate-slide-up bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-3">
                {getPlanIcon(organization.plan)}
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {getPlanName(organization.plan)} Plan
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  {getPlanPrice(organization.plan)} / month
                  {organization.subscription_status && organization.subscription_status !== 'active' && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      {organization.subscription_status}
                    </Badge>
                  )}
                </CardDescription>
                {organization.subscription_renewal_date && organization.subscription_status === 'active' && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Renews on {new Date(organization.subscription_renewal_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {organization.plan !== "pro" && (
                <Button onClick={handleUpgrade} className="shadow-medium">
                  Upgrade Plan
                </Button>
              )}
              {organization.lemonsqueezy_subscription_id && (
                <Button onClick={handleManageBilling} variant="outline">
                  Manage Billing
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Usage Stats */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Client Portals Usage */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-medium">Client Portals</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {clientCount} / {organization.max_portals === 999999 ? "∞" : organization.max_portals}
                </span>
              </div>
              {organization.max_portals !== 999999 && (
                <Progress value={clientPercentage} className="h-2" />
              )}
            </div>

            {/* Storage Usage */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-primary" />
                  <span className="font-medium">File Storage</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {storageUsedGB.toFixed(2)} GB / {organization.max_storage_gb} GB
                </span>
              </div>
              <Progress value={storagePercentage} className="h-2" />
            </div>
          </div>

          {/* Features List */}
          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-3">Plan Features</h4>
            <div className="grid md:grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-sm">
                {organization.features.custom_branding ? (
                  <Badge variant="outline" className="bg-primary/10">Custom Branding</Badge>
                ) : (
                  <span className="text-muted-foreground">Custom Branding</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                {organization.features.automations ? (
                  <Badge variant="outline" className="bg-primary/10">Automations</Badge>
                ) : (
                  <span className="text-muted-foreground">Automations</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                {organization.features.integrations ? (
                  <Badge variant="outline" className="bg-primary/10">Integrations</Badge>
                ) : (
                  <span className="text-muted-foreground">Integrations</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                {organization.features.white_label ? (
                  <Badge variant="outline" className="bg-primary/10">White Label</Badge>
                ) : (
                  <span className="text-muted-foreground">White Label</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                {organization.features.priority_support ? (
                  <Badge variant="outline" className="bg-primary/10">Priority Support</Badge>
                ) : (
                  <span className="text-muted-foreground">Priority Support</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning Cards */}
      {clientCount >= organization.max_portals && organization.max_portals !== 999999 && (
        <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <CardHeader>
            <CardTitle className="text-base text-amber-700 dark:text-amber-400">
              Client Portal Limit Reached
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              You've reached the maximum number of client portals for your plan. Upgrade to add more clients.
            </p>
            <Button onClick={handleUpgrade} variant="outline" size="sm">
              Upgrade Now
            </Button>
          </CardContent>
        </Card>
      )}

      {storagePercentage > 80 && (
        <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <CardHeader>
            <CardTitle className="text-base text-amber-700 dark:text-amber-400">
              Storage Almost Full
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              You've used {storagePercentage.toFixed(0)}% of your storage. Consider upgrading to get more space.
            </p>
            <Button onClick={handleUpgrade} variant="outline" size="sm">
              Upgrade Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payment Integration Info */}
      {!organization.lemonsqueezy_subscription_id && (
        <Card className="border-primary/20 bg-card/80 backdrop-blur-sm animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <CardHeader>
            <CardTitle className="text-base">🍋 Secure Payments with Lemon Squeezy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Ready to upgrade? Click "Upgrade Plan" to securely checkout via Lemon Squeezy. 
              You'll be able to manage your subscription, update payment methods, and access invoices anytime.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
