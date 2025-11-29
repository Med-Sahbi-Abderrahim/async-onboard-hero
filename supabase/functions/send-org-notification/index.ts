import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  organizationId: string;
  clientId: string;
  requestType: string;
  requestId: string;
  title: string;
  message?: string;
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
      requestType,
      requestId,
      title,
      message,
      details = {},
    } = body;

    console.log("Processing org notification:", {
      organizationId,
      clientId,
      requestType,
      requestId,
      title,
    });

    // 1. Get organization members (admins and owners)
    const { data: memberRecords, error: membersError } = await supabase
      .from("organization_members")
      .select("user_id, role")
      .eq("organization_id", organizationId)
      .in("role", ["owner", "admin"])
      .is("deleted_at", null);

    if (membersError) {
      console.error("Error fetching organization members:", membersError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Organization members query failed: ${membersError.message}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!memberRecords || memberRecords.length === 0) {
      console.warn("No admin/owner members found for organization");
      return new Response(
        JSON.stringify({
          success: false,
          reason: "No admin or owner members found",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Get user details for those members
    const userIds = memberRecords.map(m => m.user_id);
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, full_name")
      .in("id", userIds);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Users query failed: ${usersError.message}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Combine member and user data
    const members = memberRecords.map(member => ({
      ...member,
      user: users?.find(u => u.id === member.user_id)
    })).filter(m => m.user);

    // 3. Get client info
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("full_name, email")
      .eq("id", clientId)
      .single();

    if (clientError) {
      console.error("Error fetching client:", clientError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Client query failed: ${clientError.message}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const clientName = client?.full_name || client?.email || "A client";

    // 4. Create in-app notifications for each admin/owner
    let notificationsSent = 0;
    for (const member of members) {
      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: member.user_id,
          organization_id: organizationId,
          type: "client_request",
          title: `New ${requestType} request`,
          message: `${clientName} has submitted: ${title}`,
          related_entity_type: "client_request",
          related_entity_id: requestId,
          metadata: {
            client_id: clientId,
            request_type: requestType,
            details,
          },
        });

      if (notifError) {
        console.error(
          `Error creating notification for user ${member.user_id}:`,
          notifError
        );
      } else {
        notificationsSent++;
      }
    }

    console.log(
      `Created ${notificationsSent} notifications for org members`
    );

    // 5. Queue email notification (optional - send to first admin/owner)
    const firstMember = members[0];
    const recipientEmail = firstMember.user?.email;
    const recipientName = firstMember.user?.full_name || recipientEmail;

    const emailBody = `
      <h2>New Client Request</h2>
      <p><strong>From:</strong> ${clientName}</p>
      <p><strong>Type:</strong> ${requestType}</p>
      <p><strong>Title:</strong> ${title}</p>
      ${message ? `<p><strong>Message:</strong> ${message}</p>` : ""}
      <p>Please log in to your dashboard to review and respond to this request.</p>
    `;

    const { data: emailData, error: emailError } = await supabase
      .from("email_queue")
      .insert({
        organization_id: organizationId,
        client_id: clientId,
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        subject: `New ${requestType} request from ${clientName}`,
        body_html: emailBody,
        entity_type: "client_request",
        entity_id: requestId,
        metadata: {
          request_type: requestType,
          client_name: clientName,
          details,
        },
      })
      .select()
      .single();

    if (emailError) {
      console.error("Error queuing email:", emailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationsSent,
        emailId: emailData?.id,
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
