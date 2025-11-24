import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TaskList } from "@/components/tasks/TaskList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BrandedFooter } from "@/components/BrandedFooter";

export default function ClientPortalTasks() {
  const { orgId } = useParams<{ orgId: string }>();
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getClientId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get the client record ID using user_id
        const { data: clientData } = await supabase
          .from("clients")
          .select("id")
          .eq("user_id", user.id)
          .eq("organization_id", orgId)
          .is("deleted_at", null)
          .single();
        
        if (clientData) {
          setClientId(clientData.id);
        }
      }
      setLoading(false);
    };
    getClientId();
  }, [orgId]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6 animate-fade-in">
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientId || !orgId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Missing required parameters</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Tasks</CardTitle>
          <CardDescription>
            View and manage your assigned tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TaskList
            clientId={clientId}
            organizationId={orgId}
            isClient={true}
          />
        </CardContent>
      </Card>
      
      {orgId && <BrandedFooter organizationId={orgId} />}
    </div>
  );
}