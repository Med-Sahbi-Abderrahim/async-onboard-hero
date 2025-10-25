import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConfirmationRequest {
  submissionId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submissionId }: ConfirmationRequest = await req.json();

    if (!submissionId) {
      return new Response(
        JSON.stringify({ error: 'submissionId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY') || 'PLACEHOLDER_KEY';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    console.log(`Sending confirmation for submission ${submissionId}`);

    // Fetch submission details
    const { data: submission, error: fetchError } = await supabase
      .from('form_submissions')
      .select(`
        id,
        organization_id,
        client_id,
        completion_percentage,
        submitted_at,
        clients (
          email,
          full_name
        ),
        intake_forms (
          title,
          confirmation_email_enabled
        )
      `)
      .eq('id', submissionId)
      .single();

    if (fetchError) {
      console.error('Error fetching submission:', fetchError);
      throw fetchError;
    }

    if (!submission) {
      return new Response(
        JSON.stringify({ error: 'Submission not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { clients, intake_forms } = submission as any;

    // Check if confirmation emails are enabled for this form
    if (!intake_forms?.confirmation_email_enabled) {
      console.log('Confirmation emails disabled for this form');
      return new Response(
        JSON.stringify({ message: 'Confirmation emails disabled for this form' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      // Send confirmation email
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: 'Form Confirmation <onboarding@resend.dev>',
        to: [clients.email],
        subject: `Confirmation: Your ${intake_forms.title} has been received`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Thank you, ${clients.full_name || 'valued client'}!</h2>
            <p>We have successfully received your completed form submission.</p>
            <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #065f46;">${intake_forms.title}</h3>
              <p style="margin: 5px 0;"><strong>Submitted:</strong> ${new Date(submission.submitted_at).toLocaleString()}</p>
              <p style="margin: 5px 0;"><strong>Completion:</strong> ${submission.completion_percentage}%</p>
            </div>
            <p>Our team will review your submission and get back to you shortly.</p>
            <p style="color: #888; font-size: 14px; margin-top: 30px;">
              If you have any questions or need to make changes, please contact us.
            </p>
          </div>
        `,
      });

      if (emailError) {
        throw emailError;
      }

      // Log successful confirmation
      const { error: logError } = await supabase.from('reminder_logs').insert({
        organization_id: submission.organization_id,
        client_id: submission.client_id,
        submission_id: submission.id,
        reminder_type: 'submission_confirmation',
        email_status: 'sent',
        metadata: {
          email_id: emailData?.id,
          completion_percentage: submission.completion_percentage,
        },
      });

      if (logError) {
        console.error('Error logging confirmation:', logError);
      }

      console.log(`Confirmation sent to ${clients.email}`);
      
      return new Response(
        JSON.stringify({
          message: 'Confirmation email sent successfully',
          email: clients.email,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (error: any) {
      console.error(`Failed to send confirmation to ${clients.email}:`, error);

      // Log failed confirmation with retry
      await supabase.from('reminder_logs').insert({
        organization_id: submission.organization_id,
        client_id: submission.client_id,
        submission_id: submission.id,
        reminder_type: 'submission_confirmation',
        email_status: 'failed',
        error_message: error?.message || 'Unknown error',
        retry_count: 0,
      });

      throw error;
    }
  } catch (error: any) {
    console.error('Error in send-submission-confirmation function:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
