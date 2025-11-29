import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Processing email queue...");

    // Get pending emails from queue (limit to 10 per run)
    const { data: pendingEmails, error: fetchError } = await supabase
      .from("email_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(10);

    if (fetchError) {
      console.error("Error fetching emails:", fetchError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to fetch emails: ${fetchError.message}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      console.log("No pending emails to process");
      return new Response(
        JSON.stringify({
          success: true,
          message: "No pending emails",
          processed: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Found ${pendingEmails.length} pending emails`);

    let successCount = 0;
    let failureCount = 0;

    // Process each email
    for (const email of pendingEmails) {
      try {
        console.log(`Sending email ${email.id} to ${email.recipient_email}`);

        // Send email via Resend
        const emailResponse = await resend.emails.send({
          from: "ClientFlow <onboarding@resend.dev>",
          to: [email.recipient_email],
          subject: email.subject,
          html: email.body_html,
          text: email.body_text || undefined,
        });

        console.log(`Email sent successfully:`, emailResponse);

        // Update email status to sent
        const { error: updateError } = await supabase
          .from("email_queue")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", email.id);

        if (updateError) {
          console.error(`Error updating email ${email.id}:`, updateError);
        } else {
          successCount++;
        }
      } catch (error) {
        console.error(`Failed to send email ${email.id}:`, error);
        failureCount++;

        // Update email with error
        const retryCount = (email.retry_count || 0) + 1;
        const maxRetries = 3;

        await supabase
          .from("email_queue")
          .update({
            status: retryCount >= maxRetries ? "failed" : "pending",
            error_message:
              error instanceof Error ? error.message : "Unknown error",
            retry_count: retryCount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", email.id);
      }
    }

    console.log(
      `Email processing complete: ${successCount} sent, ${failureCount} failed`
    );

    return new Response(
      JSON.stringify({
        success: true,
        processed: successCount + failureCount,
        sent: successCount,
        failed: failureCount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
