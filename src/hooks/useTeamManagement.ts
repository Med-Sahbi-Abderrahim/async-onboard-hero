import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TeamMember {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
  invitation_accepted_at: string | null;
  users: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

export function useTeamManagement(organizationId: string | undefined) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const inviteMember = async (email: string, fullName: string, role: 'member' | 'admin') => {
    if (!organizationId) {
      toast({
        title: 'Error',
        description: 'Organization ID is required',
        variant: 'destructive',
      });
      return false;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-team-member', {
        body: {
          email,
          full_name: fullName,
          role,
          organization_id: organizationId,
        },
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Invitation sent to ${email}`,
      });

      return true;
    } catch (error: any) {
      console.error('Error inviting member:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to invite team member',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateMemberRole = async (memberId: string, newRole: 'member' | 'admin' | 'owner') => {
    if (!organizationId) return false;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-member-role', {
        body: {
          member_id: memberId,
          new_role: newRole,
          organization_id: organizationId,
        },
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Member role updated successfully',
      });

      return true;
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update member role',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!organizationId) return false;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('remove-team-member', {
        body: {
          member_id: memberId,
          organization_id: organizationId,
        },
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Team member removed successfully',
      });

      return true;
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove team member',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const canManageTeam = (currentUserRole: string | undefined) => {
    return currentUserRole === 'admin' || currentUserRole === 'owner';
  };

  const isLastOwner = (members: TeamMember[], memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (member?.role !== 'owner') return false;
    
    const ownerCount = members.filter(m => m.role === 'owner').length;
    return ownerCount === 1;
  };

  return {
    inviteMember,
    updateMemberRole,
    removeMember,
    canManageTeam,
    isLastOwner,
    loading,
  };
}
