import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailPayload {
  type: "early_access_reminder" | "trial_welcome" | "trial_ending" | "trial_ended" | "payment_failed" | "subscription_ended";
  userId: string;
  metadata?: Record<string, any>;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { type, userId, metadata }: EmailPayload = await req.json();

    console.log(`Processing ${type} email for user ${userId}`);

    // Fetch user details
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("email, full_name, early_access_end_date, trial_end_date, status")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      throw new Error(`User not found: ${userError?.message}`);
    }

    let emailResponse;

    switch (type) {
      case "early_access_reminder":
        emailResponse = await resend.emails.send({
          from: "ClientFlow <onboarding@resend.dev>",
          to: [user.email],
          subject: "Heads up: Your Early Access is ending soon 👋",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #3b82f6;">Your Early Access is ending soon</h1>
              <p>Hi ${user.full_name || "there"},</p>
              <p>Just a friendly heads up — your Early Access period will end in <strong>3 days</strong> on ${new Date(user.early_access_end_date).toLocaleDateString()}.</p>
              <p>Don't worry! You'll automatically transition to a <strong>14-day Free Trial</strong>, giving you continued access to all features.</p>
              <p><strong>What happens next?</strong></p>
              <ul>
                <li>Your trial starts automatically — no action needed</li>
                <li>You'll keep full access to all features</li>
                <li>You can upgrade anytime during your trial</li>
              </ul>
              <p>Questions? Just reply to this email — we're here to help!</p>
              <p>Best,<br>The ClientFlow Team</p>
            </div>
          `,
        });
        break;

      case "trial_welcome":
        emailResponse = await resend.emails.send({
          from: "ClientFlow <onboarding@resend.dev>",
          to: [user.email],
          subject: "Your trial starts now 🚀",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #3b82f6;">Welcome to your 14-day trial!</h1>
              <p>Hi ${user.full_name || "there"},</p>
              <p>Your trial has officially started! You now have <strong>14 days</strong> of full access to all ClientFlow features.</p>
              <p><strong>Get started with these key resources:</strong></p>
              <ul>
                <li><a href="${supabaseUrl.replace('.supabase.co', '')}/clients" style="color: #3b82f6;">Create your first client portal</a></li>
                <li><a href="${supabaseUrl.replace('.supabase.co', '')}/forms" style="color: #3b82f6;">Build custom intake forms</a></li>
                <li><a href="${supabaseUrl.replace('.supabase.co', '')}/settings" style="color: #3b82f6;">Customize your branding</a></li>
              </ul>
              <p>Your trial ends on <strong>${new Date(user.trial_end_date).toLocaleDateString()}</strong>. We'll remind you before it expires.</p>
              <p>Questions? Reply anytime — we're here to help you succeed!</p>
              <p>Best,<br>The ClientFlow Team</p>
            </div>
          `,
        });
        break;

      case "trial_ending":
        const hoursRemaining = Math.round((new Date(user.trial_end_date).getTime() - Date.now()) / (1000 * 60 * 60));
        emailResponse = await resend.emails.send({
          from: "ClientFlow <onboarding@resend.dev>",
          to: [user.email],
          subject: "Your trial ends soon — want more time?",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #3b82f6;">Your trial is ending soon</h1>
              <p>Hi ${user.full_name || "there"},</p>
              <p>Just a heads up — your trial ends in approximately <strong>${hoursRemaining} hours</strong> on ${new Date(user.trial_end_date).toLocaleString()}.</p>
              <p>To keep all your features and avoid any interruption:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${supabaseUrl.replace('.supabase.co', '')}/billing" 
                   style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Upgrade Now
                </a>
              </div>
              <p><strong>Need help deciding?</strong> We're here to answer any questions. Just reply to this email.</p>
              <p>Want to extend your trial? Let us know — we're flexible!</p>
              <p>Best,<br>The ClientFlow Team</p>
            </div>
          `,
        });
        break;

      case "trial_ended":
        emailResponse = await resend.emails.send({
          from: "ClientFlow <onboarding@resend.dev>",
          to: [user.email],
          subject: "Your trial ended — here's what's next",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #3b82f6;">Your trial has ended</h1>
              <p>Hi ${user.full_name || "there"},</p>
              <p>Your 14-day trial has come to an end. You've been moved to our <strong>Free plan</strong>.</p>
              <p><strong>What you keep on the Free plan:</strong></p>
              <ul>
                <li>1 client portal</li>
                <li>Basic intake forms</li>
                <li>1 GB storage</li>
              </ul>
              <p><strong>What you'll need to upgrade for:</strong></p>
              <ul>
                <li>Unlimited client portals</li>
                <li>Advanced automations</li>
                <li>Custom branding</li>
                <li>Priority support</li>
                <li>50 GB+ storage</li>
              </ul>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${supabaseUrl.replace('.supabase.co', '')}/billing" 
                   style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Upgrade to Continue
                </a>
              </div>
              <p>Questions about plans or pricing? Just reply — we're happy to help!</p>
              <p>Best,<br>The ClientFlow Team</p>
            </div>
          `,
        });
        break;

      case "payment_failed":
        emailResponse = await resend.emails.send({
          from: "ClientFlow <billing@resend.dev>",
          to: [user.email],
          subject: "We couldn't process your payment 😕",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #ef4444;">Payment Failed</h1>
              <p>Hi ${user.full_name || "there"},</p>
              <p>We tried to process your payment, but unfortunately it didn't go through.</p>
              <p><strong>Why this might have happened:</strong></p>
              <ul>
                <li>Insufficient funds</li>
                <li>Card expired or cancelled</li>
                <li>Bank declined the transaction</li>
              </ul>
              <p>To avoid any interruption to your service, please update your payment method:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${supabaseUrl.replace('.supabase.co', '')}/billing" 
                   style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Update Payment Method
                </a>
              </div>
              <p>Need help? We're here for you — just reply to this email.</p>
              <p>Best,<br>The ClientFlow Team</p>
            </div>
          `,
        });
        break;

      case "subscription_ended":
        emailResponse = await resend.emails.send({
          from: "ClientFlow <billing@resend.dev>",
          to: [user.email],
          subject: "Your Pro plan ended — continue where you left off?",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #3b82f6;">Your subscription has ended</h1>
              <p>Hi ${user.full_name || "there"},</p>
              <p>Your Pro plan subscription has ended, and you've been moved to our Free plan.</p>
              <p>We'd love to have you back! All your data is safe and waiting for you.</p>
              <p><strong>Renew now to restore:</strong></p>
              <ul>
                <li>Unlimited client portals</li>
                <li>All your custom workflows</li>
                <li>Advanced features and automations</li>
                <li>Priority support</li>
              </ul>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${supabaseUrl.replace('.supabase.co', '')}/billing" 
                   style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Renew Your Subscription
                </a>
              </div>
              <p>Questions or need help? We're just an email away.</p>
              <p>Best,<br>The ClientFlow Team</p>
            </div>
          `,
        });
        break;

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    console.log(`Email sent successfully:`, emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error sending status email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
