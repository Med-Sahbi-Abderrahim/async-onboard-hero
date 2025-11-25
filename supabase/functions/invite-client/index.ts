import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteClientRequest {
  email: string;
  full_name: string;
  company_name?: string;
  phone?: string;
  tags?: string[];
  organization_id: string;
  invited_by: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestData: InviteClientRequest = await req.json();

    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const publicAppUrl = Deno.env.get('PUBLIC_APP_URL') || 'https://kenly.io';
    let userId: string;
    let sendCustomEmail = false;
    
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === requestData.email);

    // Build context-aware redirect URL for client invitation
    const clientInviteUrl = `${publicAppUrl}/auth/callback?context=client&orgId=${requestData.organization_id}`;
    
    if (existingUser) {
      // User already exists - just update metadata, we'll send custom email
      userId = existingUser.id;
      console.log('Existing user found:', userId);
      
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...existingUser.user_metadata,
          full_name: requestData.full_name,
          is_client: true,
        },
      });
      
      sendCustomEmail = true;
    } else {
      // New user - use Supabase invitation with context-aware redirect
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        requestData.email,
        {
          redirectTo: clientInviteUrl,
          data: {
            full_name: requestData.full_name,
            is_client: true,
          },
        }
      );

      if (inviteError) {
        console.error('Error inviting user:', inviteError);
        return new Response(JSON.stringify({ error: inviteError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      userId = inviteData.user.id;
      console.log('Supabase invitation sent to new user:', requestData.email);
    }

    // Check if client already exists for this organization
    const { data: existingClient } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('organization_id', requestData.organization_id)
      .eq('email', requestData.email)
      .is('deleted_at', null)
      .single();

    if (existingClient) {
      return new Response(
        JSON.stringify({ error: 'Client already exists in your organization' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create client record with auto-generated unique ID
    // Link to auth user via user_id to allow same user across multiple organizations
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('clients')
      .insert({
        user_id: userId,  // Link to auth user
        organization_id: requestData.organization_id,
        email: requestData.email,
        full_name: requestData.full_name,
        company_name: requestData.company_name || null,
        phone: requestData.phone || null,
        tags: requestData.tags || [],
        invited_by: requestData.invited_by,
      })
      .select()
      .single();

    if (clientError) {
      console.error('Error creating client:', clientError);
      return new Response(JSON.stringify({ error: clientError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send custom invitation email for existing users with context-aware link
    if (sendCustomEmail) {
      const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
      // Direct portal URL for existing clients being added to new org
      const loginUrl = `${publicAppUrl}/client-portal/${clientData.id}`;
      
      try {
        const { error: emailError } = await resend.emails.send({
          from: 'Kenly <onboarding@kenly.io>',
          to: [requestData.email],
          subject: 'Welcome to Your Client Portal',
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                  .container { max-width: 600px; margin: 0 auto; }
                  .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 40px 30px; text-align: center; }
                  .content { background: #ffffff; padding: 40px 30px; }
                  .button { display: inline-block; background: #3b82f6; color: white !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                  .button:hover { background: #2563eb; }
                  .feature-list { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0; }
                  .feature-item { display: flex; align-items: start; margin-bottom: 12px; }
                  .feature-icon { color: #10b981; font-weight: bold; margin-right: 12px; font-size: 18px; }
                  .info-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin: 24px 0; }
                  .footer { text-align: center; padding: 30px; color: #6b7280; font-size: 14px; background: #f9fafb; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1 style="margin: 0; font-size: 32px; font-weight: 700;">Welcome to Your Client Portal</h1>
                  </div>
                  <div class="content">
                    <p style="font-size: 16px; margin-bottom: 24px;">Hi ${requestData.full_name},</p>
                    
                    <p style="font-size: 16px; margin-bottom: 24px;">
                      Great news! Your secure client portal is ready. This is your central hub for everything related to your project.
                    </p>
                    
                    <div class="feature-list">
                      <div class="feature-item">
                        <span class="feature-icon">✓</span>
                        <span><strong>Upload & Share Documents</strong> – Securely share files with your team</span>
                      </div>
                      <div class="feature-item">
                        <span class="feature-icon">✓</span>
                        <span><strong>View Contracts & Invoices</strong> – Access all your project documents in one place</span>
                      </div>
                      <div class="feature-item">
                        <span class="feature-icon">✓</span>
                        <span><strong>Schedule Meetings</strong> – Book time directly with your team</span>
                      </div>
                      <div class="feature-item">
                        <span class="feature-icon">✓</span>
                        <span><strong>Track Progress</strong> – See real-time project status and milestones</span>
                      </div>
                      <div class="feature-item">
                        <span class="feature-icon">✓</span>
                        <span><strong>Complete Forms</strong> – Fill out intake forms at your convenience</span>
                      </div>
                    </div>
                    
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${loginUrl}" class="button">
                        Access Your Portal →
                      </a>
                    </div>
                    
                    <div class="info-box">
                      <p style="margin: 0 0 8px 0; font-weight: 600;">Getting Started:</p>
                      <p style="margin: 0;">
                        Simply log in using your existing account credentials:<br/>
                        <strong>${requestData.email}</strong>
                      </p>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
                      Questions? Just reply to this email and we'll be happy to help.
                    </p>
                    
                    <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">
                      If you didn't expect this invitation, you can safely ignore this email.
                    </p>
                  </div>
                  <div class="footer">
                    <p style="margin: 0 0 8px 0;">Powered by Kenly</p>
                    <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                      This is an automated message. Please do not reply to this email.
                    </p>
                  </div>
                </div>
              </body>
            </html>
          `,
        });

        if (emailError) {
          console.error('Error sending custom invitation email:', emailError);
        } else {
          console.log('Custom invitation email sent to existing user:', requestData.email);
        }
      } catch (emailError) {
        console.error('Failed to send email via Resend:', emailError);
      }
    }

    return new Response(JSON.stringify({ client: clientData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in invite-client function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});