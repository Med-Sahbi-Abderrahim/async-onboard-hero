import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface UserStatus {
  status: "early_access" | "free_trial" | "active" | "suspended";
  plan: "free" | "starter" | "pro" | "enterprise";
  early_access_end_date?: string;
  trial_end_date?: string;
}

export function EarlyAccessBanner() {
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("users")
        .select("status, plan, early_access_end_date, trial_end_date")
        .eq("id", user.id)
        .single();

      if (error || !data) return;

      setUserStatus(data as UserStatus);

      // Calculate days remaining
      if (data.status === "early_access" && data.early_access_end_date) {
        const endDate = new Date(data.early_access_end_date);
        const today = new Date();
        const days = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
        setDaysRemaining(days);
      } else if (data.status === "free_trial" && data.trial_end_date) {
        const endDate = new Date(data.trial_end_date);
        const today = new Date();
        const days = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
        setDaysRemaining(days);
      }
    };

    fetchUserStatus();
  }, []);

  if (!userStatus || (userStatus.status !== "early_access" && userStatus.status !== "free_trial")) {
    return null;
  }

  return (
    <Alert className="mb-6 border-primary/50 bg-primary/5">
      {userStatus.status === "early_access" ? (
        <>
          <Sparkles className="h-5 w-5 text-primary" />
          <AlertTitle className="font-semibold">Early Access - {userStatus.plan.charAt(0).toUpperCase() + userStatus.plan.slice(1)} Plan</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              You're enjoying early access to our {userStatus.plan.charAt(0).toUpperCase() + userStatus.plan.slice(1)} features!{" "}
              <strong>{daysRemaining} days</strong> remaining until your 14-day Pro Trial begins.
            </span>
          </AlertDescription>
        </>
      ) : (
        <>
          <AlertCircle className="h-5 w-5 text-primary" />
          <AlertTitle className="font-semibold">Free Trial - {userStatus.plan.charAt(0).toUpperCase() + userStatus.plan.slice(1)} Plan</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              Your free trial is active!{" "}
              <strong>{daysRemaining} days</strong> remaining.
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/billing")}
            >
              Upgrade Now
            </Button>
          </AlertDescription>
        </>
      )}
    </Alert>
  );
}
