import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export interface CorpusHit {
  id: string;
  work_id: string;
  title: string;
  cite_url: string | null;
  heading: string | null;
  body: string;
  rrf_score: number;
}

export async function searchCorpusChunks(
  svcClient: SupabaseClient,
  opts: {
    queryText: string;
    queryEmbedding: number[] | null;
    serveFilter?: string;
    matchCount?: number;
  },
): Promise<CorpusHit[]> {
  const { data, error } = await svcClient.rpc("holzen_hybrid_search_chunks", {
    query_text: opts.queryText,
    query_embedding: opts.queryEmbedding,
    serve_filter: opts.serveFilter ?? "ritual",
    match_count: opts.matchCount ?? 8,
  });
  if (error) {
    try {
      console.warn(JSON.stringify({
        holzen_event: "corpus_search_error",
        detail: error.message?.slice(0, 200),
        ts: new Date().toISOString(),
      }));
    } catch {
      /* ignore */
    }
    return [];
  }
  if (!Array.isArray(data)) return [];
  return data as CorpusHit[];
}

export function formatCorpusPassages(hits: CorpusHit[]): string {
  return hits
    .slice(0, 8)
    .map((h, i) => {
      const cite = h.cite_url ? ` ${h.cite_url}` : "";
      return `[${i + 1}] ${h.title}${h.heading ? ` — ${h.heading}` : ""}${cite}\n${h.body}`;
    })
    .join("\n\n");
}
