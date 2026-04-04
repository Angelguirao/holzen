import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { createAttemptLogger } from "../_shared/observe.ts";
import { callPerplexityChat, type PerplexityUsage } from "../_shared/perplexity-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Active Source Feeds — fetches latest content from signal_sources URLs.
 *
 * Uses Firecrawl to scrape source URLs into clean text, then Gemini to
 * structure the content into content_library entries.
 *
 * Falls back to Perplexity search if Firecrawl is not configured.
 *
 * Scheduled via cron (twice daily).
 */

// ── Firecrawl scraper ──

async function scrapeWithFirecrawl(url: string, apiKey: string, log: (msg: string) => void): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true, // Skip navs, footers, sidebars
        timeout: 15000,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      log(`Firecrawl error ${res.status}: ${errText.slice(0, 200)}`);
      return null;
    }

    const data = await res.json();
    if (!data.success || !data.data?.markdown) {
      log(`Firecrawl returned no content for ${url}`);
      return null;
    }

    // Return markdown content, truncated to ~4000 chars for Gemini context
    const markdown = data.data.markdown;
    return markdown.slice(0, 4000);
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      log(`Firecrawl timeout for ${url}`);
    } else {
      log(`Firecrawl error: ${e}`);
    }
    return null;
  }
}

// ── Perplexity search fallback ──

async function searchWithPerplexity(
  sourceName: string,
  sourceUrl: string,
  category: string,
  apiKey: string,
  log: (msg: string) => void,
): Promise<{ content: string; citations: string[]; usage?: PerplexityUsage; searchMs: number } | null> {
  const t0 = Date.now();
  try {
    const searchPrompt = category === "signal"
      ? `Find the most profound or recent philosophical essay or insight from ${sourceName}. Look at ${sourceUrl}. Return ONE specific essay with its title, main argument in 2-3 sentences, and a memorable quote if available.`
      : `Find a specific research paper or finding from ${sourceName} about behavioral finance, investor psychology, or decision-making. Return ONE specific finding with the researcher name, year, and key result.`;

    let hostname = "";
    try { hostname = new URL(sourceUrl).hostname.replace(/^www\./, ""); } catch { /* ignore */ }

    const result = await callPerplexityChat(
      {
        model: "sonar",
        messages: [
          { role: "system", content: `You find specific content from ${sourceName}. Be precise — return the actual title, author, and key ideas.` },
          { role: "user", content: searchPrompt },
        ],
        ...(hostname ? { search_domain_filter: [hostname] } : {}),
      },
      apiKey,
      log,
      15_000,
    );
    return {
      content: result.content,
      citations: result.citations,
      usage: result.usage,
      searchMs: Date.now() - t0,
    };
  } catch (e) {
    log(`Perplexity error: ${e}`);
    return null;
  }
}

