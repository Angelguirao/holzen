import { supabase } from '@/integrations/supabase/client';

/** Name/type/url sent to companion-orchestrate for Perplexity allowlists. */
export type CompanionOrchestrateSource = {
  name: string;
  type: string;
  url: string;
};

export type CompanionOrchestrateSourceCategory = 'signal' | 'grounding';

type CatalogRow = { name: string; type: string; url: string | null };

/** Active catalog rows from `signal_sources` for the given category. */
export async function loadActiveOrchestrateSources(
  category: CompanionOrchestrateSourceCategory,
): Promise<CompanionOrchestrateSource[] | undefined> {
  try {
    const { data: catalog } = await supabase
      .from('signal_sources')
      .select('name, type, url, category')
      .eq('category', category)
      .eq('demoted_for_live', false);

    const sources = ((catalog ?? []) as CatalogRow[])
      .map((s) => ({ name: s.name, type: s.type, url: s.url ?? '' }))
      .filter((s) => s.url.length > 0);

    return sources.length > 0 ? sources : undefined;
  } catch {
    return undefined;
  }
}
