import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MilestonePayload {
  userId: string;
  milestoneType: "onboarding" | "first_submission" | "first_automation";
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, milestoneType }: MilestonePayload = await req.json();

    console.log(`Checking milestone ${milestoneType} for user ${userId}`);

    // Get user data
    const { data: user } = await supabase
      .from("users")
      .select("id, organization_id")
      .eq("id", userId)
      .single();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if we already sent this milestone email
    const milestoneDescription = `milestone_${milestoneType}_sent`;
    const { data: existingLog } = await supabase
      .from("activity_logs")
      .select("id")
      .eq("user_id", userId)
      .eq("description", milestoneDescription)
      .single();

    if (existingLog) {
      console.log(`Milestone ${milestoneType} already sent for user ${userId}`);
      return new Response(
        JSON.stringify({ success: true, alreadySent: true }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Map milestone type to email type
    const emailTypeMap = {
      onboarding: "milestone_onboarding",
      first_submission: "milestone_first_submission",
      first_automation: "milestone_first_automation",
    };

    // Send the milestone email
    await supabase.functions.invoke("send-status-emails", {
      body: {
        type: emailTypeMap[milestoneType],
        userId: userId,
      },
    });

    // Log the milestone
    await supabase.from("activity_logs").insert({
      organization_id: user.organization_id,
      user_id: userId,
      action: "created",
      entity_type: "user",
      description: milestoneDescription,
      metadata: { milestone_type: milestoneType },
    });

    console.log(`Sent ${milestoneType} milestone email for user ${userId}`);

    return new Response(
      JSON.stringify({ success: true, milestoneSent: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error triggering milestone email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
