// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { extractDoi, normalizeCitation } from "../_shared/grounding-enrichment-util.ts";
import { withRequestLogging } from "../_shared/with-request-logging.ts";

/**
 * `grounding-enrich` — read-optimized enrichment for Grounding Full View.
 *
 * Input: `{ citation: string, url?: string, doi?: string }`.
 * Output: `{ abstract, researchers: [{name, bio}], citationCount, doi, url, source_provenance }`
 *         All fields nullable — the client renders nothing for missing sections.
 *
 * Flow:
 *   1. Hash the normalized citation → look up `grounding_enrichment_cache`. If
 *      the row is fresh (not past `expires_at`), return it.
 *   2. Otherwise fan out in parallel:
 *        - Crossref  : free, no key, returns abstract + author names
 *        - Semantic Scholar : free tier, returns citation count
 *        - Gemini    : one-shot 1–2 sentence bio per researcher, via the
 *                       existing Lovable AI gateway
 *   3. Upsert the row (or replace if expired) and return.
 *
 * Auth: requires an authenticated user (Supabase JWT). Reads from the shared
 * cache are open to any authenticated user; writes use the service role so
 * clients can't spoof enrichment content.
 *
 * Logging: `createLogger("grounding-enrich")` + `holzen_event` markers for
 *   - `grounding_enrich_hit`     (cache hit, no upstream calls)
 *   - `grounding_enrich_miss`    (cache miss, all 3 upstreams called)
 *   - `grounding_enrich_failed`  (partial or total upstream failure)
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EnrichmentRequest {
  citation: string;
  url?: string | null;
  doi?: string | null;
}

interface Researcher {
  name: string;
  bio: string;
}

interface EnrichmentResponse {
  citation_hash: string;
  doi: string | null;
  url: string | null;
  abstract: string | null;
  researchers: Researcher[];
  citation_count: number | null;
  source_provenance: Record<string, string | null>;
  cached: boolean;
}

serve(
  withRequestLogging("grounding-enrich", async ({ req, log }) => {
  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const sb = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader ?? "" } },
    });

    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Feature flag + budget guard. Cache hits below bypass this; only the
    // upstream-fanout path (Gemini bio generation) pays the AI cost.
    const svcGuard = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });
    const { guardAiFeature } = await import("../_shared/ratelimit.ts");
    const enrichGuard = await guardAiFeature(svcGuard, "grounding_enrich", {
      userId: user.id,
      providers: ["lovable"],
    });
    if (!enrichGuard.allowed) {
      return new Response(
        JSON.stringify({ error: enrichGuard.reason ?? "Enrichment paused" }),
        { status: enrichGuard.status ?? 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json().catch(() => null)) as EnrichmentRequest | null;
    if (!body?.citation || typeof body.citation !== "string") {
      return new Response(JSON.stringify({ error: "Missing citation" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const citation = body.citation.trim();
    const hash = await sha256Hex(normalizeCitation(citation));
    const doiHint = body.doi?.trim() || extractDoi(citation) || extractDoi(body.url ?? "");

    const svc = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });

    // 1. Cache lookup — returns fresh rows or null.
    const nowIso = new Date().toISOString();
    const { data: existing } = await svc
      .from("grounding_enrichment_cache")
      .select("*")
      .eq("citation_hash", hash)
      .gt("expires_at", nowIso)
      .maybeSingle();

    if (existing) {
      console.log(JSON.stringify({
        holzen_event: "grounding_enrich_hit",
        citation_hash: hash,
        has_doi: Boolean(existing.doi),
        has_abstract: Boolean(existing.abstract),
        researcher_count: Array.isArray(existing.researchers) ? existing.researchers.length : 0,
        ts: nowIso,
      }));
      log("cache hit", { hash });
      return new Response(
        JSON.stringify({
          citation_hash: existing.citation_hash,
          doi: existing.doi,
          url: existing.url,
          abstract: existing.abstract,
          researchers: (existing.researchers as Researcher[]) ?? [],
          citation_count: existing.citation_count,
          source_provenance: (existing.source_provenance as Record<string, string | null>) ?? {},
          cached: true,
        } satisfies EnrichmentResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Fan out upstream calls in parallel. Each helper returns null on
    //    failure so one bad source can't tank the whole enrichment.
    const [crossref, semanticScholar] = await Promise.all([
      fetchCrossref(doiHint, citation).catch(() => null),
      doiHint ? fetchSemanticScholar(doiHint).catch(() => null) : Promise.resolve(null),
    ]);

    const resolvedDoi = doiHint ?? crossref?.doi ?? null;
    const resolvedUrl = body.url?.trim() || crossref?.url || (resolvedDoi ? `https://doi.org/${resolvedDoi}` : null);
    const abstract = crossref?.abstract ?? null;
    const researcherNames = crossref?.authors ?? [];

    // Generate short bios only when Crossref gave us author names — no names,
    // no bios, no Gemini call (cost control).
    const bios = researcherNames.length > 0 ? await generateBios(researcherNames, citation).catch(() => []) : [];
    const researchers: Researcher[] = researcherNames.map((name, i) => ({
      name,
      bio: bios[i] ?? "",
    }));

    const source_provenance = {
      abstract_source: abstract ? "crossref" : null,
      bio_source: bios.length > 0 ? "gemini" : null,
      citation_count_source: semanticScholar?.citationCount != null ? "semantic_scholar" : null,
    };

    const anyUpstreamFailed = !crossref && !semanticScholar && bios.length === 0;
    if (anyUpstreamFailed) {
      console.warn(JSON.stringify({
        holzen_event: "grounding_enrich_failed",
        citation_hash: hash,
        has_doi: Boolean(doiHint),
        ts: new Date().toISOString(),
      }));
    } else {
      console.log(JSON.stringify({
        holzen_event: "grounding_enrich_miss",
        citation_hash: hash,
        has_doi: Boolean(resolvedDoi),
        has_abstract: Boolean(abstract),
        researcher_count: researchers.length,
        citation_count: semanticScholar?.citationCount ?? null,
        ts: new Date().toISOString(),
      }));
    }

    const enrichment: EnrichmentResponse = {
      citation_hash: hash,
      doi: resolvedDoi,
      url: resolvedUrl ?? null,
      abstract,
      researchers,
      citation_count: semanticScholar?.citationCount ?? null,
      source_provenance,
      cached: false,
    };

    // 3. Upsert — even the "all three failed" row is worth caching for a bit
    // so we don't hammer the upstreams on every page load. 60-day TTL handles
    // the happy path; failed rows use a 1-day TTL instead so transient
    // Crossref / Semantic Scholar outages self-heal quickly.
    const expiresAt = anyUpstreamFailed
      ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

    const { error: upsertErr } = await svc
      .from("grounding_enrichment_cache")
      .upsert({
        citation_hash: hash,
        doi: enrichment.doi,
        url: enrichment.url,
        abstract: enrichment.abstract,
        researchers: enrichment.researchers,
        citation_count: enrichment.citation_count,
        source_provenance: enrichment.source_provenance,
        last_validated_at: new Date().toISOString(),
        expires_at: expiresAt,
      }, { onConflict: "citation_hash" });
    if (upsertErr) log.warn("upsert failed, returning uncached payload", { err: upsertErr.message });

    return new Response(JSON.stringify(enrichment), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    log.error("unexpected error", { err: e instanceof Error ? e.message : String(e) });
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  })
);

// ── Helpers ────────────────────────────────────────────────────────────────

async function sha256Hex(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface CrossrefResult {
  doi: string | null;
  url: string | null;
  abstract: string | null;
  authors: string[];
}

async function fetchCrossref(doiHint: string | null, citation: string): Promise<CrossrefResult | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    let res: Response;
    if (doiHint) {
      res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doiHint)}`, {
        headers: { "User-Agent": "Holzen/1.0 (mailto:support@holzen.app)" },
        signal: controller.signal,
      });
    } else {
      // Title/author fuzzy search: use the citation text trimmed to ~120 chars.
      const q = citation.slice(0, 120);
      res = await fetch(
        `https://api.crossref.org/works?rows=1&query.bibliographic=${encodeURIComponent(q)}`,
        { headers: { "User-Agent": "Holzen/1.0 (mailto:support@holzen.app)" }, signal: controller.signal },
      );
    }
    if (!res.ok) return null;
    const json = await res.json();
    const item = doiHint ? json.message : json.message?.items?.[0];
    if (!item) return null;

    const authors = Array.isArray(item.author)
      ? item.author
          .map((a: any) => [a.given, a.family].filter(Boolean).join(" ").trim())
          .filter(Boolean)
          .slice(0, 5)
      : [];

    return {
      doi: (item.DOI as string) ?? doiHint,
      url: (item.URL as string) ?? (item.DOI ? `https://doi.org/${item.DOI}` : null),
      abstract: cleanCrossrefAbstract(item.abstract as string | undefined),
      authors,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/** Crossref wraps abstracts in `<jats:p>` — strip tags and collapse whitespace. */
