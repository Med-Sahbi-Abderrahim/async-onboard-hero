import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckoutRequest {
  plan: 'starter' | 'pro';
  organizationId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { plan, organizationId }: CheckoutRequest = await req.json();

    // Verify user belongs to organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      throw new Error('User not authorized for this organization');
    }

    // Get organization details
    const { data: org } = await supabase
      .from('organizations')
      .select('name, id')
      .eq('id', organizationId)
      .single();

    if (!org) {
      throw new Error('Organization not found');
    }

    // Define variant IDs for each plan (you'll need to replace these with your actual Lemon Squeezy variant IDs)
    const variantIds = {
      starter: Deno.env.get('LEMONSQUEEZY_STARTER_VARIANT_ID') || '',
      pro: Deno.env.get('LEMONSQUEEZY_PRO_VARIANT_ID') || '',
    };

    const variantId = variantIds[plan];
    if (!variantId) {
      throw new Error('Invalid plan selected');
    }

    const storeId = Deno.env.get('LEMONSQUEEZY_STORE_ID');
    const apiKey = Deno.env.get('LEMONSQUEEZY_API_KEY');

    if (!storeId || !apiKey) {
      throw new Error('Lemon Squeezy configuration missing');
    }

    // Create checkout session
    const checkoutResponse = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: user.email,
              custom: {
                organization_id: organizationId,
                user_id: user.id,
              },
            },
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: storeId,
              },
            },
            variant: {
              data: {
                type: 'variants',
                id: variantId,
              },
            },
          },
        },
      }),
    });

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.text();
      console.error('Lemon Squeezy API error:', errorData);
      throw new Error('Failed to create checkout session');
    }

    const checkoutData = await checkoutResponse.json();
    const checkoutUrl = checkoutData.data.attributes.url;

    console.log('Checkout session created:', checkoutUrl);

    return new Response(
      JSON.stringify({ url: checkoutUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating checkout:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
