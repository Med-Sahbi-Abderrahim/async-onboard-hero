import { useParams } from "react-router-dom";
import { TaskList } from "@/components/tasks/TaskList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BrandedFooter } from "@/components/BrandedFooter";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useClientData } from "@/hooks/useClientData";

export default function ClientPortalTasks() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const { client, loading } = useClientData(orgId);

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

  if (!client || !orgId) {
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
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-accent hover:text-accent-foreground transition"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div>
              <CardTitle>My Tasks</CardTitle>
              <CardDescription>View and manage your assigned tasks</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <TaskList clientId={client.id} organizationId={orgId} isClient={true} />
        </CardContent>
      </Card>

      {client && <BrandedFooter organizationId={client.organization_id} />}
    </div>
  );
}
