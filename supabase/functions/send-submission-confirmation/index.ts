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
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Extract user from JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Verify user has access - either as org member OR as the client who owns this submission
    const { data: membership } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', submission.organization_id)
      .maybeSingle();

    const { data: clientRecord } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .eq('id', submission.client_id)
      .maybeSingle();

    if (!membership && !clientRecord) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - not authorized to access this submission' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if confirmation emails are enabled for this form
    if (!intake_forms?.confirmation_email_enabled) {
      console.log('Confirmation emails disabled for this form');
      return new Response(
        JSON.stringify({ message: 'Confirmation emails disabled for this form' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public app URL for portal link
    const publicAppUrl = Deno.env.get('PUBLIC_APP_URL') || 'https://kenly.io';
    const portalUrl = `${publicAppUrl}/client-portal/${submission.organization_id}`;

    try {
      // Send confirmation email
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: 'Kenly <onboarding@kenly.io>',
        to: [clients.email],
        subject: `Form Received ✓ Your Portal is Ready`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
                .content { background: #ffffff; padding: 40px 30px; }
                .button { display: inline-block; background: #3b82f6; color: white !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                .button:hover { background: #2563eb; }
                .success-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; border-radius: 4px; margin: 24px 0; }
                .feature-list { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0; }
                .feature-item { display: flex; align-items: start; margin-bottom: 10px; font-size: 14px; }
                .feature-icon { color: #3b82f6; margin-right: 10px; font-weight: bold; }
                .footer { text-align: center; padding: 30px; color: #6b7280; font-size: 14px; background: #f9fafb; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0; font-size: 32px; font-weight: 700;">✓ Form Received!</h1>
                </div>
                <div class="content">
                  <p style="font-size: 16px; margin-bottom: 24px;">Hi ${clients.full_name || 'there'},</p>
                  
                  <p style="font-size: 16px; margin-bottom: 24px;">
                    Thanks for completing <strong>${intake_forms.title}</strong>! We've received your submission and our team will review it shortly.
                  </p>
                  
                  <div class="success-box">
                    <p style="margin: 0 0 8px 0; font-weight: 600; color: #065f46;">Submission Details:</p>
                    <p style="margin: 0; color: #065f46;">
                      <strong>Form:</strong> ${intake_forms.title}<br/>
                      <strong>Submitted:</strong> ${new Date(submission.submitted_at).toLocaleString()}<br/>
                      <strong>Status:</strong> Complete (${submission.completion_percentage}%)
                    </p>
                  </div>
                  
                  <h3 style="margin: 32px 0 16px 0; color: #111827;">Your Client Portal is Ready</h3>
                  <p style="font-size: 15px; margin-bottom: 16px;">
                    You now have access to your secure client portal where you can:
                  </p>
                  
                  <div class="feature-list">
                    <div class="feature-item">
                      <span class="feature-icon">•</span>
                      <span>Upload and share documents securely</span>
                    </div>
                    <div class="feature-item">
                      <span class="feature-icon">•</span>
                      <span>View contracts and invoices</span>
                    </div>
                    <div class="feature-item">
                      <span class="feature-icon">•</span>
                      <span>Schedule meetings with your team</span>
                    </div>
                    <div class="feature-item">
                      <span class="feature-icon">•</span>
                      <span>Track your project progress in real-time</span>
                    </div>
                  </div>
                  
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${portalUrl}" class="button">
                      Access Your Portal →
                    </a>
                  </div>
                  
                  <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
                    Need help or have questions? Just reply to this email and we'll be happy to assist.
                  </p>
                </div>
                <div class="footer">
                  <p style="margin: 0 0 8px 0;">Powered by Kenly</p>
                  <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                    This is an automated confirmation. Please do not reply directly to this email.
                  </p>
                </div>
              </div>
            </body>
          </html>
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
