import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  request_id: string;
  action: "approve" | "reject";
  reason?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Get authenticated user
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { request_id, action, reason }: RequestBody = await req.json();

    console.log(`Processing ${action} for request ${request_id}`);

    // Get the request details
    const { data: request, error: requestError } = await supabase
      .from("client_requests")
      .select(`
        *,
        clients!inner(id, full_name, email, user_id)
      `)
      .eq("id", request_id)
      .single();

    if (requestError || !request) {
      throw new Error("Request not found");
    }

    // Update request status
    const newStatus = action === "approve" ? "approved" : "rejected";
    const updateData: any = {
      status: newStatus,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (action === "reject" && reason) {
      updateData.metadata = {
        ...request.metadata,
        rejection_reason: reason,
      };
    }

    const { error: updateError } = await supabase
      .from("client_requests")
      .update(updateData)
      .eq("id", request_id);

    if (updateError) {
      throw updateError;
    }

    // Notify client about the decision
    const actionType = action === "approve" ? "resolved" : "rejected";
    const notificationTitle =
      action === "approve"
        ? `Request Approved: ${request.title}`
        : `Request Rejected: ${request.title}`;

    const notificationMessage =
      action === "approve"
        ? "Your request has been approved and is being processed."
        : `Your request was rejected. ${reason || "Please contact us for more information."}`;

    const details: any = {
      request_type: request.request_type,
      action,
    };

    if (action === "reject" && reason) {
      details.rejection_reason = reason;
    }

    console.log(`Sending ${actionType} notification to client`);

    // Send client notification (in-app and email)
    const { error: notificationError } = await supabase.functions.invoke(
      "send-client-notification",
      {
        body: {
          organizationId: request.organization_id,
          clientId: request.client_id,
          requestId: request_id,
          actionType,
          title: notificationTitle,
          message: notificationMessage,
          details,
        },
      }
    );

    if (notificationError) {
      console.error("Failed to send client notification:", notificationError);
      // Don't fail the whole operation if notification fails
    }

    console.log(`Request ${action}ed successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Request ${action}ed successfully`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
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
