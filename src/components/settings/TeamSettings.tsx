import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useOrgId } from '@/hooks/useOrgId';
import { useTeamManagement, type TeamMember } from '@/hooks/useTeamManagement';
import { InviteTeamMemberModal } from './InviteTeamMemberModal';

export function TeamSettings() {
  const { user } = useUser();
  const { toast } = useToast();
  const orgId = useOrgId();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  
  const teamManagement = useTeamManagement(orgId);

  useEffect(() => {
    if (user) {
      fetchTeamMembers();
    }
  }, [user]);

  const fetchTeamMembers = async () => {
    if (!orgId) return;
    
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('id, user_id, role, created_at, invitation_accepted_at, invited_email, invited_full_name')
        .eq('organization_id', orgId);

      if (error) throw error;

      // Fetch user details separately with proper error handling
      const membersWithUsers = await Promise.all(
        (data || []).map(async (member) => {
          try {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('full_name, email, avatar_url')
              .eq('id', member.user_id)
              .maybeSingle();

            // Use invited_email/invited_full_name for pending invites if user data doesn't exist
            return {
              ...member,
              users: userData || { 
                full_name: member.invited_full_name || 'Pending User', 
                email: member.invited_email || 'No email', 
                avatar_url: null 
              },
            };
          } catch (err) {
            // Fallback to invited data if user query fails
            return {
              ...member,
              users: { 
                full_name: member.invited_full_name || 'Pending User', 
                email: member.invited_email || 'No email', 
                avatar_url: null 
              },
            };
          }
        })
      );

      setMembers(membersWithUsers);
      
      // Get current user's role
      const currentMember = membersWithUsers.find(m => m.user_id === user?.id);
      setCurrentUserRole(currentMember?.role);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (email: string, fullName: string, role: 'member' | 'admin') => {
    const success = await teamManagement.inviteMember(email, fullName, role);
    if (success) {
      fetchTeamMembers();
    }
    return success;
  };

  const handleRoleChange = async (memberId: string, newRole: 'member' | 'admin' | 'owner') => {
    const success = await teamManagement.updateMemberRole(memberId, newRole);
    if (success) {
      fetchTeamMembers();
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const success = await teamManagement.removeMember(memberId);
    if (success) {
      fetchTeamMembers();
    }
    setRemovingMemberId(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const canManageTeam = teamManagement.canManageTeam(currentUserRole);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Manage your organization's team members and their roles
                </CardDescription>
              </div>
              <Button onClick={() => setInviteModalOpen(true)} disabled={!canManageTeam}>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No team members found.</p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => {
                      const isCurrentUser = member.user_id === user?.id;
                      const isOwner = member.role === 'owner';
                      const isLastOwnerUser = teamManagement.isLastOwner(members, member.id);
                      const isPending = !member.invitation_accepted_at;

                      return (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={member.users.avatar_url || undefined} />
                                <AvatarFallback>
                                  {getInitials(member.users.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {member.users.full_name}
                                  {isCurrentUser && <span className="text-muted-foreground ml-2">(You)</span>}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {member.users.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {canManageTeam && !isCurrentUser && !isOwner && !isPending ? (
                              <Select
                                value={member.role}
                                onValueChange={(value) => handleRoleChange(member.id, value as 'member' | 'admin' | 'owner')}
                                disabled={teamManagement.loading}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="member">Member</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Badge variant={getRoleBadgeVariant(member.role)}>
                                  {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                </Badge>
                                {isPending && <Badge variant="outline">Pending</Badge>}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {formatDistanceToNow(new Date(member.created_at), {
                              addSuffix: true,
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={!canManageTeam || isCurrentUser || isLastOwnerUser || teamManagement.loading}
                              onClick={() => setRemovingMemberId(member.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <InviteTeamMemberModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onInvite={handleInvite}
        loading={teamManagement.loading}
      />

      <AlertDialog open={removingMemberId !== null} onOpenChange={(open) => !open && setRemovingMemberId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this person from your organization. They will lose access to all organization resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removingMemberId && handleRemoveMember(removingMemberId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
