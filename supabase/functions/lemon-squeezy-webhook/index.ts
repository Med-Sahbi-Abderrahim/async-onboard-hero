import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from "https://deno.land/std@0.224.0/crypto/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const signature = req.headers.get('X-Signature');
    const webhookSecret = Deno.env.get('LEMONSQUEEZY_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) {
      console.error('Missing signature or webhook secret');
      throw new Error('Unauthorized webhook request');
    }

    const rawBody = await req.text();
    
    // Verify webhook signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(webhookSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature_bytes = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(rawBody)
    );
    const digest = Array.from(new Uint8Array(signature_bytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (digest !== signature) {
      console.error('Invalid webhook signature');
      throw new Error('Invalid signature');
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta.event_name;
    const customData = payload.meta.custom_data;
    const organizationId = customData?.organization_id;

    console.log('Webhook event:', eventName, 'for organization:', organizationId);

    if (!organizationId) {
      console.error('No organization ID in webhook payload');
      throw new Error('Missing organization ID');
    }

    // Handle different webhook events
    switch (eventName) {
      case 'order_created':
        console.log('Order created event received');
        // Initial order, subscription will be created separately
        break;

      case 'subscription_created':
      case 'subscription_updated': {
        const subscription = payload.data.attributes;
        const planName = subscription.variant_name?.toLowerCase() || 'free';
        
        let plan = 'free';
        if (planName.includes('starter')) plan = 'starter';
        else if (planName.includes('pro')) plan = 'pro';

        const updateData = {
          plan,
          lemonsqueezy_customer_id: subscription.customer_id?.toString(),
          lemonsqueezy_subscription_id: subscription.id?.toString(),
          subscription_status: subscription.status,
          subscription_renewal_date: subscription.renews_at,
        };

        console.log('Updating organization:', updateData);

        const { error: updateError } = await supabase
          .from('organizations')
          .update(updateData)
          .eq('id', organizationId);

        if (updateError) {
          console.error('Error updating organization:', updateError);
          throw updateError;
        }

        console.log('Organization updated successfully');
        break;
      }

      case 'subscription_cancelled':
      case 'subscription_expired':
      case 'subscription_paused': {
        console.log('Subscription ended, downgrading to free plan');

        const { error: downgradeError } = await supabase
          .from('organizations')
          .update({
            plan: 'free',
            subscription_status: 'cancelled',
          })
          .eq('id', organizationId);

        if (downgradeError) {
          console.error('Error downgrading organization:', downgradeError);
          throw downgradeError;
        }

        console.log('Organization downgraded to free plan');
        break;
      }

      case 'subscription_resumed': {
        const subscription = payload.data.attributes;
        
        const { error: resumeError } = await supabase
          .from('organizations')
          .update({
            subscription_status: subscription.status,
          })
          .eq('id', organizationId);

        if (resumeError) {
          console.error('Error resuming subscription:', resumeError);
          throw resumeError;
        }

        console.log('Subscription resumed');
        break;
      }

      default:
        console.log('Unhandled webhook event:', eventName);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
