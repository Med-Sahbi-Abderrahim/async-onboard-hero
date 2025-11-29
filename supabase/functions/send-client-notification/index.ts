import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  organizationId: string;
  clientId: string;
  requestId: string;
  actionType: string;
  title: string;
  message: string;
  details?: Record<string, any>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: RequestBody = await req.json();
    const {
      organizationId,
      clientId,
      requestId,
      actionType,
      title,
      message,
      details = {},
    } = body;

    console.log("Processing client notification:", {
      organizationId,
      clientId,
      requestId,
      actionType,
      title,
    });

    // 1. Get client info
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("email, full_name, user_id")
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      console.error("Error fetching client:", clientError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Client not found: ${clientError?.message}`,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Create in-app notification if client has user account
    if (client.user_id) {
      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: client.user_id,
          organization_id: organizationId,
          type: "request_update",
          title: `Update on your request: ${title}`,
          message,
          related_entity_type: "client_request",
          related_entity_id: requestId,
          metadata: {
            action_type: actionType,
            details,
          },
        });

      if (notifError) {
        console.error("Error creating notification:", notifError);
      } else {
        console.log("In-app notification created");
      }
    }

    // 3. Queue email notification
    const actionLabels: Record<string, string> = {
      seen: "Your request has been reviewed",
      resolved: "Your request has been resolved",
      rejected: "Your request has been declined",
    };

    const emailSubject = actionLabels[actionType] || "Update on your request";
    const emailBody = `
      <h2>${emailSubject}</h2>
      <p><strong>Request:</strong> ${title}</p>
      <p>${message}</p>
      ${
        details && Object.keys(details).length > 0
          ? `<p><strong>Additional details:</strong></p><pre>${JSON.stringify(
              details,
              null,
              2
            )}</pre>`
          : ""
      }
      <p>Thank you for using our services.</p>
    `;

    const { data: emailData, error: emailError } = await supabase
      .from("email_queue")
      .insert({
        organization_id: organizationId,
        client_id: clientId,
        recipient_email: client.email,
        recipient_name: client.full_name || client.email,
        subject: emailSubject,
        body_html: emailBody,
        entity_type: "client_request",
        entity_id: requestId,
        metadata: {
          action_type: actionType,
          details,
        },
      })
      .select()
      .single();

    if (emailError) {
      console.error("Error queuing email:", emailError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to queue email: ${emailError.message}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Email queued successfully, id: ${emailData.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        emailId: emailData.id,
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
