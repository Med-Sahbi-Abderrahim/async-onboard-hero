import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClientProgress } from "@/hooks/useClientProgress";

interface ClientProgressCardProps {
  clientId: string;
  organizationId: string;
}

export function ClientProgressCard({ clientId, organizationId }: ClientProgressCardProps) {
  const { progress, loading, refresh } = useClientProgress(clientId, organizationId);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (percentage: number) => {
    if (percentage === 100) return "text-completed";
    if (percentage >= 50) return "text-warning";
    return "text-blocked";
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage === 100) return <CheckCircle2 className="h-5 w-5 text-completed" />;
    if (percentage >= 50) return <Circle className="h-5 w-5 text-warning" />;
    return <AlertCircle className="h-5 w-5 text-blocked" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Client Progress</CardTitle>
            <CardDescription>Overall completion status</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={refresh}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(progress.overall)}
              <span className="font-semibold">Overall Progress</span>
            </div>
            <span className={`text-2xl font-bold ${getStatusColor(progress.overall)}`}>
              {progress.overall}%
            </span>
          </div>
          <Progress value={progress.overall} className="h-3" />
        </div>

        {/* Category Breakdown */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground">Breakdown</h3>

          {/* Tasks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                {getStatusIcon(progress.tasks.percentage)}
                Tasks
              </span>
              <span className="text-muted-foreground">
                {progress.tasks.completed} / {progress.tasks.total}
              </span>
            </div>
            <Progress value={progress.tasks.percentage} className="h-2" />
          </div>

          {/* Forms */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                {getStatusIcon(progress.forms.percentage)}
                Forms
              </span>
              <span className="text-muted-foreground">
                {progress.forms.completed} / {progress.forms.total}
              </span>
            </div>
            <Progress value={progress.forms.percentage} className="h-2" />
          </div>

          {/* Files */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                {getStatusIcon(progress.files.percentage)}
                Files
              </span>
              <span className="text-muted-foreground">{progress.files.uploaded} uploaded</span>
            </div>
            <Progress value={progress.files.percentage} className="h-2" />
          </div>

          {/* Contracts */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                {getStatusIcon(progress.contracts.percentage)}
                Contracts
              </span>
              <span className="text-muted-foreground">
                {progress.contracts.signed} / {progress.contracts.total}
              </span>
            </div>
            <Progress value={progress.contracts.percentage} className="h-2" />
          </div>
        </div>

        {/* Blocked Items */}
        {progress.blockedItems.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-warning" />
              <h3 className="font-semibold text-sm">Pending Items ({progress.blockedItems.length})</h3>
            </div>
            <div className="space-y-2">
              {progress.blockedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-2 text-sm p-2 rounded-lg bg-muted/50"
                >
                  <Badge variant="outline" className="mt-0.5">
                    {item.type}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium">{item.title}</p>
                    {item.dueDate && (
                      <p className="text-xs text-muted-foreground">
                        Due: {new Date(item.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success Message */}
        {progress.overall === 100 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 text-completed">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">All items completed!</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}