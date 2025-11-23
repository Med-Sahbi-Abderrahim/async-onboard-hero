import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  submissionId: string;
}

// Generate template-based summary from responses
function generateSubmissionSummary(fields: any[], responses: Record<string, any>): string {
  let summary = '';
  
  fields.forEach(field => {
    const value = responses[field.id];
    
    if (value !== undefined && value !== null && value !== '') {
      // Format the value based on field type
      let formattedValue = value;
      
      if (field.type === 'checkbox') {
        formattedValue = value ? 'Yes' : 'No';
      } else if (field.type === 'select' || field.type === 'radio') {
        formattedValue = value;
      } else if (field.type === 'date') {
        try {
          formattedValue = new Date(value).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        } catch (e) {
          formattedValue = value;
        }
      } else if (field.type === 'file') {
        formattedValue = '📎 File uploaded';
      } else if (typeof value === 'string' && value.length > 100) {
        // Truncate long text
        formattedValue = value.substring(0, 100) + '...';
      }
      
      summary += `<tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151; vertical-align: top;">${field.label}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${formattedValue}</td>
      </tr>`;
    }
  });
  
  return summary;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { submissionId }: NotificationRequest = await req.json();

    if (!submissionId) {
      return new Response(JSON.stringify({ error: 'submissionId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

    // Fetch submission with related data
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('form_submissions')
      .select(`
        *,
        client:clients!form_submissions_client_id_fkey(id, email, full_name, metadata, created_at),
        form:intake_forms!form_submissions_intake_form_id_fkey(id, title, slug, fields, organization_id)
      `)
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      console.error('Submission not found:', submissionError);
      return new Response(JSON.stringify({ error: 'Submission not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if client was auto-created
    const isAutoCreated = submission.client?.metadata?.auto_created === true;
    
    if (!isAutoCreated) {
      console.log('Client was not auto-created, skipping notification');
      return new Response(
        JSON.stringify({ message: 'Client was not auto-created, no notification sent' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Notifying agency about auto-created client for submission ${submissionId}`);

    // Fetch organization admins and owners
    const { data: adminMembers, error: membersError } = await supabaseAdmin
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', submission.form.organization_id)
      .in('role', ['admin', 'owner']);

    if (membersError || !adminMembers || adminMembers.length === 0) {
      console.error('No admin members found:', membersError);
      return new Response(JSON.stringify({ error: 'No admin members found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get admin email addresses
    const adminIds = adminMembers.map(m => m.user_id);
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError || !users) {
      console.error('Failed to fetch users:', usersError);
      return new Response(JSON.stringify({ error: 'Failed to fetch users' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminEmails = users.users
      .filter(u => adminIds.includes(u.id) && u.email)
      .map(u => u.email as string);

    if (adminEmails.length === 0) {
      console.error('No admin emails found');
      return new Response(JSON.stringify({ error: 'No admin emails found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate submission summary
    const summaryRows = generateSubmissionSummary(submission.form.fields || [], submission.responses || {});
    
    // Calculate time since client creation
    const clientCreatedAt = new Date(submission.client.created_at);
    const now = new Date();
    const minutesSinceCreation = Math.floor((now.getTime() - clientCreatedAt.getTime()) / 1000 / 60);
    const timeInfo = minutesSinceCreation < 60 
      ? `${minutesSinceCreation} minutes ago`
      : `${Math.floor(minutesSinceCreation / 60)} hours ago`;

    // Portal URL
    const portalUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}/client-portal`;

    // Send email to all admins
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">🎉 New Client Portal Access</h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 32px 24px;">
                <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
                  <p style="margin: 0; color: #166534; font-weight: 600;">
                    ✅ Automatic Portal Access Granted
                  </p>
                  <p style="margin: 8px 0 0 0; color: #166534; font-size: 14px;">
                    A new client was auto-created from a form submission and now has portal access.
                  </p>
                </div>
                
                <h2 style="color: #111827; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">Client Information</h2>
                <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; font-weight: 600; color: #374151; width: 140px;">Name:</td>
                      <td style="padding: 8px 0; color: #6b7280;">${submission.client.full_name || 'Not provided'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-weight: 600; color: #374151;">Email:</td>
                      <td style="padding: 8px 0; color: #6b7280;">${submission.client.email}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-weight: 600; color: #374151;">Created:</td>
                      <td style="padding: 8px 0; color: #6b7280;">${timeInfo}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-weight: 600; color: #374151;">Portal Status:</td>
                      <td style="padding: 8px 0;">
                        <span style="background-color: #22c55e; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                          Active
                        </span>
                      </td>
                    </tr>
                  </table>
                </div>

                <h2 style="color: #111827; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">Form Submission: ${submission.form.title}</h2>
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    ${summaryRows}
                  </table>
                </div>

                <div style="background-color: #eff6ff; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                  <p style="margin: 0 0 12px 0; color: #1e40af; font-weight: 600; font-size: 14px;">💡 What happens next?</p>
                  <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px;">
                    <li style="margin-bottom: 8px;">The client can now access their portal immediately</li>
                    <li style="margin-bottom: 8px;">They can view their submission, tasks, and files</li>
                    <li>You can manage their account from your dashboard</li>
                  </ul>
                </div>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${portalUrl}/clients/${submission.client.id}" 
                     style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    View Client Profile
                  </a>
                </div>

                <div style="text-align: center;">
                  <a href="${portalUrl}/forms/${submission.form.slug}/submissions/${submissionId}" 
                     style="color: #667eea; text-decoration: none; font-size: 14px;">
                    View Full Submission →
                  </a>
                </div>
              </div>

              <!-- Footer -->
              <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #6b7280; font-size: 12px;">
                  This is an automated notification from your client portal system.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Client Portal <onboarding@resend.dev>',
      to: adminEmails,
      subject: `🎉 New Client Auto-Created: ${submission.client.full_name || submission.client.email}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error('Failed to send email:', emailError);
      throw emailError;
    }

    console.log('Agency notification email sent successfully:', emailData);

    // Log the notification
    await supabaseAdmin.from('reminder_logs').insert({
      organization_id: submission.form.organization_id,
      client_id: submission.client.id,
      submission_id: submissionId,
      reminder_type: 'new_client_notification',
      email_status: 'sent',
      sent_at: new Date().toISOString(),
      metadata: {
        recipients: adminEmails,
        email_id: emailData?.id,
      },
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Agency notification sent',
        recipients: adminEmails.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in notify-agency-new-client function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
