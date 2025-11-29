// lib/notifications.ts
// Helper functions for triggering edge function notifications

import { supabase } from "@/integrations/supabase/client";

interface OrgNotificationResult {
  success: boolean;
  notificationsSent?: number;
  emailId?: string;
  error?: string;
  reason?: string;
}

interface ClientNotificationResult {
  success: boolean;
  emailId?: string;
  error?: string;
  reason?: string;
}

/**
 * Triggers a notification to organization admins/owners about a client request
 * 
 * @param organizationId - ID of the organization
 * @param clientId - ID of the client who made the request
 * @param requestType - Type of request (meeting, contract, etc.)
 * @param requestId - ID of the client request
 * @param title - Title/subject of the request
 * @param message - Optional message/description
 * @param details - Additional structured data
 * @returns Promise with notification result
 */
export async function triggerOrgNotification(
  organizationId: string,
  clientId: string,
  requestType: string,
  requestId: string,
  title: string,
  message?: string,
  details: Record<string, any> = {}
): Promise<OrgNotificationResult> {
  try {
    const { data, error } = await supabase.functions.invoke("send-org-notification", {
      body: {
        organizationId,
        clientId,
        requestType,
        requestId,
        title,
        message,
        details,
      },
    });

    if (error) {
      console.error("Error invoking org notification function:", error);
      return {
        success: false,
        error: error.message || "Failed to invoke notification function",
      };
    }

    if (!data.success) {
      console.warn("Org notification not sent:", data.reason || data.error);
      return {
        success: false,
        reason: data.reason,
        error: data.error,
      };
    }

    console.log(
      `Org notification sent successfully to ${data.notificationsSent} member(s), emailId: ${data.emailId}`
    );

    return {
      success: true,
      notificationsSent: data.notificationsSent,
      emailId: data.emailId,
    };
  } catch (error) {
    console.error("Unexpected error triggering org notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Triggers a notification to a client about their request status
 * 
 * @param organizationId - ID of the organization
 * @param clientId - ID of the client receiving the notification
 * @param requestId - ID of the client request being updated
 * @param actionType - Type of action (resolved, rejected, seen)
 * @param title - Title of the original request
 * @param message - Response message to the client
 * @param details - Additional structured data
 * @returns Promise with notification result
 */
export async function triggerClientNotification(
  organizationId: string,
  clientId: string,
  requestId: string,
  actionType: string,
  title: string,
  message: string,
  details: Record<string, any> = {}
): Promise<ClientNotificationResult> {
  try {
    const { data, error } = await supabase.functions.invoke("send-client-notification", {
      body: {
        organizationId,
        clientId,
        requestId,
        actionType,
        title,
        message,
        details,
      },
    });

    if (error) {
      console.error("Error invoking client notification function:", error);
      return {
        success: false,
        error: error.message || "Failed to invoke notification function",
      };
    }

    if (!data.success) {
      console.warn("Client notification not sent:", data.reason || data.error);
      return {
        success: false,
        reason: data.reason,
        error: data.error,
      };
    }

    console.log(`Client notification sent successfully, emailId: ${data.emailId}`);

    return {
      success: true,
      emailId: data.emailId,
    };
  } catch (error) {
    console.error("Unexpected error triggering client notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Convenience wrapper for sending "seen" notifications to clients
 */
export async function notifyClientRequestSeen(
  organizationId: string,
  clientId: string,
  requestId: string,
  requestTitle: string
): Promise<ClientNotificationResult> {
  return triggerClientNotification(
    organizationId,
    clientId,
    requestId,
    "seen",
    requestTitle,
    "Your request has been reviewed by our team. We'll get back to you soon with more details."
  );
}

/**
 * Convenience wrapper for sending "resolved" notifications to clients
 */
export async function notifyClientRequestResolved(
  organizationId: string,
  clientId: string,
  requestId: string,
  requestTitle: string,
  resolutionMessage: string,
  details?: Record<string, any>
): Promise<ClientNotificationResult> {
  return triggerClientNotification(
    organizationId,
    clientId,
    requestId,
    "resolved",
    requestTitle,
    resolutionMessage,
    details
  );
}

/**
 * Convenience wrapper for sending "rejected" notifications to clients
 */
export async function notifyClientRequestRejected(
  organizationId: string,
  clientId: string,
  requestId: string,
  requestTitle: string,
  rejectionReason: string,
  details?: Record<string, any>
): Promise<ClientNotificationResult> {
  return triggerClientNotification(
    organizationId,
    clientId,
    requestId,
    "rejected",
    requestTitle,
    `Your request has been declined. Reason: ${rejectionReason}`,
    details
  );
}
