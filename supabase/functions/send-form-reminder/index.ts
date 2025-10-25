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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY') || 'PLACEHOLDER_KEY';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

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

    console.log(`Found ${submissions.length} submissions needing reminders`);

    const results = await Promise.allSettled(
      submissions.map(async (submission) => {
        const formUrl = `${supabaseUrl.replace('xcvupdkdrrqjrgjzvhoy.supabase.co', 'lovable.app')}/forms/${submission.form_slug}/submit`;
        
        try {
          // Send email reminder
          const { data: emailData, error: emailError } = await resend.emails.send({
            from: 'Form Reminder <onboarding@resend.dev>',
            to: [submission.client_email],
            subject: `Reminder: Complete your ${submission.form_title}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Hi ${submission.client_full_name || 'there'},</h2>
                <p>This is a friendly reminder that you have a form in progress that needs to be completed.</p>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0;">${submission.form_title}</h3>
                  <p style="color: #666;">You started this form ${Math.round(submission.hours_since_update)} hours ago.</p>
                </div>
                <a href="${formUrl}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                  Continue Form
                </a>
                <p style="color: #888; font-size: 14px; margin-top: 30px;">
                  If you have any questions, please don't hesitate to reach out.
                </p>
              </div>
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
        total: submissions.length,
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
