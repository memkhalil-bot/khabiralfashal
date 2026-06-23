import { supabase } from '@/integrations/supabase/client';

/**
 * Looks up the live price for an advisory session from the services catalog
 * (managed in /admin/services). Matches by `service_key === sessionType`
 * ('initial' | 'followup' | 'intensive' | 'emergency').
 *
 * Returns null (never a guessed number) when there is no matching active
 * service — callers should leave `session_value` unset in that case so the
 * existing "price unavailable" warning in Create Invoice keeps working.
 */
export async function lookupSessionPrice(sessionType: string): Promise<number | null> {
  const { data, error } = await (supabase as any)
    .from('services')
    .select('price')
    .eq('service_key', sessionType)
    .eq('active', true)
    .maybeSingle();

  if (error || !data) return null;
  return data.price;
}
