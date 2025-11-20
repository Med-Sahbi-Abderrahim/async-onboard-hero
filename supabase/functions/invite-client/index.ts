import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    // Use Supabase's built-in invitation system for all users
    const publicAppUrl = Deno.env.get('PUBLIC_APP_URL') || 'https://kenly.io';
    let userId: string;
    
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === requestData.email);

    if (existingUser) {
      // User already exists - update metadata and send password reset
      userId = existingUser.id;
      console.log('Existing user found:', userId);
      
      // Update user metadata
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...existingUser.user_metadata,
          full_name: requestData.full_name,
          is_client: true,
        },
      });

      // Send password reset email to give them access
      const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
        requestData.email,
        {
          redirectTo: `${publicAppUrl}/auth/callback`,
        }
      );

      if (resetError) {
        console.error('Error sending password reset:', resetError);
        return new Response(JSON.stringify({ error: resetError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Password reset email sent to existing user:', requestData.email);
    } else {
      // New user - send invitation
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        requestData.email,
        {
          redirectTo: `${publicAppUrl}/auth/callback`,
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
      console.log('Invitation email sent to new user:', requestData.email);
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

    // Email has been sent by Supabase (invitation or password reset)

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