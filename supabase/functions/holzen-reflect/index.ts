import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TONE_INSTRUCTIONS: Record<string, string> = {
  stoic: "Write in a calm, stoic tone. Brief and grounded. Like Marcus Aurelius observing the market.",
  zen: "Write in a gentle zen tone. Spacious, almost meditative. Use natural metaphors.",
  poetic: "Write in a poetic, literary tone. Evocative and beautiful. Use imagery and rhythm.",
  blunt: "Write in a direct, blunt tone. No fluff. Say it plainly in as few words as possible.",
};

const STYLE_INSTRUCTIONS: Record<string, string> = {
  standard: "Write a reflection in 1-3 sentences.",
  "one-liner": "Write EXACTLY one sentence. Concise and impactful.",
  question: "Respond with EXACTLY one thought-provoking question. No statements.",
  metaphor: "Use a single vivid metaphor to frame the moment. 1-2 sentences max.",
  koan: "Write a short zen koan or paradox related to the moment. 1-2 sentences.",
};

// Thematic framings that rotate per session to prevent repetitive structures.
// Each tone has its own pool of angles — the system picks one at random.
const TONE_FRAMINGS: Record<string, string[]> = {
  stoic: [
    "Frame this through Seneca's lens: what is within your control vs. what is not.",
    "Channel Marcus Aurelius' 'view from above' — zoom out to see this moment in the arc of a lifetime.",
    "Apply Epictetus' distinction between events and our judgments about events.",
    "Consider what a stoic sage would notice about the gap between stimulus and response right now.",
    "Reflect through the stoic concept of amor fati — loving one's fate, including this very moment.",
    "Use the stoic practice of premeditatio malorum — this was always a possibility, and you prepared for it.",
  ],
  zen: [
    "Use the image of water — rivers, rain, still ponds — to reflect on impermanence.",
    "Frame this as a koan-like observation about the nature of attachment to outcomes.",
    "Draw from the beginner's mind (shoshin) — what would someone seeing this for the first time notice?",
    "Use the metaphor of seasons changing — nothing about this moment is permanent.",
    "Reflect through the zen concept of mu (emptiness) — what remains when the numbers are stripped away?",
    "Frame through kintsukuroi — the beauty in broken things, the gold in the cracks.",
  ],
  poetic: [
    "Use the imagery of the ocean — tides, depths, horizons — to frame this moment.",
    "Draw from the language of astronomy — constellations, orbits, the vastness of space.",
    "Frame through the lens of music — rhythm, silence between notes, dissonance resolving.",
    "Use the imagery of geology — tectonic shifts, erosion, the patience of stone.",
    "Draw from weather — not storms (too obvious), but the quiet before, the light after, the way clouds reshape.",
    "Frame through the language of gardening — seeds, dormancy, seasons of growth and rest.",
  ],
  blunt: [
    "Name the emotion plainly. No metaphor, no spin.",
    "State what actually changed vs. what the mind is making up about it.",
    "Point out the gap between what happened and the story being told about it.",
    "Ask one hard question about what this reaction reveals.",
    "Name the cognitive bias at play — no sugar-coating.",
    "Separate the signal from the noise in one sentence.",
  ],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { createClient } = await import("npm:@supabase/supabase-js@2.57.2");
    const sbClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await sbClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Track AI usage (no enforcement yet — monitoring only)
    const userId = claimsData.claims.sub as string;
    const svcClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    try { await svcClient.from("analytics_events").insert({ user_id: userId, event: "pause_ai_call" }); } catch (_) { /* tracking failure is non-fatal */ }

    const { context, tone, customPrompt, style, moodHistory, severity, motivations, mantra, groundingActivities, currency, language, recentHaikus, learningSources } = await req.json();
    if (!context) {
      return new Response(JSON.stringify({ error: "Missing context" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // --- Learning content is now handled entirely by the dedicated ground-nudge function ---
    // No Perplexity search here — avoids duplicate paths and domain filter issues.
    // holzen-reflect still generates fallback learning_title/body via AI for backward compat,
    // but ground-nudge is the primary source of grounding content.
    const learningSearchContent = "";
    const learningCitations: string[] = [];

    // --- Adaptive tone logic ---
    const baseTone = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.stoic;
    const baseStyle = STYLE_INSTRUCTIONS[style] || STYLE_INSTRUCTIONS.standard;
    
    // Pick a random thematic framing for this session
    const framingPool = TONE_FRAMINGS[tone] || TONE_FRAMINGS.stoic;
    const thematicFraming = framingPool[Math.floor(Math.random() * framingPool.length)];

    let adaptiveContext = "";

    // Analyze mood history for patterns
    if (moodHistory && Array.isArray(moodHistory) && moodHistory.length > 0) {
      const moods = moodHistory.map((m: any) => m.mood);
      const anxiousCount = moods.filter((m: string) => m === "anxious").length;
      const calmCount = moods.filter((m: string) => m === "calm").length;
      const total = moods.length;
      const anxiousRate = anxiousCount / total;
      const calmRate = calmCount / total;

      const recentMoods = moods.slice(0, 3);
      const recentAllAnxious = recentMoods.every((m: string) => m === "anxious");
      const recentAllCalm = recentMoods.every((m: string) => m === "calm");

      const outcomes = moodHistory.map((m: any) => m.outcome).filter(Boolean);
      const soldCount = outcomes.filter((o: string) => o === "sold").length;
      const soldRate = outcomes.length > 0 ? soldCount / outcomes.length : 0;

      if (recentAllAnxious) {
        adaptiveContext += "\nADAPTIVE CONTEXT: The user has been anxious in their last 3 reflections. Be extra gentle and grounding. Prioritize calm and spaciousness over challenge.";
      } else if (anxiousRate > 0.5) {
        adaptiveContext += "\nADAPTIVE CONTEXT: The user tends toward anxiety in their reflections. Lean toward warmth and reassurance without being patronizing.";
      } else if (recentAllCalm) {
        adaptiveContext += "\nADAPTIVE CONTEXT: The user has been consistently calm recently. You can be slightly more thought-provoking or philosophical — they can handle depth.";
      } else if (calmRate > 0.6) {
        adaptiveContext += "\nADAPTIVE CONTEXT: The user is generally composed. Offer reflections that reward their steadiness with deeper insight.";
      }

      if (soldRate > 0.4 && outcomes.length >= 3) {
        adaptiveContext += "\nThe user has a pattern of selling during volatility. Gently invite pause without judgment.";
      }
    }

    // Adjust for market severity
    const sev = typeof severity === "number" ? severity : 0;
    if (sev >= 15) {
      adaptiveContext += "\nMARKET SEVERITY: Extreme move (15%+). This is a rare, high-stress moment. Be exceptionally calm and anchoring. Shorter is better.";
    } else if (sev >= 10) {
      adaptiveContext += "\nMARKET SEVERITY: Major move (10%+). Emotions are likely running high. Prioritize grounding over insight.";
    } else if (sev >= 7) {
      adaptiveContext += "\nMARKET SEVERITY: Significant move (7%+). Balance grounding with perspective.";
    }

    // Build haiku dedup instruction — extract banned imagery words
    let haikuDedup = "";
    if (recentHaikus && Array.isArray(recentHaikus) && recentHaikus.length > 0) {
      // Extract key imagery words to explicitly ban
      const stopWords = new Set(["the","a","an","is","in","on","of","and","to","with","its","that","this","for","are","was","has","had","but","not","from","they","all","been","have","will","can","just","or","as","at","be","it","so","no","do","my","by"]);
      const wordCounts: Record<string, number> = {};
      for (const h of recentHaikus.slice(0, 5)) {
        const words = h.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter((w: string) => w.length > 2 && !stopWords.has(w));
        for (const w of words) { wordCounts[w] = (wordCounts[w] || 0) + 1; }
      }
      // Words appearing 2+ times across recent haikus are "overused"
      const bannedWords = Object.entries(wordCounts).filter(([_, c]) => c >= 2).map(([w]) => w);

      haikuDedup = `\n\nHAIKU DEDUPLICATION: The user has recently received these haikus. You MUST write something COMPLETELY DIFFERENT — different imagery, different words, different structure:\n${recentHaikus.slice(0, 5).map((h: string, i: number) => `${i + 1}. "${h}"`).join("\n")}`;
      if (bannedWords.length > 0) {
        haikuDedup += `\n\nBANNED IMAGERY — these words/images appeared repeatedly and MUST NOT appear in your haiku: ${bannedWords.join(", ")}. Find entirely fresh imagery — seasons, objects, textures, sounds, landscapes, body sensations — anything NOT in this list.`;
      }
    }

    // Build learning grounding section
    let learningInstruction = "";
    if (learningSearchContent) {
      const citationRef = learningCitations.length > 0
        ? `\nAvailable citation URLs for learning_url:\n${learningCitations.map((c: string, i: number) => `[${i + 1}] ${c}`).join("\n")}`
        : "";
      learningInstruction = `\n\nLEARNING GROUNDING: Use the following search results to write the learning_title and learning_body. Extract real facts, dates, and data points. Do NOT invent information.\nSearch results: ${learningSearchContent}${citationRef}`;
    }

    const currencyCode = currency || "USD";
    const langCode = language || "en";
    const LANG_NAMES: Record<string, string> = { en: "English", es: "Spanish", pt: "Portuguese", de: "German", nl: "Dutch", fr: "French", tr: "Turkish" };
    const langName = LANG_NAMES[langCode] || "English";
    const langInstruction = langCode !== "en" ? `CRITICAL LANGUAGE REQUIREMENT: You MUST write ALL output — message, haiku, learning_title, and learning_body — in ${langName}. Every single field must be in ${langName}. Do NOT use English for any generated text. This is non-negotiable.\n\n` : "";

    const systemPrompt = `${langInstruction}You generate a reflection with optional companions in response to Bitcoin volatility.

You MUST respond with a JSON object containing these keys:
- "message": The core reflection message (1-3 sentences)${langCode !== "en" ? ` in ${langName}` : ""}
- "haiku": A haiku (3 lines separated by newlines, 5-7-5 syllables)${langCode !== "en" ? ` in ${langName}` : ""}
- "learning_title": Short factual headline about a psychological principle or cognitive bias (5-10 words)${langCode !== "en" ? ` in ${langName}` : ""}
- "learning_body": 1-2 sentences about a behavioral finance principle, cognitive bias, or decision psychology research finding relevant to the emotional moment${langCode !== "en" ? ` in ${langName}` : ""}
- "learning_citation": Source name (e.g. "Kahneman & Tversky, 1979" or "Glassnode Research")
- "learning_url": A URL from the citation list if available, or "" if none

Tone: ${baseTone}
THEMATIC ANGLE FOR THIS SESSION: ${thematicFraming}
${adaptiveContext}

CURRENCY: The user views BTC prices in ${currencyCode}. When mentioning any price or monetary value, format it in ${currencyCode}.

The context may include a Fear & Greed Index score (0-100). Use this to subtly adjust your reflection:
- Extreme Fear (0-24): The crowd is panicking. Reflect on what happens when fear spreads.
- Fear (25-44): Unease is building. A good moment to notice what's driving decisions.
- Neutral (45-55): The market is quiet. Sometimes stillness is its own signal.
- Greed (56-75): Optimism is growing. Worth noticing if excitement is clouding judgment.
- Extreme Greed (76-100): Euphoria is everywhere. The hardest time to stay grounded.
Do NOT name the index or its score directly. Weave the sentiment naturally into the reflection.

Reflection rules:
- Style: ${baseStyle}
- ${tone === 'blunt' ? '1 sentence preferred.' : ''}
- Encourage pause and reflection. Preserve agency: never say "you should".
- No reassurance, excitement, urgency, trading advice, lists, disclaimers.
- No exclamation marks, emojis, motivational language, reward language.
- Just one quiet prompt for reflection.${customPrompt ? `\n\nUser's personal reflection guidance: "${customPrompt}"` : ''}${motivations && motivations.length > 0 ? `\n\nThe user's core motivations for holding: ${motivations.join(', ')}. Subtly weave this context into the reflection when relevant — don't lecture about it.` : ''}${mantra ? `\n\nThe user's personal mantra: "${mantra}". You may gently echo its spirit when it fits the moment.` : ''}${groundingActivities && groundingActivities.length > 0 ? `\n\nThe user's personal grounding activities: ${groundingActivities.join(', ')}. When the moment calls for it, gently suggest one of these as a way to ground before deciding. Frame it as a personal reminder, not generic advice.` : ''}

Haiku rules:
- Exactly 3 lines separated by newlines.
- Traditional 5-7-5 syllable structure.
- Captures the essence of the moment. Match the chosen tone.
- No trading advice or price predictions.
- MUST be original and unique — never repeat common phrases like "red screens" or "breath moves".${haikuDedup}
    ${learningInstruction || `
Learning input rules:
- Title: a short, factual headline about a psychological principle or cognitive bias (5-10 words).
- Body: 1-2 sentences about a behavioral finance principle (loss aversion, anchoring, endowment effect, herd behavior, etc.), decision psychology research, or emotional regulation technique relevant to the current emotional context. Cite real researchers (Kahneman, Tversky, Thaler, Ariely, etc.) when possible. Do NOT write about Bitcoin price history, market patterns, or on-chain data — focus on the HUMAN psychology of the moment.
- Citation: Name the researcher, paper, or book (e.g. "Kahneman & Tversky, 1979", "Richard Thaler, Nudge").`}`;

    const aiBody = {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: context },
      ],
      response_format: { type: "json_object" },
    };

    const models = ["google/gemini-3-flash-preview", "google/gemini-2.5-flash"];
    let result: any = null;
    let lastStatus = 500;

    for (const model of models) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...aiBody, model }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (response.status === 429 || response.status === 402) {
          lastStatus = response.status;
          await response.text();
          break;
        }
        if (!response.ok) {
          const text = await response.text();
          console.error(`AI ${model} error:`, response.status, text);
          lastStatus = response.status;
          if (model !== models[models.length - 1]) continue;
          break;
        }

        const data = await response.json();
        const raw = data.choices?.[0]?.message?.content || "";

        try {
          result = typeof raw === "string" ? JSON.parse(raw) : raw;
        } catch {
          const m = (typeof raw === "string" ? raw : "").match(/\{[\s\S]*\}/);
          if (m) result = JSON.parse(m[0]);
          else if (model !== models[models.length - 1]) continue;
          else throw new Error("AI returned invalid JSON");
        }

        if (result?.message) break;
        if (model !== models[models.length - 1]) { result = null; continue; }
      } catch (e) {
        clearTimeout(timeout);
        if (e instanceof DOMException && e.name === "AbortError") {
          console.warn(`[holzen-reflect] AI ${model} timed out`);
          lastStatus = 504;
          if (model !== models[models.length - 1]) continue;
          return new Response(JSON.stringify({ error: "AI timed out" }), { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        throw e;
      }
    }

    if (!result?.message) {
      if (lastStatus === 429) return new Response(JSON.stringify({ error: "Rate limited. Try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (lastStatus === 402) return new Response(JSON.stringify({ error: "AI usage limit reached." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI generation failed after all retries");
    }

    // Post-process learning URL — ensure it's from citations
    let learningUrl = result.learning_url || "";
    if (learningUrl && learningCitations.length > 0 && !learningCitations.includes(learningUrl)) {
      learningUrl = learningCitations[0];
    } else if (!learningUrl && learningCitations.length > 0) {
      learningUrl = learningCitations[0];
    }

    return new Response(JSON.stringify({
      message: result.message,
      haiku: result.haiku || null,
      learning_title: result.learning_title || null,
      learning_body: result.learning_body || null,
      learning_citation: result.learning_citation || null,
      learning_url: learningUrl || null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("holzen-reflect error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
