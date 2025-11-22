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

    let planExpiringCount = 0;
    let expiredDay1Count = 0;
    let expiredDay5Count = 0;
    let expiredDay14Count = 0;

    // 1. Check for Pro plan renewals in 7 days
    const { data: renewingSoon } = await supabase
      .from("organizations")
      .select("id, subscription_renewal_date, lemonsqueezy_customer_id")
      .eq("plan", "pro")
      .eq("subscription_status", "active")
      .not("subscription_renewal_date", "is", null);

    if (renewingSoon && renewingSoon.length > 0) {
      for (const org of renewingSoon) {
        const renewalDate = new Date(org.subscription_renewal_date);
        const daysUntilRenewal = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilRenewal === 7) {
          // Check if we already sent this reminder
          const { data: existingEvent } = await supabase
            .from("billing_events")
            .select("id")
            .eq("organization_id", org.id)
            .eq("event_type", "plan_expiring_soon")
            .gte("created_at", new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString())
            .single();

          if (!existingEvent) {
            // Get the organization owner
            const { data: owner } = await supabase
              .from("organization_members")
              .select("user_id")
              .eq("organization_id", org.id)
              .eq("role", "owner")
              .single();

            if (owner) {
              await supabase.functions.invoke("send-status-emails", {
                body: {
                  type: "plan_expiring_soon",
                  userId: owner.user_id,
                  metadata: {
                    renewalDate: org.subscription_renewal_date,
                    amountCents: 4900,
                    lastFourDigits: "****"
                  }
                }
              });

              await supabase.from("billing_events").insert({
                organization_id: org.id,
                event_type: "plan_expiring_soon",
                metadata: { renewal_date: org.subscription_renewal_date }
              });

              planExpiringCount++;
              console.log(`Sent plan expiring soon email for org ${org.id}`);
            }
          }
        }
      }
    }

    // 2. Check for expired Pro plans (Day 1, Day 5, Day 14)
    const { data: expiredOrgs } = await supabase
      .from("organizations")
      .select("id, subscription_renewal_date, plan, subscription_status")
      .eq("plan", "free")
      .eq("subscription_status", "cancelled");

    if (expiredOrgs && expiredOrgs.length > 0) {
      for (const org of expiredOrgs) {
        // Find the most recent subscription_ended event
        const { data: endEvent } = await supabase
          .from("billing_events")
          .select("created_at")
          .eq("organization_id", org.id)
          .eq("event_type", "subscription_ended")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (endEvent) {
          const endDate = new Date(endEvent.created_at);
          const daysSinceEnd = Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));

          // Get the organization owner
          const { data: owner } = await supabase
            .from("organization_members")
            .select("user_id")
            .eq("organization_id", org.id)
            .eq("role", "owner")
            .single();

          if (!owner) continue;

          // Day 1 email
          if (daysSinceEnd === 1) {
            const { data: existingDay1 } = await supabase
              .from("billing_events")
              .select("id")
              .eq("organization_id", org.id)
              .eq("event_type", "plan_expired_day1")
              .single();

            if (!existingDay1) {
              await supabase.functions.invoke("send-status-emails", {
                body: { type: "plan_expired_day1", userId: owner.user_id }
              });

              await supabase.from("billing_events").insert({
                organization_id: org.id,
                event_type: "plan_expired_day1",
                metadata: { days_since_expiry: 1 }
              });

              expiredDay1Count++;
              console.log(`Sent Day 1 expired email for org ${org.id}`);
            }
          }

          // Day 5 email
          if (daysSinceEnd === 5) {
            const { data: existingDay5 } = await supabase
              .from("billing_events")
              .select("id")
              .eq("organization_id", org.id)
              .eq("event_type", "plan_expired_day5")
              .single();

            if (!existingDay5) {
              await supabase.functions.invoke("send-status-emails", {
                body: { type: "plan_expired_day5", userId: owner.user_id }
              });

              await supabase.from("billing_events").insert({
                organization_id: org.id,
                event_type: "plan_expired_day5",
                metadata: { days_since_expiry: 5 }
              });

              expiredDay5Count++;
              console.log(`Sent Day 5 expired email for org ${org.id}`);
            }
          }

          // Day 14 email
          if (daysSinceEnd === 14) {
            const { data: existingDay14 } = await supabase
              .from("billing_events")
              .select("id")
              .eq("organization_id", org.id)
              .eq("event_type", "plan_expired_day14")
              .single();

            if (!existingDay14) {
              await supabase.functions.invoke("send-status-emails", {
                body: { type: "plan_expired_day14", userId: owner.user_id }
              });

              await supabase.from("billing_events").insert({
                organization_id: org.id,
                event_type: "plan_expired_day14",
                metadata: { days_since_expiry: 14 }
              });

              expiredDay14Count++;
              console.log(`Sent Day 14 expired email for org ${org.id}`);
            }
          }
        }
      }
    }

    // 3. Check for Early Access users ending in 3 days
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

    // 4. Check for Trial users ending in 24-48 hours
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
        planExpiringReminders: planExpiringCount,
        expiredDay1Reminders: expiredDay1Count,
        expiredDay5Reminders: expiredDay5Count,
        expiredDay14Reminders: expiredDay14Count,
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
