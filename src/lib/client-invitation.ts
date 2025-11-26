import { supabase } from "@/integrations/supabase/client";

/**
 * Invite a client to the portal by creating an auth user and sending magic link
 * This should be called when:
 * - Organization manually adds a client
 * - Organization approves a form submission
 * - Organization clicks "Send Portal Invite" button
 */
export async function inviteClientToPortal(
  clientEmail: string,
  organizationId: string
): Promise {
  try {
    // Send magic link invite (this creates auth user automatically)
    const { error: inviteError } = await supabase.auth.signInWithOtp({
      email: clientEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/client-portal/${organizationId}`,
        data: {
          organization_id: organizationId,
          is_client: true,
        },
      },
    });

    if (inviteError) throw inviteError;

    return { success: true };
  } catch (error: any) {
    console.error("Error inviting client:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if a client has portal access (has user_id set)
 */
export async function checkClientPortalAccess(
  clientId: string
): Promise {
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("user_id")
      .eq("id", clientId)
      .single();

    if (error) return false;
    return data.user_id !== null;
  } catch {
    return false;
  }
}
