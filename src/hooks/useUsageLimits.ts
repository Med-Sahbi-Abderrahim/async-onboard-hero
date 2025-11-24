import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useUsageLimits() {
  const { toast } = useToast();

  const incrementAutomationUsage = async (organizationId: string): Promise<boolean> => {
    try {
      // Get current organization data
      const { data: org, error: fetchError } = await supabase
        .from('organizations')
        .select('automation_runs_used, automation_runs_per_user, active_user_count')
        .eq('id', organizationId)
        .single();

      if (fetchError) throw fetchError;

      const totalAllowed = org.automation_runs_per_user * org.active_user_count;
      
      // Check if limit would be exceeded
      if (org.automation_runs_used >= totalAllowed && totalAllowed < 999999) {
        toast({
          title: "Automation limit reached",
          description: `You've used all ${totalAllowed} automation runs for this month. Upgrade to increase your limit.`,
          variant: "destructive",
        });
        return false;
      }

      // Increment usage
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ automation_runs_used: org.automation_runs_used + 1 })
        .eq('id', organizationId);

      if (updateError) throw updateError;

      return true;
    } catch (error) {
      console.error('Error incrementing automation usage:', error);
      return false;
    }
  };

  const incrementEsignatureUsage = async (organizationId: string): Promise<boolean> => {
    try {
      // Get current organization data
      const { data: org, error: fetchError } = await supabase
        .from('organizations')
        .select('esignature_runs_used, esignature_runs_per_user, active_user_count')
        .eq('id', organizationId)
        .single();

      if (fetchError) throw fetchError;

      const totalAllowed = org.esignature_runs_per_user * org.active_user_count;
      
      // Check if limit would be exceeded
      if (org.esignature_runs_used >= totalAllowed && totalAllowed < 999999) {
        toast({
          title: "E-signature limit reached",
          description: `You've used all ${totalAllowed} e-signature runs for this month. Upgrade to increase your limit.`,
          variant: "destructive",
        });
        return false;
      }

      // Increment usage
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ esignature_runs_used: org.esignature_runs_used + 1 })
        .eq('id', organizationId);

      if (updateError) throw updateError;

      return true;
    } catch (error) {
      console.error('Error incrementing e-signature usage:', error);
      return false;
    }
  };

  const checkStorageLimit = async (organizationId: string, fileSizeBytes: number): Promise<boolean> => {
    try {
      const { data: org, error } = await supabase
        .from('organizations')
        .select('storage_used_bytes, max_storage_gb')
        .eq('id', organizationId)
        .single();

      if (error) throw error;

      const maxStorageBytes = org.max_storage_gb * 1024 * 1024 * 1024;
      const wouldExceed = (org.storage_used_bytes + fileSizeBytes) > maxStorageBytes;

      if (wouldExceed) {
        const usedGB = (org.storage_used_bytes / (1024 * 1024 * 1024)).toFixed(2);
        toast({
          title: "Storage limit reached",
          description: `You've used ${usedGB}GB of ${org.max_storage_gb}GB. Delete files or upgrade for more storage.`,
          variant: "destructive",
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking storage limit:', error);
      return false;
    }
  };

  return {
    incrementAutomationUsage,
    incrementEsignatureUsage,
    checkStorageLimit,
  };
}
