import { useMutation, useQueryClient } from '@tanstack/react-query';
import { executeTransition, EntityType, TransitionParams } from '@/lib/workflowEngine';
import { useAdminAuth } from '@/hooks/useAdminAuth';

type TransitionInput = Omit<TransitionParams, 'entityType' | 'adminEmail' | 'adminUserId'>;

export function useWorkflowTransition(
  entityType: EntityType,
  invalidateKeys?: string[][]
) {
  const qc      = useQueryClient();
  const { user } = useAdminAuth();

  return useMutation({
    mutationFn: async (input: TransitionInput) => {
      const result = await executeTransition({
        ...input,
        entityType,
        adminEmail:  user?.email  ?? 'admin',
        adminUserId: user?.id     ?? null,
      });
      if (!result.success) throw new Error(result.error ?? 'Transition failed');
      return result;
    },
    onSuccess: () => {
      (invalidateKeys ?? []).forEach((key) =>
        qc.invalidateQueries({ queryKey: key })
      );
    },
  });
}