// ── Main handler ──

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const t0 = Date.now();
  const log = (msg: string) => console.log(JSON.stringify({ ts: new Date().toISOString(), fn: "fetch-source-feeds", msg, elapsed_ms: Date.now() - t0 }));

  try {
    // Auth: align with refresh-btc-prices / pregenerate — service role, CRON_SECRET, or Supabase cron header
    const authHeader = req.headers.get("Authorization");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const cronSecret = Deno.env.get("CRON_SECRET") ?? "";
    const token = authHeader?.replace("Bearer ", "") ?? "";
    if (token !== serviceRoleKey && token !== cronSecret && req.headers.get("x-supabase-cron") !== "true") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", serviceRoleKey, { auth: { persistSession: false } });
    const logAttempt = createAttemptLogger(supabase);

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!FIRECRAWL_API_KEY && !PERPLEXITY_API_KEY) {
      return new Response(JSON.stringify({ error: "Need either FIRECRAWL_API_KEY or PERPLEXITY_API_KEY" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const scrapeMode = FIRECRAWL_API_KEY ? "firecrawl" : "perplexity";
    log(`scrape mode: ${scrapeMode}`);

    // Fetch all active sources with URLs
    const { data: sources } = await supabase
      .from("signal_sources")
      .select("id, name, type, url, category")
      .not("url", "is", null)
      .eq("demoted_for_live", false);

    if (!sources || sources.length === 0) {
      log("no sources with URLs");
      return new Response(JSON.stringify({ fetched: 0, mode: scrapeMode }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const results: string[] = [];
    let fetched = 0;

    // Process up to 5 sources per run
    const toProcess = sources.slice(0, 5);

    for (const source of toProcess) {
      try {
        if (!source.url) continue;
        log(`processing: ${source.name} (${source.url})`);

        const contentType = source.category === "signal" ? "essay" : "paper";
        let scrapedContent: string | null = null;
        let citations: string[] = [];

        // ── Step 1: Scrape content ──
        if (scrapeMode === "firecrawl") {
          scrapedContent = await scrapeWithFirecrawl(source.url, FIRECRAWL_API_KEY!, log);
          if (scrapedContent) {
            citations = [source.url]; // Firecrawl source is the URL itself
          }
        }

        // Fallback to Perplexity if Firecrawl failed or not configured
        if (!scrapedContent && PERPLEXITY_API_KEY) {
          const searchResult = await searchWithPerplexity(source.name, source.url, source.category, PERPLEXITY_API_KEY, log);
          if (searchResult) {
            scrapedContent = searchResult.content;
            citations = searchResult.citations;
            if (searchResult.usage) {
              logAttempt({
                companion_type: "source_feed",
                provider: "perplexity",
                model: "sonar",
                status: "success",
                latency_ms: searchResult.searchMs,
                input_tokens: searchResult.usage.prompt_tokens,
                output_tokens: searchResult.usage.completion_tokens,
                api_requests: 1,
              });
            }
          }
        }

        if (!scrapedContent) {
          results.push(`${source.name}: no content found`);
          continue;
        }

        // ── Step 2: Structure with Gemini ──
        const structurePrompt = contentType === "essay"
          ? `Extract the ONE most compelling essay or insight from this content by ${source.name}. Return JSON with: title, author (must be "${source.name}" or the specific writer found), summary (2-3 sentences distilling the core idea), key_quote (optional, a real quote from the text only — do NOT fabricate), url (use: ${citations[0] || source.url}).`
          : `Extract ONE specific research finding from this content. Return JSON with: title, author, summary (2-3 sentences), citation (Author (Year), Title format), finding (key result in plain language), url (use: ${citations[0] || source.url}).`;

        const structureT0 = Date.now();
        const structureRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: structurePrompt },
              { role: "user", content: `Source: ${source.name}\nURL: ${source.url}\n\nContent:\n${scrapedContent.slice(0, 3000)}` },
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
          }),
        });

        if (!structureRes.ok) {
          results.push(`${source.name}: structure error ${structureRes.status}`);
          continue;
        }

        const structureData = await structureRes.json();
        const structUsage = structureData.usage;
        logAttempt({
          companion_type: "source_feed",
          provider: "lovable",
          model: "google/gemini-2.5-flash-lite",
          status: "success",
          latency_ms: Date.now() - structureT0,
          input_tokens: structUsage?.prompt_tokens,
          output_tokens: structUsage?.completion_tokens,
        });
        const raw = structureData.choices?.[0]?.message?.content;
        if (!raw) { results.push(`${source.name}: empty structure`); continue; }

        let entry: any;
        try { entry = JSON.parse(raw); } catch { results.push(`${source.name}: JSON parse error`); continue; }
        if (!entry.title || !entry.summary) { results.push(`${source.name}: invalid structure`); continue; }

        // ── Step 3: Dedup check ──
        const { data: existing } = await supabase
          .from("content_library")
          .select("id")
          .eq("title", entry.title)
          .limit(1);

        if (existing && existing.length > 0) {
          results.push(`${source.name}: "${entry.title}" already exists`);
          continue;
        }

        // ── Step 4: Insert into content_library ──
        const insertData: any = {
          type: contentType,
          title: entry.title,
          author: entry.author || source.name,
          summary: entry.summary,
          url: entry.url || citations[0] || source.url,
          tags: [source.category, source.name.toLowerCase().replace(/\s+/g, '-')],
          companion_types: [source.category === "signal" ? "signal" : "ground_nudge"],
          language: "en",
          quality_score: 2,
        };

        if (contentType === "essay") {
          insertData.key_quote = entry.key_quote || null;
        } else {
          insertData.citation = entry.citation || null;
          insertData.finding = entry.finding || null;
        }

        await supabase.from("content_library").insert(insertData);
        results.push(`${source.name}: added "${entry.title}" (via ${scrapeMode})`);
        fetched++;

        // Rate limit respect
        await new Promise(r => setTimeout(r, 2000));
      } catch (e) {
        results.push(`${source.name}: ${e}`);
      }
    }

    log(`done: fetched ${fetched} from ${toProcess.length} sources via ${scrapeMode}`);
    return new Response(JSON.stringify({ fetched, mode: scrapeMode, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    log(`error: ${e}`);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
