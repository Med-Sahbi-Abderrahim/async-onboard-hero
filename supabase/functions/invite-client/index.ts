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

    // Check if an auth user already exists with this email
    let userId: string;
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === requestData.email);

    if (existingUser) {
      // User already exists, reuse their ID
      userId = existingUser.id;
      console.log('Reusing existing auth user:', userId);
      
      // Update user metadata to ensure is_client flag is set
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...existingUser.user_metadata,
          full_name: requestData.full_name,
          is_client: true,
        },
      });
    } else {
      // Create new auth user
      const tempPassword = crypto.randomUUID();
      const { data: authData, error: authUserError } = await supabaseAdmin.auth.admin.createUser({
        email: requestData.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: requestData.full_name,
          is_client: true,
        },
      });

      if (authUserError) {
        console.error('Error creating auth user:', authUserError);
        return new Response(JSON.stringify({ error: authUserError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      userId = authData.user.id;
      console.log('Created new auth user:', userId);
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

    // Create client record with the auth user's ID
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('clients')
      .insert({
        id: userId, // Use the auth user ID (existing or new)
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

    // Generate password setup link with longer expiration
    const publicAppUrl = Deno.env.get('PUBLIC_APP_URL') || 'https://kenly.io';
    
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: requestData.email,
      options: {
        redirectTo: `${publicAppUrl}/auth/callback`,
      },
    });

    if (linkError) {
      console.error('Error generating password setup link:', linkError);
      return new Response(JSON.stringify({ error: 'Failed to generate invitation link' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send invitation email via Resend with password setup link
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    try {
      const setupUrl = linkData.properties.action_link;
      
      const { error: emailError } = await resend.emails.send({
        from: 'Kenly <onboarding@kenly.io>',
        to: [requestData.email],
        subject: 'Welcome to Your Client Portal',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
                .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
                .button { display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
                .button:hover { background: #2563eb; }
                .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
                .info-box { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0; font-size: 28px;">Welcome to Your Client Portal</h1>
                </div>
                <div class="content">
                  <p>Hi ${requestData.full_name},</p>
                  
                  <p>You've been invited to access your client portal. This is your central hub to:</p>
                  
                  <ul>
                    <li>Fill out intake forms</li>
                    <li>Upload and share documents</li>
                    <li>Schedule meetings</li>
                    <li>View contracts and invoices</li>
                    <li>Track your project status</li>
                  </ul>
                  
                  <div style="text-align: center;">
                    <a href="${setupUrl}" class="button">
                      Set Up Your Password
                    </a>
                  </div>
                  
                  <div class="info-box">
                    <p style="margin: 0;"><strong>First time setup:</strong></p>
                    <p style="margin: 5px 0 0 0;">Click the button above to create your password and access your portal. This link will expire in 24 hours.</p>
                  </div>
                  
                  <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                    If you didn't expect this invitation, you can safely ignore this email.
                  </p>
                </div>
                <div class="footer">
                  <p>Powered by Kenly</p>
                  <p style="font-size: 12px; color: #9ca3af;">
                    This is an automated message. Please do not reply to this email.
                  </p>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      if (emailError) {
        console.error('Error sending invitation email:', emailError);
      } else {
        console.log('Invitation email sent successfully to:', requestData.email);
      }
    } catch (emailError) {
      console.error('Failed to send email via Resend:', emailError);
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