import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export function useLogActivity() {
  const { user } = useAdminAuth();

  return async function log(
    action: string,
    entityType: string,
    entityId: string,
    description: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await (supabase as any).from('activity_log').insert({
        admin_user_id: user?.id ?? null,
        admin_email:   user?.email ?? null,
        action,
        entity_type:   entityType,
        entity_id:     entityId,
        description,
        metadata:      metadata ?? {},
      });
    } catch (_) {
      // intentionally silent — logging should never break the main flow
    }
  };
}
