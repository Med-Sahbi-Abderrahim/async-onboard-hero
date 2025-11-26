import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RemoveMemberRequest {
  member_id: string;
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

    const { member_id, organization_id }: RemoveMemberRequest = await req.json();

    console.log('Removing team member:', { member_id, organization_id, remover: user.id });

    // Verify remover has admin or owner role
    const { data: removerRole, error: roleError } = await supabaseAdmin
      .from('organization_members')
      .select('role')
      .eq('organization_id', organization_id)
      .eq('user_id', user.id)
      .single();

    if (roleError || !removerRole || !['admin', 'owner'].includes(removerRole.role)) {
      console.error('Permission denied:', { removerRole, roleError });
      return new Response(JSON.stringify({ error: 'Permission denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the member being removed
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

    // Prevent removing yourself
    if (targetMember.user_id === user.id) {
      return new Response(JSON.stringify({ error: 'Cannot remove yourself from the team' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prevent removing the last owner
    if (targetMember.role === 'owner') {
      const { data: ownerCount } = await supabaseAdmin
        .from('organization_members')
        .select('id', { count: 'exact' })
        .eq('organization_id', organization_id)
        .eq('role', 'owner');

      if (ownerCount && ownerCount.length <= 1) {
        return new Response(JSON.stringify({ error: 'Cannot remove the last owner' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Get user email for logging
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('email, full_name')
      .eq('id', targetMember.user_id)
      .single();

    // Soft-delete the member (set deleted_at instead of hard-deleting)
    // This preserves audit trail and allows recovery if needed
    const { error: deleteError } = await supabaseAdmin
      .from('organization_members')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', member_id);

    if (deleteError) {
      console.error('Error removing member:', deleteError);
      throw deleteError;
    }

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      organization_id,
      user_id: user.id,
      action: 'deleted',
      entity_type: 'user',
      entity_id: targetMember.user_id,
      description: `Removed ${userData?.email || 'team member'} from team`,
      metadata: { role: targetMember.role, email: userData?.email },
    });

    console.log('Team member removed successfully');

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in remove-team-member:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
