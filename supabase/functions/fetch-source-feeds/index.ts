import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Active Source Feeds — fetches latest content from signal_sources URLs.
 *
 * For each source with a URL, uses Perplexity to find and summarize
 * recent content, then stores it in content_library with proper attribution.
 *
 * Scheduled via cron (daily or twice daily).
 * This is what makes sources ACTIVELY FEED the system instead of being
 * passive hints to Perplexity searches.
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const t0 = Date.now();
  const log = (msg: string) => console.log(JSON.stringify({ ts: new Date().toISOString(), fn: "fetch-source-feeds", msg, elapsed_ms: Date.now() - t0 }));

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const token = authHeader?.replace("Bearer ", "") ?? "";
    if (token !== serviceRoleKey && req.headers.get("x-supabase-cron") !== "true") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", serviceRoleKey, { auth: { persistSession: false } });
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!PERPLEXITY_API_KEY || !LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing API keys" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch all active sources with URLs
    const { data: sources } = await supabase
      .from("signal_sources")
      .select("id, name, type, url, category")
      .not("url", "is", null);

    if (!sources || sources.length === 0) {
      log("no sources with URLs");
      return new Response(JSON.stringify({ fetched: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const results: string[] = [];
    let fetched = 0;

    // Process up to 5 sources per run (to stay within Perplexity rate limits)
    const toProcess = sources.slice(0, 5);

    for (const source of toProcess) {
      try {
        log(`fetching: ${source.name} (${source.url})`);

        // Use Perplexity to find the latest/best content from this source
        const contentType = source.category === "signal" ? "essay" : "paper";
        const searchPrompt = source.category === "signal"
          ? `Find the most profound or recent philosophical essay or insight from ${source.name}. Look at ${source.url}. Return ONE specific essay with its title, main argument in 2-3 sentences, and a memorable quote if available.`
          : `Find a specific research paper or finding from ${source.name} about behavioral finance, investor psychology, or decision-making. Return ONE specific finding with the researcher name, year, and key result.`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const searchRes = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${PERPLEXITY_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "sonar",  // Use cheaper model for feed fetching
            messages: [
              { role: "system", content: `You find specific content from ${source.name}. Be precise — return the actual title, author, and key ideas.` },
              { role: "user", content: searchPrompt },
            ],
            search_domain_filter: source.url ? [new URL(source.url).hostname.replace(/^www\./, "")] : undefined,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!searchRes.ok) {
          if (searchRes.status === 429) { log(`rate limited for ${source.name}`); break; }
          results.push(`${source.name}: error ${searchRes.status}`);
          continue;
        }

        const searchData = await searchRes.json();
        const searchContent = searchData.choices?.[0]?.message?.content || "";
        const citations = searchData.citations || [];

        if (!searchContent) { results.push(`${source.name}: empty search`); continue; }

        // Structure with Gemini
        const structureRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite", // Cheapest model for structuring
            messages: [
              {
                role: "system",
                content: contentType === "essay"
                  ? `Extract ONE essay/insight from the search results. Return JSON with: title, author (must be "${source.name}" or the specific writer), summary (2-3 sentences), key_quote (optional, real quote only), url (from citations).`
                  : `Extract ONE research finding. Return JSON with: title, author, summary (2-3 sentences), citation (Author (Year), Title format), finding (key result), url (from citations).`,
              },
              { role: "user", content: `Source: ${source.name}\n\nSearch results:\n${searchContent}\n\nCitations:\n${citations.map((c: string, i: number) => `[${i + 1}] ${c}`).join("\n")}` },
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
        const raw = structureData.choices?.[0]?.message?.content;
        if (!raw) { results.push(`${source.name}: empty structure`); continue; }

        const entry = JSON.parse(raw);
        if (!entry.title || !entry.summary) { results.push(`${source.name}: invalid structure`); continue; }

        // Check for duplicates in content_library
        const { data: existing } = await supabase
          .from("content_library")
          .select("id")
          .eq("title", entry.title)
          .limit(1);

        if (existing && existing.length > 0) {
          results.push(`${source.name}: "${entry.title}" already exists`);
          continue;
        }

        // Insert into content_library
        const insertData: any = {
          type: contentType,
          title: entry.title,
          author: entry.author || source.name,
          summary: entry.summary,
          url: entry.url || (citations.length > 0 ? citations[0] : source.url),
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
        results.push(`${source.name}: added "${entry.title}"`);
        fetched++;

        // Rate limit respect: wait between sources
        await new Promise(r => setTimeout(r, 3000));
      } catch (e) {
        results.push(`${source.name}: ${e}`);
      }
    }

    log(`done: fetched ${fetched} from ${toProcess.length} sources`);
    return new Response(JSON.stringify({ fetched, results }), {
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
