import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateRoleRequest {
  member_id: string;
  new_role: 'member' | 'admin' | 'owner';
  organization_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { member_id, new_role, organization_id }: UpdateRoleRequest = await req.json();

    console.log('Updating member role:', { member_id, new_role, organization_id, updater: user.id });

    // Verify updater has admin or owner role
    const { data: updaterRole, error: roleError } = await supabaseAdmin
      .from('organization_members')
      .select('role')
      .eq('organization_id', organization_id)
      .eq('user_id', user.id)
      .single();

    if (roleError || !updaterRole || !['admin', 'owner'].includes(updaterRole.role)) {
      console.error('Permission denied:', { updaterRole, roleError });
      return new Response(JSON.stringify({ error: 'Permission denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the member being updated
    const { data: targetMember, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .select('user_id, role')
      .eq('id', member_id)
      .eq('organization_id', organization_id)
      .single();

    if (memberError || !targetMember) {
      console.error('Member not found:', memberError);
      return new Response(JSON.stringify({ error: 'Member not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prevent demoting the last owner
    if (targetMember.role === 'owner' && new_role !== 'owner') {
      const { data: ownerCount } = await supabaseAdmin
        .from('organization_members')
        .select('id', { count: 'exact' })
        .eq('organization_id', organization_id)
        .eq('role', 'owner');

      if (ownerCount && ownerCount.length <= 1) {
        return new Response(JSON.stringify({ error: 'Cannot demote the last owner' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Update the role
    const { error: updateError } = await supabaseAdmin
      .from('organization_members')
      .update({ role: new_role })
      .eq('id', member_id);

    if (updateError) {
      console.error('Error updating role:', updateError);
      throw updateError;
    }

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      organization_id,
      user_id: user.id,
      action: 'updated',
      entity_type: 'user',
      entity_id: targetMember.user_id,
      description: `Changed role from ${targetMember.role} to ${new_role}`,
      metadata: { old_role: targetMember.role, new_role },
    });

    console.log('Member role updated successfully');

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in update-member-role:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
