import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Checking for status transitions...");

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // 1. Check for Early Access users ending in 3 days
    const { data: earlyAccessUsers } = await supabase
      .from("users")
      .select("id, email, full_name, early_access_end_date")
      .eq("status", "early_access")
      .gte("early_access_end_date", now.toISOString())
      .lte("early_access_end_date", threeDaysFromNow.toISOString());

    if (earlyAccessUsers && earlyAccessUsers.length > 0) {
      console.log(`Found ${earlyAccessUsers.length} users to remind about early access ending`);
      
      for (const user of earlyAccessUsers) {
        await supabase.functions.invoke("send-status-emails", {
          body: {
            type: "early_access_reminder",
            userId: user.id,
          },
        });
      }
    }

    // 2. Check for Trial users ending in 24-48 hours
    const { data: trialEndingUsers } = await supabase
      .from("users")
      .select("id, email, full_name, trial_end_date")
      .eq("status", "free_trial")
      .gte("trial_end_date", now.toISOString())
      .lte("trial_end_date", fortyEightHoursFromNow.toISOString());

    if (trialEndingUsers && trialEndingUsers.length > 0) {
      console.log(`Found ${trialEndingUsers.length} users with trial ending soon`);
      
      for (const user of trialEndingUsers) {
        await supabase.functions.invoke("send-status-emails", {
          body: {
            type: "trial_ending",
            userId: user.id,
          },
        });
      }
    }

    // 3. Check for Trial users whose trial has expired
    const { data: expiredTrialUsers } = await supabase
      .from("users")
      .select("id, email, full_name, trial_end_date")
      .eq("status", "free_trial")
      .lt("trial_end_date", now.toISOString());

    if (expiredTrialUsers && expiredTrialUsers.length > 0) {
      console.log(`Found ${expiredTrialUsers.length} users with expired trials`);
      
      for (const user of expiredTrialUsers) {
        // Update user status to active with free plan
        await supabase
          .from("users")
          .update({
            status: "active",
            plan: "free",
          })
          .eq("id", user.id);

        // Update their organization to free plan
        await supabase
          .from("organizations")
          .update({
            plan: "free",
            max_portals: 1,
            max_storage_gb: 1,
          })
          .eq("id", (await supabase
            .from("users")
            .select("organization_id")
            .eq("id", user.id)
            .single()).data?.organization_id);

        // Send email
        await supabase.functions.invoke("send-status-emails", {
          body: {
            type: "trial_ended",
            userId: user.id,
          },
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        earlyAccessReminders: earlyAccessUsers?.length || 0,
        trialEndingReminders: trialEndingUsers?.length || 0,
        expiredTrials: expiredTrialUsers?.length || 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error checking status transitions:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
