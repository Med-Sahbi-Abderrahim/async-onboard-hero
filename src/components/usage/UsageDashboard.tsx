import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Database, Zap, FileSignature, ArrowUpCircle } from "lucide-react";
import { useOrgLimits } from "@/hooks/useOrgLimits";
import { useState } from "react";
import { UpgradeModal } from "@/components/UpgradeModal";

interface UsageDashboardProps {
  organizationId: string;
}

export function UsageDashboard({ organizationId }: UsageDashboardProps) {
  const { limits, loading } = useOrgLimits(organizationId);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeTrigger, setUpgradeTrigger] = useState<'storage' | 'automation' | 'esignature'>('storage');

  if (loading || !limits) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage & Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-16 bg-muted animate-pulse rounded" />
            <div className="h-16 bg-muted animate-pulse rounded" />
            <div className="h-16 bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const storageUsedGB = limits.storageUsedBytes / (1024 * 1024 * 1024);
  const storagePercentage = (storageUsedGB / limits.maxStorageGB) * 100;

  const totalAutomationRuns = limits.automationRunsPerUser * limits.activeUserCount;
  const automationPercentage = totalAutomationRuns >= 999999 
    ? 0 
    : (limits.automationRunsUsed / totalAutomationRuns) * 100;

  const totalEsignatureRuns = limits.esignatureRunsPerUser * limits.activeUserCount;
  const esignaturePercentage = totalEsignatureRuns >= 999999 
    ? 0 
    : (limits.esignatureRunsUsed / totalEsignatureRuns) * 100;

  const handleUpgrade = (type: 'storage' | 'automation' | 'esignature') => {
    setUpgradeTrigger(type);
    setShowUpgradeModal(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Usage & Limits</CardTitle>
          <CardDescription>
            Track your monthly resource usage across your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Storage Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Storage</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {storageUsedGB.toFixed(2)} / {limits.maxStorageGB} GB
              </span>
            </div>
            <Progress value={storagePercentage} className="h-2" />
            {storagePercentage > 80 && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-orange-600 dark:text-orange-400">
                  {storagePercentage > 95 ? 'Storage almost full' : 'Storage running low'}
                </span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleUpgrade('storage')}
                >
                  <ArrowUpCircle className="h-3 w-3 mr-1" />
                  Upgrade
                </Button>
              </div>
            )}
          </div>

          {/* Automation Runs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Automation Runs</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {totalAutomationRuns >= 999999 
                  ? 'Unlimited' 
                  : `${limits.automationRunsUsed} / ${totalAutomationRuns}`
                }
              </span>
            </div>
            {totalAutomationRuns < 999999 ? (
              <>
                <Progress value={automationPercentage} className="h-2" />
                {automationPercentage > 80 && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-orange-600 dark:text-orange-400">
                      {automationPercentage > 95 ? 'Limit almost reached' : 'Running low on automation runs'}
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleUpgrade('automation')}
                    >
                      <ArrowUpCircle className="h-3 w-3 mr-1" />
                      Upgrade
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-green-600 dark:text-green-400">
                Unlimited automation runs on your plan
              </div>
            )}
          </div>

          {/* E-signature Runs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSignature className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">E-signature Runs</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {totalEsignatureRuns >= 999999 
                  ? 'Unlimited' 
                  : `${limits.esignatureRunsUsed} / ${totalEsignatureRuns}`
                }
              </span>
            </div>
            {totalEsignatureRuns < 999999 ? (
              <>
                <Progress value={esignaturePercentage} className="h-2" />
                {esignaturePercentage > 80 && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-orange-600 dark:text-orange-400">
                      {esignaturePercentage > 95 ? 'Limit almost reached' : 'Running low on e-signature runs'}
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleUpgrade('esignature')}
                    >
                      <ArrowUpCircle className="h-3 w-3 mr-1" />
                      Upgrade
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-green-600 dark:text-green-400">
                Unlimited e-signature runs on your plan
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Usage resets on the 1st of each month. Current plan: <span className="font-semibold capitalize">{limits.plan}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        limitType={upgradeTrigger}
        currentPlan={limits.plan}
        organizationId={organizationId}
      />
    </>
  );
}
