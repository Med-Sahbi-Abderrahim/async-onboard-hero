import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      client_id,
      organization_id,
      request_type,
      title,
      description,
      metadata,
    } = await req.json();

    console.log("Creating client request:", {
      client_id,
      organization_id,
      request_type,
      title,
    });

    // Create the client request
    const { data: clientRequest, error: requestError } = await supabase
      .from("client_requests")
      .insert({
        client_id,
        organization_id,
        request_type,
        title,
        description,
        metadata: metadata || {},
        status: "pending",
      })
      .select()
      .single();

    if (requestError) {
      console.error("Error creating request:", requestError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to create request: ${requestError.message}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Client request created successfully:", clientRequest.id);

    // Send notification to organization members
    try {
      const notificationResponse = await fetch(
        `${supabaseUrl}/functions/v1/send-org-notification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            organization_id,
            request_id: clientRequest.id,
            client_id,
            request_type,
            title,
          }),
        }
      );

      if (!notificationResponse.ok) {
        console.error(
          "Failed to send notification:",
          await notificationResponse.text()
        );
      } else {
        console.log("Notification sent successfully");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      // Don't fail the request if notification fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        request_id: clientRequest.id,
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
