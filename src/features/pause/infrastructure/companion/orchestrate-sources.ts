import { supabase } from '@/integrations/supabase/client';

/** Name/type/url sent to companion-orchestrate for Perplexity allowlists. */
export type CompanionOrchestrateSource = {
  name: string;
  type: string;
  url: string;
};

export type CompanionOrchestrateSourceCategory = 'signal' | 'grounding';

type CatalogRow = { id: string; name: string; type: string; url: string | null };
type PrefRow = {
  source_id: string | null;
  custom_name: string | null;
  custom_url: string | null;
  custom_type: string | null;
  active: boolean;
};

/**
 * Active catalog + custom rows from `signal_sources` / `user_signal_preferences`
 * for the given category (same query for lazy fetch and regenerate).
 */
export async function loadActiveOrchestrateSources(
  category: CompanionOrchestrateSourceCategory,
): Promise<CompanionOrchestrateSource[] | undefined> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) return undefined;

    const [{ data: catalog }, { data: userPrefs }] = await Promise.all([
      supabase
        .from('signal_sources')
        .select('id, name, type, url, category')
        .eq('category', category),
      supabase
        .from('user_signal_preferences')
        .select('source_id, custom_name, custom_url, custom_type, active, category')
        .eq('user_id', userId)
        .eq('category', category),
    ]);

    const prefs = (userPrefs ?? []) as PrefRow[];
    const prefsMap = new Map(
      prefs.filter((p): p is PrefRow & { source_id: string } => p.source_id != null).map((p) => [p.source_id, p]),
    );

    const catalogRows = (catalog ?? []) as CatalogRow[];
    const catalogActive = catalogRows
      .filter((s) => {
        const pref = prefsMap.get(s.id);
        return pref ? pref.active : true;
      })
      .map((s) => ({ name: s.name, type: s.type, url: s.url ?? '' }));

    const customActive = prefs
      .filter((p) => !p.source_id && p.custom_name && p.active)
      .map((p) => ({
        name: p.custom_name as string,
        type: p.custom_type || 'blog',
        url: p.custom_url ?? '',
      }));

    const sources = [...catalogActive, ...customActive];
    return sources.length > 0 ? sources : undefined;
  } catch {
    return undefined;
  }
}
