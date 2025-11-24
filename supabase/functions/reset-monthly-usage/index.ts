import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    console.log('Starting monthly usage reset...')

    // Reset automation and esignature run counters for all organizations
    const { data: orgs, error: fetchError } = await supabaseClient
      .from('organizations')
      .select('id, automation_runs_used, esignature_runs_used')

    if (fetchError) {
      throw fetchError
    }

    console.log(`Resetting usage for ${orgs?.length || 0} organizations`)

    // Reset all counters to 0
    const { error: updateError } = await supabaseClient
      .from('organizations')
      .update({
        automation_runs_used: 0,
        esignature_runs_used: 0,
      })
      .neq('id', '00000000-0000-0000-0000-000000000000') // Update all

    if (updateError) {
      throw updateError
    }

    // Log the reset in usage_tracking table
    const resetDate = new Date()
    const periodStart = new Date(resetDate.getFullYear(), resetDate.getMonth(), 1)
    const periodEnd = new Date(resetDate.getFullYear(), resetDate.getMonth() + 1, 0)

    for (const org of orgs || []) {
      await supabaseClient.from('usage_tracking').insert([
        {
          organization_id: org.id,
          metric: 'automation_runs_reset',
          value: org.automation_runs_used,
          period_start: periodStart.toISOString().split('T')[0],
          period_end: periodEnd.toISOString().split('T')[0],
        },
        {
          organization_id: org.id,
          metric: 'esignature_runs_reset',
          value: org.esignature_runs_used,
          period_start: periodStart.toISOString().split('T')[0],
          period_end: periodEnd.toISOString().split('T')[0],
        },
      ])
    }

    console.log('Monthly usage reset completed successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Monthly usage reset completed',
        organizations_reset: orgs?.length || 0,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error resetting monthly usage:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
