import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from 'https://esm.sh/resend@3.2.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteRequest {
  email: string;
  full_name: string;
  role: 'member' | 'admin';
  organization_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

    // Create authenticated client to verify the caller
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Create admin client for privileged operations
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

    const { email, full_name, role, organization_id }: InviteRequest = await req.json();

    console.log('Inviting team member:', { email, full_name, role, organization_id, inviter: user.id });

    // Verify inviter has admin or owner role
    const { data: inviterRole, error: roleError } = await supabaseAdmin
      .from('organization_members')
      .select('role')
      .eq('organization_id', organization_id)
      .eq('user_id', user.id)
      .single();

    if (roleError || !inviterRole || !['admin', 'owner'].includes(inviterRole.role)) {
      console.error('Permission denied:', { inviterRole, roleError });
      return new Response(JSON.stringify({ error: 'Permission denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user already exists in Supabase Auth
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser.users.find(u => u.email === email);

    let userId: string;

    if (userExists) {
      userId = userExists.id;
      console.log('User already exists:', userId);

      // Check if already a member
      const { data: existingMember } = await supabaseAdmin
        .from('organization_members')
        .select('id')
        .eq('organization_id', organization_id)
        .eq('user_id', userId)
        .single();

      if (existingMember) {
        return new Response(JSON.stringify({ error: 'User is already a team member' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Add to organization_members
      const { error: memberError } = await supabaseAdmin
        .from('organization_members')
        .insert({
          organization_id,
          user_id: userId,
          role,
          invited_by: user.id,
          invitation_accepted_at: new Date().toISOString(),
        });

      if (memberError) {
        console.error('Error adding member:', memberError);
        throw memberError;
      }

      // Send custom email for existing user
      const resend = new Resend(resendApiKey);
      const { data: orgData } = await supabaseAdmin
        .from('organizations')
        .select('name')
        .eq('id', organization_id)
        .single();

      const orgName = orgData?.name || 'the team';
      const appUrl = Deno.env.get('PUBLIC_APP_URL') || 'https://localhost:5173';
      const loginUrl = `${appUrl}/login?context=agency&orgId=${organization_id}`;

      await resend.emails.send({
        from: 'ClientForm <noreply@clientform.app>',
        to: email,
        subject: `You've been added to ${orgName}'s team`,
        html: `
          <h2>Welcome to ${orgName}!</h2>
          <p>You've been added as a <strong>${role}</strong> to the team.</p>
          <p>You can now log in and start collaborating:</p>
          <p><a href="${loginUrl}" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Log In to Dashboard</a></p>
          <p>Your role gives you the following permissions:</p>
          <ul>
            ${role === 'admin' ? '<li>Manage team members</li><li>Manage clients and forms</li><li>View all submissions</li>' : '<li>View and manage clients</li><li>Create and edit forms</li><li>View submissions</li>'}
          </ul>
        `,
      });
    } else {
      // Invite new user via Supabase Auth
      console.log('Inviting new user via Supabase Auth');
      const appUrl = Deno.env.get('PUBLIC_APP_URL') || 'https://localhost:5173';
      const redirectUrl = `${appUrl}/auth/callback?context=agency&orgId=${organization_id}`;

      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: redirectUrl,
        data: {
          full_name,
          organization_id,
          role,
          invited_by: user.id,
        },
      });

      if (inviteError) {
        console.error('Error inviting user:', inviteError);
        throw inviteError;
      }

      userId = inviteData.user.id;

      // Add to organization_members (invitation will be accepted on first login)
      const { error: memberError } = await supabaseAdmin
        .from('organization_members')
        .insert({
          organization_id,
          user_id: userId,
          role,
          invited_by: user.id,
        });

      if (memberError) {
        console.error('Error adding member:', memberError);
        throw memberError;
      }
    }

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      organization_id,
      user_id: user.id,
      action: 'invited',
      entity_type: 'user',
      entity_id: userId,
      description: `Invited ${email} as ${role}`,
      metadata: { email, role, full_name },
    });

    console.log('Team member invited successfully:', userId);

    return new Response(JSON.stringify({ success: true, user_id: userId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in invite-team-member:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
