import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { normalizeSourceUrl } from "../_shared/feed-ingest.ts";
import { createAttemptLogger } from "../_shared/observe.ts";
import { withRequestLogging } from "../_shared/with-request-logging.ts";
import { fetchInitWithIncomingTrace } from "../_shared/forward-trace-headers.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type PreviewBody = { url?: string };

async function firecrawlMarkdown(url: string, apiKey: string, incoming?: Request): Promise<string | null> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 25_000);
    const res = await fetch(
      "https://api.firecrawl.dev/v2/scrape",
      fetchInitWithIncomingTrace(incoming, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          formats: ["markdown"],
          onlyMainContent: false,
          timeout: 20000,
        }),
        signal: controller.signal,
      }),
    );
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json() as {
      success?: boolean;
      data?: { markdown?: string };
    };
    if (!data.success || !data.data?.markdown) return null;
    const md = String(data.data.markdown);
    return md.length > 200_000 ? md.slice(0, 200_000) : md;
  } catch {
    return null;
  }
}

serve(
  withRequestLogging("admin-library-preview", async ({ req, log }) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (profErr || !prof?.is_admin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Feature flag + global budget guard. Admin feature but still worth a
    // cap so a dashboard left open doesn't silently burn credits.
    const svcClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
      auth: { persistSession: false },
    });
    const { guardAiFeature } = await import("../_shared/ratelimit.ts");
    const libGuard = await guardAiFeature(svcClient, "admin_library_preview", {
      userId: userData.user.id,
      providers: ["lovable"],
    });
    if (!libGuard.allowed) {
      return new Response(JSON.stringify({ error: libGuard.reason ?? "Paused" }), {
        status: libGuard.status ?? 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const logAttempt = createAttemptLogger(svcClient, { userId: userData.user.id });
    const LIB_MODEL = "google/gemini-2.5-flash-lite";

    const body = (await req.json()) as PreviewBody;
    const raw = typeof body.url === "string" ? body.url : "";
    const url = normalizeSourceUrl(raw);
    if (!url || !/^https?:\/\//i.test(url)) {
      return new Response(JSON.stringify({ error: "Invalid URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: "FIRECRAWL_API_KEY not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const markdown = await firecrawlMarkdown(url, FIRECRAWL_API_KEY, req);
    if (!markdown?.trim()) {
      return new Response(JSON.stringify({ error: "Could not fetch page content (Firecrawl returned empty)" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      const host = new URL(url).hostname.replace(/^www\./, "");
      return new Response(
        JSON.stringify({
          url,
          title: host,
          author: null,
          summary: markdown.slice(0, 1200).trim(),
          key_quote: null,
          usedLlm: false,
          hint: "LOVABLE_API_KEY missing — returned markdown excerpt only",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const excerpt = markdown.length > 14_000 ? `${markdown.slice(0, 10_000)}\n\n[...]\n\n${markdown.slice(-4000)}` : markdown;

    const t0 = Date.now();
    const llmRes = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      fetchInitWithIncomingTrace(req, {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: LIB_MODEL,
          messages: [
            {
              role: "system",
              content:
                `Return JSON only with keys: title (string), author (string or null), summary (string, 2-4 sentences), key_quote (string or null, only if a short verbatim quote is clearly present). Page URL: ${url}`,
            },
            { role: "user", content: `Markdown from page:\n\n${excerpt}` },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
      }),
    );

    if (!llmRes.ok) {
      logAttempt({
        companion_type: "admin_library_preview",
        provider: "lovable",
        model: LIB_MODEL,
        status: "error",
        latency_ms: Date.now() - t0,
        error_message: `HTTP ${llmRes.status}`,
      });
      const errText = await llmRes.text().catch(() => "");
      return new Response(
        JSON.stringify({
          error: `Structure step failed (${llmRes.status})`,
          detail: errText.slice(0, 200),
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const llmJson = await llmRes.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    logAttempt({
      companion_type: "admin_library_preview",
      provider: "lovable",
      model: LIB_MODEL,
      status: "success",
      latency_ms: Date.now() - t0,
      input_tokens: llmJson.usage?.prompt_tokens,
      output_tokens: llmJson.usage?.completion_tokens,
    });
    let rawJson = llmJson.choices?.[0]?.message?.content ?? "{}";
    rawJson = rawJson.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    let title = "";
    let author: string | null = null;
    let summary = "";
    let key_quote: string | null = null;
    try {
      const parsed = JSON.parse(rawJson) as Record<string, unknown>;
      title = typeof parsed.title === "string" ? parsed.title : "";
      author = typeof parsed.author === "string" ? parsed.author : null;
      summary = typeof parsed.summary === "string" ? parsed.summary : "";
      key_quote = typeof parsed.key_quote === "string" ? parsed.key_quote : null;
    } catch {
      summary = markdown.slice(0, 1200).trim();
    }

    if (!title.trim()) {
      try {
        title = new URL(url).hostname.replace(/^www\./, "");
      } catch {
        title = "Untitled";
      }
    }
    if (!summary.trim()) {
      summary = markdown.slice(0, 1200).trim();
    }

    return new Response(
      JSON.stringify({
        url,
        title: title.trim(),
        author: author?.trim() || null,
        summary: summary.trim(),
        key_quote: key_quote?.trim() || null,
        usedLlm: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    try {
      log.error("admin_library_preview_uncaught", {
        holzen_event: "admin_library_preview_uncaught",
        detail: e instanceof Error ? e.message : String(e),
      });
    } catch {
      /* non-fatal */
    }
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  })
);
