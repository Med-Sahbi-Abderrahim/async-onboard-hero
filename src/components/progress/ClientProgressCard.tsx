import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, AlertCircle, RefreshCcw, TrendingUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClientProgress } from "@/hooks/useClientProgress";
import { MilestoneTimeline } from "./MilestoneTimeline";
import { format } from "date-fns";

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Client Progress
              </CardTitle>
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
              <AlertCircle className="h-5 w-5 text-warning" />
              <h3 className="font-semibold">Pending Items ({progress.blockedItems.length})</h3>
            </div>
            <div className="space-y-2">
              {progress.blockedItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-warning/20 bg-warning/5 hover:bg-warning/10 transition-all animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Badge variant="outline" className="mt-0.5 border-warning/50 text-warning">
                    {item.type}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.title}</p>
                    {item.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        Due: {format(new Date(item.dueDate), "MMM dd, yyyy")}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success Message */}
        {progress.overall === 100 && (
          <div className="flex items-center gap-3 p-4 rounded-lg border-2 border-completed bg-completed/10 text-completed animate-success">
            <CheckCircle2 className="h-6 w-6" />
            <div>
              <p className="font-semibold">All items completed!</p>
              <p className="text-xs text-muted-foreground">Client onboarding is complete</p>
            </div>
          </div>
        )}
        </CardContent>
      </Card>

      {/* Milestone Timeline */}
      <MilestoneTimeline
        clientId={clientId}
        organizationId={organizationId}
        progress={progress}
      />
    </div>
  );
}