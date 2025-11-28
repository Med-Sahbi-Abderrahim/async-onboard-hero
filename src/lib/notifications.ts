import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// ============================================
// HELPER FUNCTION: Queue notification
// ============================================
async function queueNotification(
  entityType: string, // 'meeting', 'task', 'contract', 'invoice'
  entityId: string, // UUID of the created entity
  notificationType: string, // 'immediate' or 'reminder'
  recipientEmail: string,
  recipientName: string,
  organizationId: string,
  clientId: string,
  metadata: Record<string, any>
) {
  try {
    const { data, error } = await supabase.rpc("queue_notification", {
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_notification_type: notificationType,
      p_recipient_email: recipientEmail,
      p_recipient_name: recipientName,
      p_organization_id: organizationId,
      p_client_id: clientId,
      p_metadata: metadata,
    });

    if (error) {
      console.error("Error queuing notification:", error);
      return false;
    }

    console.log("✅ Notification queued:", data);
    return true;
  } catch (error) {
    console.error("Unexpected error:", error);
    return false;
  }
}

// ============================================
// EXAMPLE 1: Create Meeting Modal
// ============================================
export async function handleCreateMeeting(formData: {
  title: string;
  date: string;
  time: string;
  duration: string;
  meetingLink: string;
  clientId: string;
}) {
  try {
    // Get current user and organization
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const {
      data: { organizations },
    } = await supabase
      .from("organizations")
      .select("id")
      .limit(1)
      .single();

    if (!user || !organizations) {
      console.error("User or organization not found");
      return;
    }

    // Get client details
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("full_name, email")
      .eq("id", formData.clientId)
      .single();

    if (clientError || !client) {
      console.error("Client not found");
      return;
    }

    // 1. Create the meeting in your database
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .insert({
        title: formData.title,
        date: formData.date,
        time: formData.time,
        duration: formData.duration,
        meeting_link: formData.meetingLink,
        client_id: formData.clientId,
        organization_id: organizations.id,
        created_by: user.id,
      })
      .select()
      .single();

    if (meetingError || !meeting) {
      console.error("Error creating meeting:", meetingError);
      return;
    }

    // 2. Queue immediate notification to CLIENT
    await queueNotification(
      "meeting",
      meeting.id,
      "immediate",
      client.email,
      client.full_name,
      organizations.id,
      formData.clientId,
      {
        meeting_title: formData.title,
        meeting_date: formData.date,
        meeting_time: formData.time,
        meeting_duration: formData.duration,
        meeting_link: formData.meetingLink,
        organization_name: organizations.name,
        client_name: client.full_name,
      }
    );

    // 3. Queue reminder notification to BOTH (24h before)
    // You might store this separately or calculate it based on date/time
    // For now, we're queueing it - the Edge Function will handle the delay

    console.log("✅ Meeting created and notifications queued");
  } catch (error) {
    console.error("Error:", error);
  }
}

// ============================================
// EXAMPLE 2: Create Task Modal
// ============================================
export async function handleCreateTask(formData: {
  title: string;
  description: string;
  dueDate: string;
  assignedToClientId: string;
}) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: organizations } = await supabase
      .from("organizations")
      .select("id")
      .limit(1)
      .single();

    const { data: client } = await supabase
      .from("clients")
      .select("full_name, email")
      .eq("id", formData.assignedToClientId)
      .single();

    if (!user || !organizations || !client) return;

    // Create task
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .insert({
        title: formData.title,
        description: formData.description,
        due_date: formData.dueDate,
        assigned_to_client_id: formData.assignedToClientId,
        organization_id: organizations.id,
        created_by: user.id,
      })
      .select()
      .single();

    if (taskError || !task) return;

    // Queue notification to client
    await queueNotification(
      "task",
      task.id,
      "immediate",
      client.email,
      client.full_name,
      organizations.id,
      formData.assignedToClientId,
      {
        task_title: formData.title,
        task_description: formData.description,
        task_due_date: formData.dueDate,
      }
    );

    console.log("✅ Task created and notification queued");
  } catch (error) {
    console.error("Error:", error);
  }
}

// ============================================
// EXAMPLE 3: Create Contract Modal
// ============================================
export async function handleCreateContract(formData: {
  name: string;
  description: string;
  clientId: string;
  dueDate: string;
}) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: organizations } = await supabase
      .from("organizations")
      .select("id")
      .limit(1)
      .single();

    const { data: client } = await supabase
      .from("clients")
      .select("full_name, email")
      .eq("id", formData.clientId)
      .single();

    if (!user || !organizations || !client) return;

    // Create contract
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .insert({
        name: formData.name,
        description: formData.description,
        client_id: formData.clientId,
        organization_id: organizations.id,
        due_date: formData.dueDate,
        created_by: user.id,
      })
      .select()
      .single();

    if (contractError || !contract) return;

    // Queue notification to client
    await queueNotification(
      "contract",
      contract.id,
      "immediate",
      client.email,
      client.full_name,
      organizations.id,
      formData.clientId,
      {
        contract_name: formData.name,
        contract_description: formData.description,
        contract_due_date: formData.dueDate,
      }
    );

    console.log("✅ Contract created and notification queued");
  } catch (error) {
    console.error("Error:", error);
  }
}

// ============================================
// EXAMPLE 4: Create Invoice Modal
// ============================================
export async function handleCreateInvoice(formData: {
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  clientId: string;
}) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: organizations } = await supabase
      .from("organizations")
      .select("id")
      .limit(1)
      .single();

    const { data: client } = await supabase
      .from("clients")
      .select("full_name, email")
      .eq("id", formData.clientId)
      .single();

    if (!user || !organizations || !client) return;

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        invoice_number: formData.invoiceNumber,
        amount: formData.amount,
        due_date: formData.dueDate,
        client_id: formData.clientId,
        organization_id: organizations.id,
        created_by: user.id,
      })
      .select()
      .single();

    if (invoiceError || !invoice) return;

    // Queue notification to client
    await queueNotification(
      "invoice",
      invoice.id,
      "immediate",
      client.email,
      client.full_name,
      organizations.id,
      formData.clientId,
      {
        invoice_number: formData.invoiceNumber,
        invoice_amount: formData.amount,
        invoice_due_date: formData.dueDate,
      }
    );

    console.log("✅ Invoice created and notification queued");
  } catch (error) {
    console.error("Error:", error);
  }
}

// ============================================
// USAGE IN YOUR MODAL
// ============================================
/*
Example in a React component:

import { handleCreateMeeting } from './notifications';

function CreateMeetingModal() {
  const handleSubmit = async (formData) => {
    await handleCreateMeeting(formData);
    // Close modal, show success, etc.
  };

  return (
    // Your form JSX
  );
}
*/
