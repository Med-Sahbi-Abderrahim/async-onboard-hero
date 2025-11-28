// src/lib/notification-service.ts
import { supabase } from "@/integrations/supabase/client";

interface EmailQueueItem {
  organization_id: string;
  client_id?: string;
  recipient_email: string;
  recipient_name?: string;
  subject: string;
  body_html: string;
  body_text?: string;
  template_id?: string;
  entity_type: "meeting" | "task" | "contract" | "invoice" | "form";
  entity_id: string;
  priority?: number;
  metadata?: Record<string, any>;
}

interface TemplateVariables {
  client_name?: string;
  organization_name?: string;
  [key: string]: any;
}

/**
 * Fetches an email template for a specific entity and notification type
 */
export async function fetchEmailTemplate(
  organizationId: string,
  entityType: string,
  notificationType: "immediate" | "reminder" | "overdue"
) {
  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("entity_type", entityType)
    .eq("notification_type", notificationType)
    .eq("is_default", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("Error fetching template:", error);
    return null;
  }

  return data;
}

/**
 * Substitutes variables in email template
 */
export function substituteVariables(template: string, variables: TemplateVariables): string {
  let result = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{${key}}`, "g");
    result = result.replace(regex, String(value || ""));
  });
  
  return result;
}

/**
 * Queues an email for sending
 */
export async function queueEmail(emailData: EmailQueueItem) {
  const { error } = await supabase.from("email_queue").insert({
    organization_id: emailData.organization_id,
    client_id: emailData.client_id,
    recipient_email: emailData.recipient_email,
    recipient_name: emailData.recipient_name,
    subject: emailData.subject,
    body_html: emailData.body_html,
    body_text: emailData.body_text,
    template_id: emailData.template_id,
    entity_type: emailData.entity_type,
    entity_id: emailData.entity_id,
    priority: emailData.priority || 5,
    metadata: emailData.metadata || {},
  });

  if (error) {
    console.error("Error queuing email:", error);
    return false;
  }

  return true;
}

/**
 * Logs a notification using existing reminder_logs table
 */
export async function logNotification(
  organizationId: string,
  clientId: string,
  entityType: string,
  entityId: string,
  reminderType: string,
  recipientEmail: string,
  emailStatus: "sent" | "failed" | "pending" = "sent",
  errorMessage?: string
) {
  await supabase.from("reminder_logs").insert({
    organization_id: organizationId,
    client_id: clientId,
    entity_type: entityType,
    entity_id: entityId,
    submission_id: null, // Only used for form submissions
    reminder_type: reminderType,
    sent_at: new Date().toISOString(),
    email_status: emailStatus,
    error_message: errorMessage,
    metadata: { entity_type: entityType },
  });
}

/**
 * Sends meeting created notification
 */
export async function sendMeetingCreatedNotification(
  meetingId: string,
  organizationId: string,
  clientId: string
) {
  try {
    // Fetch meeting details
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .select("*, clients(email, full_name), organizations(name)")
      .eq("id", meetingId)
      .single();

    if (meetingError || !meeting) {
      console.error("Error fetching meeting:", meetingError);
      return false;
    }

    // Fetch template
    const template = await fetchEmailTemplate(organizationId, "meeting", "immediate");
    if (!template) {
      console.error("No template found for meeting creation");
      return false;
    }

    // Prepare variables
    const meetingDate = new Date(meeting.scheduled_at);
    const variables = {
      client_name: meeting.clients.full_name || meeting.clients.email,
      organization_name: meeting.organizations?.name || "Your Organization",
      meeting_title: meeting.title,
      meeting_date: meetingDate.toLocaleDateString(),
      meeting_time: meetingDate.toLocaleTimeString(),
      meeting_duration: `${meeting.duration_minutes || 60} minutes`,
      meeting_link: meeting.meeting_link
        ? `<p><a href="${meeting.meeting_link}">Join Meeting</a></p>`
        : "",
    };

    // Substitute variables
    const subject = substituteVariables(template.subject, variables);
    const bodyHtml = substituteVariables(template.body_html, variables);
    const bodyText = template.body_text
      ? substituteVariables(template.body_text, variables)
      : undefined;

    // Queue email
    const queued = await queueEmail({
      organization_id: organizationId,
      client_id: clientId,
      recipient_email: meeting.clients.email,
      recipient_name: meeting.clients.full_name,
      subject,
      body_html: bodyHtml,
      body_text: bodyText,
      template_id: template.id,
      entity_type: "meeting",
      entity_id: meetingId,
      priority: 3,
    });

    if (queued) {
      await logNotification(
        organizationId,
        clientId,
        "meeting",
        meetingId,
        "meeting_created",
        meeting.clients.email
      );
    }

    return queued;
  } catch (error) {
    console.error("Error sending meeting notification:", error);
    return false;
  }
}

/**
 * Sends task assigned notification
 */
export async function sendTaskAssignedNotification(
  taskId: string,
  organizationId: string,
  clientId: string
) {
  try {
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("*, clients(email, full_name), organizations(name)")
      .eq("id", taskId)
      .single();

    if (taskError || !task) {
      console.error("Error fetching task:", taskError);
      return false;
    }

    const template = await fetchEmailTemplate(organizationId, "task", "immediate");
    if (!template) return false;

    const variables = {
      client_name: task.clients.full_name || task.clients.email,
      organization_name: task.organizations?.name || "Your Organization",
      task_title: task.title,
      task_description: task.description || "No description provided",
      due_date: task.due_date
        ? new Date(task.due_date).toLocaleDateString()
        : "No due date",
      task_url: `${window.location.origin}/client-portal/${organizationId}/tasks`,
    };

    const subject = substituteVariables(template.subject, variables);
    const bodyHtml = substituteVariables(template.body_html, variables);
    const bodyText = template.body_text
      ? substituteVariables(template.body_text, variables)
      : undefined;

    const queued = await queueEmail({
      organization_id: organizationId,
      client_id: clientId,
      recipient_email: task.clients.email,
      recipient_name: task.clients.full_name,
      subject,
      body_html: bodyHtml,
      body_text: bodyText,
      template_id: template.id,
      entity_type: "task",
      entity_id: taskId,
      priority: 4,
    });

    if (queued) {
      await logNotification(
        organizationId,
        clientId,
        "task",
        taskId,
        "task_assigned",
        task.clients.email
      );
    }

    return queued;
  } catch (error) {
    console.error("Error sending task notification:", error);
    return false;
  }
}

/**
 * Sends contract created notification
 */
export async function sendContractCreatedNotification(
  contractId: string,
  organizationId: string,
  clientId: string
) {
  try {
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("*, clients(email, full_name), organizations(name)")
      .eq("id", contractId)
      .single();

    if (contractError || !contract) {
      console.error("Error fetching contract:", contractError);
      return false;
    }

    const template = await fetchEmailTemplate(organizationId, "contract", "immediate");
    if (!template) return false;

    const variables = {
      client_name: contract.clients.full_name || contract.clients.email,
      organization_name: contract.organizations?.name || "Your Organization",
      contract_title: contract.title,
      contract_description: contract.description || "No description provided",
      sign_url: `${window.location.origin}/client-portal/${organizationId}/contracts`,
    };

    const subject = substituteVariables(template.subject, variables);
    const bodyHtml = substituteVariables(template.body_html, variables);
    const bodyText = template.body_text
      ? substituteVariables(template.body_text, variables)
      : undefined;

    const queued = await queueEmail({
      organization_id: organizationId,
      client_id: clientId,
      recipient_email: contract.clients.email,
      recipient_name: contract.clients.full_name,
      subject,
      body_html: bodyHtml,
      body_text: bodyText,
      template_id: template.id,
      entity_type: "contract",
      entity_id: contractId,
      priority: 2,
    });

    if (queued) {
      await logNotification(
        organizationId,
        clientId,
        "contract",
        contractId,
        "contract_created",
        contract.clients.email
      );
    }

    return queued;
  } catch (error) {
    console.error("Error sending contract notification:", error);
    return false;
  }
}

/**
 * Sends invoice created notification
 */
export async function sendInvoiceCreatedNotification(
  invoiceId: string,
  organizationId: string,
  clientId: string
) {
  try {
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*, clients(email, full_name), organizations(name)")
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error("Error fetching invoice:", invoiceError);
      return false;
    }

    const template = await fetchEmailTemplate(organizationId, "invoice", "immediate");
    if (!template) return false;

    const amount = (invoice.amount_cents / 100).toFixed(2);
    const variables = {
      client_name: invoice.clients.full_name || invoice.clients.email,
      organization_name: invoice.organizations?.name || "Your Organization",
      invoice_number: invoice.invoice_number,
      amount: `${invoice.currency} ${amount}`,
      due_date: new Date(invoice.due_date).toLocaleDateString(),
      pay_url: `${window.location.origin}/client-portal/${organizationId}/billing`,
    };

    const subject = substituteVariables(template.subject, variables);
    const bodyHtml = substituteVariables(template.body_html, variables);
    const bodyText = template.body_text
      ? substituteVariables(template.body_text, variables)
      : undefined;

    const queued = await queueEmail({
      organization_id: organizationId,
      client_id: clientId,
      recipient_email: invoice.clients.email,
      recipient_name: invoice.clients.full_name,
      subject,
      body_html: bodyHtml,
      body_text: bodyText,
      template_id: template.id,
      entity_type: "invoice",
      entity_id: invoiceId,
      priority: 2,
    });

    if (queued) {
      await logNotification(
        organizationId,
        clientId,
        "invoice",
        invoiceId,
        "invoice_created",
        invoice.clients.email
      );
    }

    return queued;
  } catch (error) {
    console.error("Error sending invoice notification:", error);
    return false;
  }
}
