import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Copy, Check } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

export default function EarlyAccessAdmin() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [maxUses, setMaxUses] = useState("1");
  const [daysValid, setDaysValid] = useState("30");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Check if user is authorized (owner role)
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Check if user has owner role in any organization
      const { data: membership } = await supabase
        .from("organization_members")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "owner")
        .is('deleted_at', null)
        .single();

      if (!membership) {
        toast({
          title: "Unauthorized",
          description: "You don't have permission to access this page",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAuthorized(true);
    };

    checkAuth();
  }, [navigate, toast]);

  // Fetch existing invites
  const { data: invites, isLoading } = useQuery({
    queryKey: ["early-access-invites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("early_access_invites")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Create invite mutation
  const createInvite = useMutation({
    mutationFn: async () => {
      const code = `EA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(daysValid));

      const { data, error } = await supabase
        .from("early_access_invites")
        .insert({
          code,
          max_uses: parseInt(maxUses),
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["early-access-invites"] });
      toast({
        title: "Invite Created",
        description: "Early access invite code generated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyInviteLink = (code: string) => {
    const link = `${window.location.origin}/signup?invite=${code}`;
    navigator.clipboard.writeText(link);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Copied!",
      description: "Invite link copied to clipboard",
    });
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Checking authorization...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Early Access Admin</h2>
          <p className="text-muted-foreground mt-2">Manage early access invites and codes</p>
        </div>
        {/* Create New Invite */}
        <Card>
          <CardHeader>
            <CardTitle>Create Early Access Invite</CardTitle>
            <CardDescription>
              Generate invite codes for early access users (30 days Pro plan)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maxUses">Max Uses</Label>
                <Input
                  id="maxUses"
                  type="number"
                  min="1"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="daysValid">Days Valid</Label>
                <Input
                  id="daysValid"
                  type="number"
                  min="1"
                  value={daysValid}
                  onChange={(e) => setDaysValid(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={() => createInvite.mutate()}
              disabled={createInvite.isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              Generate Invite Code
            </Button>
          </CardContent>
        </Card>

        {/* Existing Invites */}
        <Card>
          <CardHeader>
            <CardTitle>Active Invite Codes</CardTitle>
            <CardDescription>Manage and share early access invites</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading invites...</p>
            ) : invites && invites.length > 0 ? (
              <div className="space-y-3">
                {invites.map((invite) => {
                  const isExpired = new Date(invite.expires_at) < new Date();
                  const isMaxed = invite.used_count >= invite.max_uses;
                  const isInactive = !invite.is_active || isExpired || isMaxed;

                  return (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <code className="font-mono font-semibold">{invite.code}</code>
                          {isInactive && (
                            <Badge variant="secondary">
                              {isExpired ? "Expired" : isMaxed ? "Max Uses" : "Inactive"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Used {invite.used_count} / {invite.max_uses} •{" "}
                          Expires {new Date(invite.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyInviteLink(invite.code)}
                        disabled={isInactive}
                      >
                        {copiedId === invite.code ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Link
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground">No invite codes yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
