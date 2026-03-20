import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function isValidUrl(s: string): boolean {
  if (!s || s === "N/A" || s.length < 10) return false;
  try {
    const u = new URL(s.startsWith("http") ? s : `https://${s}`);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function normalizeUrl(s: string): string {
  if (!s) return "";
  if (!s.startsWith("http")) return `https://${s}`;
  return s;
}

/** HEAD-check a URL, return true if reachable (2xx/3xx) */
async function isUrlReachable(url: string): Promise<boolean> {
  if (!url || url.length < 10) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal });
    clearTimeout(timeout);
    return res.status >= 200 && res.status < 400;
  } catch {
    return false;
  }
}

/** Serve a random cached entry as fallback */
async function serveFallback(svcClient: any): Promise<any | null> {
  try {
    const { data } = await svcClient
      .from("companion_cache")
      .select("id, content, used_count")
      .eq("companion_type", "signal")
      .eq("language", "en")
      .gte("quality_score", 2)
      .order("used_count", { ascending: true })
      .limit(5);
    if (!data || data.length === 0) {
      const { data: anyQ } = await svcClient
        .from("companion_cache")
        .select("id, content, used_count")
        .eq("companion_type", "signal")
        .eq("language", "en")
        .order("used_count", { ascending: true })
        .limit(5);
      if (!anyQ || anyQ.length === 0) return null;
      const pick = anyQ[Math.floor(Math.random() * anyQ.length)];
      svcClient.from("companion_cache").update({ used_count: (pick.used_count || 0) + 1 }).eq("id", pick.id).then(() => {});
      return pick.content;
    }
    const pick = data[Math.floor(Math.random() * data.length)];
    svcClient.from("companion_cache").update({ used_count: (pick.used_count || 0) + 1 }).eq("id", pick.id).then(() => {});
    return pick.content;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const t0 = Date.now();
  const log = (msg: string) => console.log(`[signal] ${msg} (+${Date.now() - t0}ms)`);

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid or empty request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { context, language, sources, recentSignalSources, recentSignalTitles } = body;
    log("parsed body");

    // Verify JWT via getUser
    const { createClient } = await import("npm:@supabase/supabase-js@2.57.2");
    const sbUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const sbClient = createClient(sbUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await sbClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    log("auth verified");

    const svcClient = createClient(sbUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });

    // Track AI usage — fire-and-forget
    svcClient.from("analytics_events").insert({ user_id: user.id, event: "signal_companion_ai_call" }).then(() => {});

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY is not configured");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build source name list for context
    const sourceNames: string[] = [];
    if (sources && Array.isArray(sources) && sources.length > 0) {
      for (const s of sources) {
        if (s.name) sourceNames.push(s.name);
      }
    }

    const recentExclusion = (recentSignalSources && Array.isArray(recentSignalSources) && recentSignalSources.length > 0)
      ? ` Do NOT use insights from: ${recentSignalSources.slice(0, 5).join(", ")}. Pick a DIFFERENT source.`
      : "";

    const topicExclusion = (recentSignalTitles && Array.isArray(recentSignalTitles) && recentSignalTitles.length > 0)
      ? `\nDo NOT cover these topics (already shown to user): ${recentSignalTitles.slice(0, 5).join("; ")}. Find a COMPLETELY DIFFERENT angle.`
      : "";

    const sourceHint = sourceNames.length > 0
      ? ` Look for insights from sources like: ${sourceNames.sort(() => Math.random() - 0.5).slice(0, 5).join(", ")}.`
      : "";

    // Extract URLs from user sources for domain filtering
    const sourceUrls: string[] = [];
    if (sources && Array.isArray(sources)) {
      for (const s of sources) {
        if (s.url && typeof s.url === "string") {
          try {
            const hostname = new URL(s.url.startsWith("http") ? s.url : `https://${s.url}`).hostname.replace(/^www\./, "");
            if (hostname && !sourceUrls.includes(hostname)) sourceUrls.push(hostname);
          } catch { /* skip */ }
        }
      }
    }

    // PHILOSOPHICAL SIGNAL — not trading data, not metrics. Deep Bitcoin thinking.
    const SIGNAL_PHILOSOPHY = `CRITICAL CONTENT IDENTITY:
You are searching for PROFOUND, PHILOSOPHICAL Bitcoin thinking — NOT market data, NOT trading signals, NOT on-chain metrics.

WHAT "SIGNAL" MEANS HERE:
- Deep ideas about what Bitcoin represents for human freedom, sovereignty, and self-custody
- Philosophical perspectives on money, time preference, proof of work as a life principle
- Thoughtful essays about Bitcoin's role in reshaping trust, institutions, and individual agency
- Long-form thinking from Bitcoin writers, philosophers, economists, and thinkers
- Perspectives on sound money, Austrian economics, game theory, and civilizational impact
- Reflections on patience, conviction, and the psychology of holding through uncertainty

WHAT IT IS NOT:
- Price predictions, chart analysis, trading setups, entry/exit points
- On-chain metrics, hash rate stats, exchange flows, whale movements
- Short-term market commentary or news cycle reactions
- Technical analysis or quantitative data dashboards

IDEAL SOURCES: Bitcoin Magazine, Unchained, Nakamoto Institute, Allen Farrington, Vijay Boyapati, Lyn Alden (philosophical pieces), Parker Lewis, Gigi, Robert Breedlove, Saifedean Ammous, Jeff Booth, Michael Saylor (philosophical talks), Bitcoin Audible, Swan Signal`;

    const searchQuery = context
      ? `Bitcoin philosophical perspective relevant when ${context}. Find a profound insight about conviction, patience, sound money, sovereignty, or long-term thinking from a respected Bitcoin thinker or writer.${sourceHint}${recentExclusion}`
      : `Find a profound, philosophical Bitcoin essay or insight about sovereignty, sound money, time preference, proof of work as philosophy, or the meaning of holding from a respected thinker.${sourceHint}${recentExclusion}`;

    const perplexityBody: any = {
      model: "sonar-pro",
      messages: [
        {
          role: "system",
          content: `You are searching for deep, philosophical Bitcoin writing — essays and ideas that make a holder feel grounded in WHY they hold.

${SIGNAL_PHILOSOPHY}

DIVERSITY RULES:
- Use a DIFFERENT thinker or writer every time
- Rotate between essayists, podcasters, book authors, and newsletter writers
- Prefer timeless ideas over news reactions
- Include the exact source name and a working URL to the specific essay/article/talk${recentExclusion}${topicExclusion}`,
        },
        { role: "user", content: searchQuery },
      ],
      search_recency_filter: "year",
      ...(sourceUrls.length > 0 ? { search_domain_filter: sourceUrls.slice(0, 5) } : {}),
    };

    // Helper to call Perplexity
    async function callPerplexity(pBody: any): Promise<{ content: string; citations: string[] }> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      try {
        const res = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${PERPLEXITY_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify(pBody),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        log(`perplexity responded ${res.status}`);
        if (!res.ok) {
          const errText = await res.text();
          console.error("Perplexity error:", res.status, errText);
          if (res.status === 429) throw new Error("RATE_LIMITED");
          throw new Error("Perplexity search failed");
        }
        const data = await res.json();
        return { content: data.choices?.[0]?.message?.content || "", citations: data.citations || [] };
      } catch (e) {
        clearTimeout(timeout);
        throw e;
      }
    }

    log("calling perplexity");
    let searchContent = "";
    let citations: string[] = [];

    try {
      const result = await callPerplexity(perplexityBody);
      searchContent = result.content;
      citations = result.citations;
      log(`perplexity content length: ${searchContent.length}, citations: ${citations.length}`);

      if (citations.length === 0 && sourceUrls.length > 0 && searchContent.length > 0) {
        log("0 citations with domain filter — retrying without filter");
        const retryBody = { ...perplexityBody };
        delete retryBody.search_domain_filter;
        try {
          const retry = await callPerplexity(retryBody);
          if (retry.citations.length > 0) {
            searchContent = retry.content;
            citations = retry.citations;
            log(`retry got ${citations.length} citations`);
          }
        } catch (retryErr) {
          log(`retry failed, using original content: ${retryErr}`);
        }
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        log("perplexity timed out after 12s");
        const fallback = await serveFallback(svcClient);
        if (fallback) return new Response(JSON.stringify(fallback), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "Search timed out" }), { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (e instanceof Error && e.message === "RATE_LIMITED") {
        const fallback = await serveFallback(svcClient);
        if (fallback) return new Response(JSON.stringify(fallback), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "Rate limited. Try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw e;
    }

    if (!searchContent) {
      const fallback = await serveFallback(svcClient);
      if (fallback) return new Response(JSON.stringify(fallback), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("No search content returned");
    }

    // Step 2: AI structuring — extract philosophical insight
    const citationList = citations.length > 0
      ? citations.map((c: string, i: number) => `[${i + 1}] ${c}`).join("\n")
      : "(No citations available — leave url empty)";

    log("calling AI structuring");

    const aiBody = {
      messages: [
        {
          role: "system",
          content: `Extract ONE philosophical Bitcoin insight from the search results below.

TONE: Profound, calm, grounding. Like a wise friend reminding you why you hold.
LENGTH: Title should be evocative (5-10 words). Body should be 2-3 sentences that capture the CORE IDEA — not a summary of the article, but the philosophical essence.

EXAMPLES OF GOOD TITLES:
- "Proof of work is proof of sacrifice"
- "Sound money teaches patience before it teaches wealth"
- "Sovereignty begins with what you refuse to delegate"

EXAMPLES OF BAD TITLES:
- "Bitcoin hash rate reaches new all-time high"
- "Analyst predicts BTC price target"
- "On-chain metrics show accumulation"

ACCURACY RULES (CRITICAL):
- Attribute the idea to the correct thinker/writer from the search results
- Do NOT invent quotes or misattribute ideas
- The body should distill the philosophical point, not regurgitate data

URL RULES (CRITICAL):
- Select a url from the citation list below. Copy it character-for-character.
- If none match, use the FIRST citation URL.
- If no citations exist, set url to "".
- NEVER fabricate URLs.`,
        },
        {
          role: "user",
          content: `Search results:\n${searchContent}\n\nCitation URLs (pick one EXACTLY):\n${citationList}`,
        },
      ],
      tools: [{
        type: "function",
        function: {
          name: "return_signal",
          description: "Return a single philosophical Bitcoin insight",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Evocative 5-10 word philosophical headline" },
              body: { type: "string", description: "2-3 sentences capturing the philosophical essence" },
              source: { type: "string", description: "Thinker, writer, or publication name" },
              url: { type: "string", description: "Citation URL copied character-for-character" },
            },
            required: ["title", "body", "source", "url"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "return_signal" } },
      temperature: 0.5,
    };

    const models = ["google/gemini-2.5-flash", "google/gemini-3-flash-preview"];
    let signal: any = null;
    let lastStatus = 500;

    for (const model of models) {
      const aiController = new AbortController();
      const aiTimeout = setTimeout(() => aiController.abort(), 18000);
      try {
        const structureResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ ...aiBody, model }),
          signal: aiController.signal,
        });
        clearTimeout(aiTimeout);
        log(`AI ${model} responded ${structureResponse.status}`);

        if (structureResponse.status === 429 || structureResponse.status === 402) {
          lastStatus = structureResponse.status;
          await structureResponse.text();
          break;
        }
        if (!structureResponse.ok) {
          const text = await structureResponse.text();
          console.error(`AI ${model} error:`, structureResponse.status, text);
          lastStatus = structureResponse.status;
          if (model !== models[models.length - 1]) { log("Retrying with fallback model"); continue; }
          break;
        }

        const structureData = await structureResponse.json();
        // Handle tool_call response format
        const toolCall = structureData.choices?.[0]?.message?.tool_calls?.[0];
        const content = toolCall?.function?.arguments || structureData.choices?.[0]?.message?.content;
        if (!content) {
          if (model !== models[models.length - 1]) { log("Empty response, retrying"); continue; }
          throw new Error("No signal returned from AI");
        }

        try {
          signal = typeof content === "string" ? JSON.parse(content) : content;
        } catch {
          const m = (typeof content === "string" ? content : "").match(/\{[\s\S]*\}/);
          if (m) signal = JSON.parse(m[0]);
          else if (model !== models[models.length - 1]) { log("Bad JSON, retrying"); continue; }
          else throw new Error("AI returned invalid JSON");
        }
        break;
      } catch (e) {
        clearTimeout(aiTimeout);
        if (e instanceof DOMException && e.name === "AbortError") {
          log(`AI ${model} timed out after 18s`);
          lastStatus = 504;
          if (model !== models[models.length - 1]) { log("Retrying with fallback model"); continue; }
          const fallback = await serveFallback(svcClient);
          if (fallback) return new Response(JSON.stringify(fallback), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
          return new Response(JSON.stringify({ error: "AI structuring timed out" }), { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        throw e;
      }
    }

    if (!signal) {
      const fallback = await serveFallback(svcClient);
      if (fallback) return new Response(JSON.stringify(fallback), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (lastStatus === 429) return new Response(JSON.stringify({ error: "Rate limited. Try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (lastStatus === 402) return new Response(JSON.stringify({ error: "AI usage limit reached." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI structuring failed after all retries");
    }

    // POST-PROCESSING: Force URL to be from citations + validate
    const aiUrl = signal.url || "";
    const exactMatch = citations.find((c) => c === aiUrl);
    if (exactMatch) {
      signal.url = exactMatch;
    } else {
      try {
        const partialMatch = aiUrl ? citations.find((c) => c.includes(new URL(normalizeUrl(aiUrl)).hostname)) : null;
        signal.url = partialMatch || (citations.length > 0 ? citations[0] : "");
      } catch {
        signal.url = citations.length > 0 ? citations[0] : "";
      }
    }

    if (signal.url && !signal.url.startsWith("http")) {
      signal.url = normalizeUrl(signal.url);
    }

    // URL validation — verify the URL is actually reachable
    let qualityScore = 1;
    if (signal.url) {
      const reachable = await isUrlReachable(signal.url);
      if (!reachable) {
        // Try other citations
        let found = false;
        for (const c of citations) {
          if (c !== signal.url && await isUrlReachable(c)) {
            signal.url = c;
            found = true;
            break;
          }
        }
        if (!found && signal.url) {
          // Fallback to a search URL
          const searchTerm = encodeURIComponent(signal.source || signal.title || "Bitcoin on-chain analysis");
          signal.url = `https://www.google.com/search?q=${searchTerm}`;
        }
      } else {
        qualityScore = 2;
      }
    }

    // Cache good content for future fallback
    if (signal.title && signal.body && signal.source) {
      svcClient.from("companion_cache").insert({
        companion_type: "signal",
        language: langCode,
        content: signal,
        quality_score: qualityScore,
      }).then(() => {});
    }

    log(`done, signal: ${signal.title}, source: ${signal.source}, url: ${signal.url}`);
    return new Response(JSON.stringify(signal), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("signal-companion error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
