import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/UserContext';

export type MilestoneType = 'onboarding' | 'first_submission' | 'first_automation';

/**
 * Hook to track and trigger milestone emails
 */
export const useMilestoneTracking = () => {
  const { user } = useUser();

  const triggerMilestone = async (milestoneType: MilestoneType) => {
    if (!user?.id) {
      console.warn('Cannot trigger milestone: user not authenticated');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('trigger-milestone-email', {
        body: {
          userId: user.id,
          milestoneType,
        },
      });

      if (error) {
        console.error('Error triggering milestone:', error);
        return;
      }

      if (data?.milestoneSent) {
        console.log(`Milestone ${milestoneType} triggered successfully`);
      }
    } catch (error) {
      console.error('Failed to trigger milestone:', error);
    }
  };

  return { triggerMilestone };
};

/**
 * Hook to automatically trigger the onboarding milestone when first client is created
 */
export const useOnboardingMilestone = (clientCount: number) => {
  const { triggerMilestone } = useMilestoneTracking();

  useEffect(() => {
    // Trigger onboarding milestone when first client is created
    if (clientCount === 1) {
      triggerMilestone('onboarding');
    }
  }, [clientCount]);
};

/**
 * Hook to automatically trigger the first submission milestone
 */
export const useFirstSubmissionMilestone = (submissionCount: number) => {
  const { triggerMilestone } = useMilestoneTracking();

  useEffect(() => {
    // Trigger first submission milestone when first submission is received
    if (submissionCount === 1) {
      triggerMilestone('first_submission');
    }
  }, [submissionCount]);
};

/**
 * Hook to automatically trigger the first automation milestone
 */
export const useFirstAutomationMilestone = (hasAutomations: boolean) => {
  const { triggerMilestone } = useMilestoneTracking();

  useEffect(() => {
    // Trigger first automation milestone when automation is set up
    if (hasAutomations) {
      triggerMilestone('first_automation');
    }
  }, [hasAutomations]);
};
