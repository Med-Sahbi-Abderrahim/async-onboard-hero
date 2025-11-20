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

    // Send magic link to client using public URL
    const publicAppUrl = Deno.env.get('PUBLIC_APP_URL') || 'https://www.kenly.io';
    const { error: magicLinkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: requestData.email,
      options: {
        redirectTo: `${publicAppUrl}/client-portal`,
      },
    });

    if (magicLinkError) {
      console.error('Error generating magic link:', magicLinkError);
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