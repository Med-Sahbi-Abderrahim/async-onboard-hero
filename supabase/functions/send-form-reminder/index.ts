import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubmissionToRemind {
  submission_id: string;
  client_id: string;
  organization_id: string;
  client_email: string;
  client_full_name: string;
  form_title: string;
  form_slug: string;
  hours_since_update: number;
  reminder_delay_hours: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY') || 'PLACEHOLDER_KEY';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    // Extract user from JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`User ${user.id} triggered reminder check`);

    // Verify user has admin/owner role in at least one organization
    const { data: userOrgs, error: orgsError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .in('role', ['owner', 'admin']);

    if (orgsError || !userOrgs || userOrgs.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - requires admin or owner role' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const allowedOrgIds = userOrgs.map(org => org.organization_id);
    console.log('Starting form reminder job...');

    // Get all submissions needing reminders
    const { data: submissions, error: fetchError } = await supabase
      .rpc('get_submissions_needing_reminders') as { data: SubmissionToRemind[] | null, error: any };

    if (fetchError) {
      console.error('Error fetching submissions:', fetchError);
      throw fetchError;
    }

    if (!submissions || submissions.length === 0) {
      console.log('No submissions need reminders at this time');
      return new Response(
        JSON.stringify({ message: 'No reminders sent', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Filter to only organizations the user has access to
    const filteredSubmissions = submissions.filter(sub => 
      allowedOrgIds.includes(sub.organization_id)
    );
    
    console.log(`Found ${filteredSubmissions.length} submissions needing reminders (filtered to user's organizations)`);

    if (filteredSubmissions.length === 0) {
      console.log('No submissions need reminders at this time');
      return new Response(
        JSON.stringify({ message: 'No reminders sent', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = await Promise.allSettled(
      filteredSubmissions.map(async (submission) => {
        const formUrl = `${supabaseUrl.replace('xcvupdkdrrqjrgjzvhoy.supabase.co', 'lovable.app')}/forms/${submission.form_slug}/submit`;
        
        try {
          // Send email reminder
          const { data: emailData, error: emailError } = await resend.emails.send({
            from: 'Async Intake <onboarding@resend.dev>',
            to: [submission.client_email],
            subject: `Reminder: Complete your ${submission.form_title}`,
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                  <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 40px 20px;">
                        <table role="presentation" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                          <tr>
                            <td style="padding: 40px;">
                              <h2 style="margin: 0 0 20px; color: #111827; font-size: 24px; font-weight: 600;">Hi ${submission.client_full_name || 'there'},</h2>
                              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.5;">This is a friendly reminder that you have a form in progress that needs to be completed.</p>
                              
                              <div style="background: #f3f4f6; padding: 24px; border-radius: 8px; margin: 24px 0;">
                                <h3 style="margin: 0 0 12px; color: #111827; font-size: 18px; font-weight: 600;">${submission.form_title}</h3>
                                <p style="margin: 0; color: #6b7280; font-size: 14px;">You started this form ${Math.round(submission.hours_since_update)} hours ago.</p>
                              </div>
                              
                              <table role="presentation" style="margin: 32px 0;">
                                <tr>
                                  <td style="border-radius: 6px; background: #4F46E5;">
                                    <a href="${formUrl}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">Complete Form</a>
                                  </td>
                                </tr>
                              </table>
                              
                              <p style="margin: 32px 0 0; color: #9ca3af; font-size: 14px; line-height: 1.5;">If you have any questions, please don't hesitate to reach out.</p>
                            </td>
                          </tr>
                        </table>
                        
                        <table role="presentation" style="max-width: 600px; margin: 20px auto 0;">
                          <tr>
                            <td style="text-align: center; padding: 0 20px;">
                              <p style="margin: 0; color: #9ca3af; font-size: 12px;">Sent by Async Intake</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
              </html>
            `,
          });

          if (emailError) {
            throw emailError;
          }

          // Log successful reminder
          const { error: logError } = await supabase.from('reminder_logs').insert({
            organization_id: submission.organization_id,
            client_id: submission.client_id,
            submission_id: submission.submission_id,
            reminder_type: 'incomplete_reminder',
            email_status: 'sent',
            metadata: {
              email_id: emailData?.id,
              hours_since_update: submission.hours_since_update,
            },
          });

          if (logError) {
            console.error('Error logging reminder:', logError);
          }

          console.log(`Reminder sent to ${submission.client_email}`);
          return { success: true, email: submission.client_email };
        } catch (error: any) {
          console.error(`Failed to send reminder to ${submission.client_email}:`, error);

          // Log failed reminder
          await supabase.from('reminder_logs').insert({
            organization_id: submission.organization_id,
            client_id: submission.client_id,
            submission_id: submission.submission_id,
            reminder_type: 'incomplete_reminder',
            email_status: 'failed',
            error_message: error?.message || 'Unknown error',
            retry_count: 0,
          });

          return { success: false, email: submission.client_email, error: error?.message };
        }
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failureCount = results.length - successCount;

    console.log(`Reminders sent: ${successCount} successful, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        message: 'Reminder job completed',
        total: filteredSubmissions.length,
        successful: successCount,
        failed: failureCount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in send-form-reminder function:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
