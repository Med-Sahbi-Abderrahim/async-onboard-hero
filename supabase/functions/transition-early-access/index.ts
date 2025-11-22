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

    console.log("Starting early access to free trial transition check...");

    // Find users whose early access has expired
    const { data: expiredUsers, error: fetchError } = await supabase
      .from("users")
      .select("id, email, full_name, early_access_end_date")
      .eq("status", "early_access")
      .lt("early_access_end_date", new Date().toISOString());

    if (fetchError) {
      console.error("Error fetching expired users:", fetchError);
      throw fetchError;
    }

    if (!expiredUsers || expiredUsers.length === 0) {
      console.log("No users need transition");
      return new Response(
        JSON.stringify({ message: "No users to transition", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${expiredUsers.length} users to transition`);

    // Calculate trial end date (14 days from now)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    // Transition each user to free trial
    const updates = expiredUsers.map((user) =>
      supabase
        .from("users")
        .update({
          status: "free_trial",
          trial_start_date: new Date().toISOString(),
          trial_end_date: trialEndDate.toISOString(),
        })
        .eq("id", user.id)
    );

    const results = await Promise.all(updates);

    // Check for errors
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      console.error("Some updates failed:", errors);
    }

    const successCount = results.filter((r) => !r.error).length;

    console.log(`Successfully transitioned ${successCount} users to free trial`);

    // Send welcome emails to transitioned users
    for (const user of expiredUsers) {
      try {
        await supabase.functions.invoke("send-status-emails", {
          body: {
            type: "trial_welcome",
            userId: user.id,
          },
        });
        console.log(`Sent trial welcome email to ${user.email}`);
      } catch (emailError) {
        console.error(`Failed to send email to ${user.email}:`, emailError);
      }
    }

    return new Response(
      JSON.stringify({
        message: "Transition completed",
        transitioned: successCount,
        failed: errors.length,
        users: expiredUsers.map((u) => ({ id: u.id, email: u.email })),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in transition-early-access function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
