import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Zap, ArrowRight, X } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  limitType: "clients" | "storage" | "forms" | "features" | "automation" | "esignature";
  currentPlan: "free" | "starter" | "pro" | "enterprise";
  organizationId: string;
}

const limitMessages = {
  clients: {
    title: "Client Portal Limit Reached",
    description: "You've reached the maximum number of client portals for your plan.",
    free: "Your Free plan includes 1 client portal.",
    starter: "Your Starter plan includes up to 5 client portals.",
    pro: "Upgrade to Enterprise for unlimited portals.",
  },
  storage: {
    title: "Storage Limit Reached",
    description: "You've reached your storage limit and cannot upload more files.",
    free: "Your Free plan includes 1 GB of storage.",
    starter: "Your Starter plan includes 3 GB of storage.",
    pro: "Upgrade to Enterprise for more storage.",
  },
  forms: {
    title: "Form Limit Reached",
    description: "You've reached the maximum number of forms for your plan.",
    free: "Your Free plan includes limited forms.",
    starter: "Your Starter plan includes more forms.",
    pro: "Upgrade to Enterprise for unlimited forms.",
  },
  features: {
    title: "Feature Unavailable",
    description: "This feature is not available on your current plan.",
    free: "Upgrade to unlock premium features.",
    starter: "Upgrade to Pro to unlock all features.",
    pro: "Upgrade to Enterprise for advanced features.",
  },
  automation: {
    title: "Automation Runs Limit Reached",
    description: "You've used all your automation runs for this month.",
    free: "Your Free plan includes 0 automation runs.",
    starter: "Your Starter plan includes limited automation runs.",
    pro: "Your Pro plan includes 500 automation runs per user.",
  },
  esignature: {
    title: "E-signature Limit Reached",
    description: "You've used all your e-signature runs for this month.",
    free: "Your Free plan includes 0 e-signature runs.",
    starter: "Your Starter plan includes limited e-signature runs.",
    pro: "Your Pro plan includes 100 e-signature runs per user.",
  },
};

const upgradePlans = {
  free: { name: "Starter", price: "$29", icon: Zap, features: ["5 client portals", "3 GB storage", "Custom branding", "25 automation runs/user"] },
  starter: { name: "Pro", price: "$49", icon: Crown, features: ["Unlimited portals", "10 GB storage", "White-label", "500 automation runs/user"] },
  pro: { name: "Enterprise", price: "Custom", icon: Crown, features: ["Unlimited everything", "Dedicated support", "Custom integrations"] },
  enterprise: { name: "Enterprise", price: "Custom", icon: Crown, features: ["You're on the highest plan"] },
};

export function UpgradeModal({ open, onOpenChange, limitType, currentPlan, organizationId }: UpgradeModalProps) {
  const { toast } = useToast();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const message = limitMessages[limitType];
  const upgrade = upgradePlans[currentPlan];
  const Icon = upgrade.icon;

  const handleUpgrade = async () => {
    if (currentPlan === "pro" || currentPlan === "enterprise") {
      toast({
        title: "Contact Sales",
        description: "Please contact our sales team for Enterprise upgrades.",
      });
      return;
    }

    setIsUpgrading(true);
    try {
      const plan = currentPlan === "free" ? "starter" : "pro";
      const { data, error } = await supabase.functions.invoke("create-lemon-squeezy-checkout", {
        body: { plan, organizationId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
        toast({
          title: "Opening Checkout",
          description: "Complete your upgrade in the new window.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <DialogTitle className="text-xl">{message.title}</DialogTitle>
              </div>
              <DialogDescription className="text-base">{message.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Current Plan Info */}
          <div className="p-4 bg-muted/50 rounded-lg border">
            <p className="text-sm text-muted-foreground mb-2">Current Plan</p>
            <p className="font-semibold capitalize">{currentPlan} Plan</p>
            <p className="text-sm text-muted-foreground mt-1">
              {message[currentPlan as keyof typeof message]}
            </p>
          </div>

          {/* Upgrade Plan */}
          {currentPlan !== "enterprise" && (
            <div className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-gradient-to-r from-primary to-primary-glow">Recommended</Badge>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-xl font-bold">{upgrade.name} Plan</h4>
                  <p className="text-2xl font-bold text-primary mt-1">
                    {upgrade.price}
                    {upgrade.price !== "Custom" && <span className="text-sm font-normal text-muted-foreground">/month</span>}
                  </p>
                </div>
                <div className="rounded-full bg-primary/10 p-3">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
              </div>
              <ul className="space-y-2">
                {upgrade.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            {currentPlan !== "enterprise" && currentPlan !== "pro" ? (
              <Button onClick={handleUpgrade} disabled={isUpgrading} className="flex-1 bg-gradient-to-r from-primary to-primary-glow">
                {isUpgrading ? "Processing..." : `Upgrade to ${upgrade.name}`}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button variant="outline" onClick={handleUpgrade} className="flex-1">
                Contact Sales
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
