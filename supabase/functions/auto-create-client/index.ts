import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutoCreateClientRequest {
  email: string;
  full_name?: string;
  organization_id: string;
  form_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the authenticated user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

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

    const requestData: AutoCreateClientRequest = await req.json();

    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`Auto-creating client for user ${user.id} in org ${requestData.organization_id}`);

    // Check if client already exists for this organization
    const { data: existingClient } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('id', user.id)
      .eq('organization_id', requestData.organization_id)
      .is('deleted_at', null)
      .maybeSingle();

    if (existingClient) {
      console.log('Client already exists');
      return new Response(
        JSON.stringify({ 
          client: existingClient,
          message: 'Client already exists'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create client record
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('clients')
      .insert({
        id: user.id,
        organization_id: requestData.organization_id,
        email: requestData.email || user.email,
        full_name: requestData.full_name || user.user_metadata?.full_name || user.email?.split('@')[0],
        status: 'active',
        metadata: {
          created_from: 'form_submission',
          form_id: requestData.form_id,
          auto_created: true,
        },
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

    console.log(`Successfully auto-created client ${clientData.id}`);

    return new Response(
      JSON.stringify({ 
        client: clientData,
        message: 'Client created successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in auto-create-client function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