function cleanCrossrefAbstract(raw?: string | null): string | null {
  if (!raw) return null;
  const stripped = raw
    .replace(/<jats:[^>]+>/g, "")
    .replace(/<\/jats:[^>]+>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.length > 0 ? stripped.slice(0, 800) : null;
}

async function fetchSemanticScholar(doi: string): Promise<{ citationCount: number | null } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/DOI:${encodeURIComponent(doi)}?fields=citationCount`,
      { signal: controller.signal },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return { citationCount: typeof json.citationCount === "number" ? json.citationCount : null };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Ask Gemini for one 1–2 sentence bio per researcher. Returns parallel array
 * aligned with the input `names` order. On failure, returns an empty array so
 * the caller can fall back to name-only display.
 */
async function generateBios(names: string[], citation: string): Promise<string[]> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const systemPrompt = `You write 1–2 sentence bios of academic researchers. Each bio mentions their primary field (e.g. behavioral finance, cognitive psychology) and one notable contribution when known. Keep bios tight (≤160 chars). Do NOT fabricate specific quantitative claims. Never invent papers; if you don't know the researcher, say "Academic researcher in the field relevant to the cited work."`;
    const userPrompt = `Paper citation: "${citation}"

Researchers (in order):
${names.map((n, i) => `${i + 1}. ${n}`).join("\n")}

Return a JSON object with key "bios" containing a string array of the same length as the input, in the same order. Each string is the bio.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const json = await res.json();
    const raw = json.choices?.[0]?.message?.content ?? "{}";
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    const bios = Array.isArray(parsed.bios) ? parsed.bios : [];
    return bios.slice(0, names.length).map((b: unknown) => (typeof b === "string" ? b.slice(0, 200) : ""));
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
