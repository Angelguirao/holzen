import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader ?? "" } },
    });

    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { language } = await req.json().catch(() => ({ language: "en" }));

    // Fetch recent reflections for context
    const { data: reflections } = await sb
      .from("reflections")
      .select("message, context, mood, outcome, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    // Fetch recent journal entries to avoid repetition
    const { data: recentJournals } = await sb
      .from("practice_entries")
      .select("prompt, body")
      .eq("user_id", user.id)
      .eq("type", "journal")
      .order("created_at", { ascending: false })
      .limit(3);

    const contextBlock = reflections?.length
      ? `Recent reflections:\n${reflections.map((r: any) => `- [${r.context ?? "no context"}] ${r.message} (mood: ${r.mood ?? "unknown"}, outcome: ${r.outcome ?? "pending"})`).join("\n")}`
      : "No recent reflections available.";

    const recentPromptsBlock = recentJournals?.length
      ? `\n\nRecent journal prompts (DO NOT repeat these):\n${recentJournals.map((j: any) => `- ${j.prompt}`).join("\n")}`
      : "";

    const systemPrompt = `You are a reflective journaling guide for Bitcoin holders who use a mindfulness app called Holzen. Your job is to generate 3 unique, thought-provoking journal prompts that help the user explore their emotional relationship with their investment decisions.

Rules:
- Each prompt should be 1 sentence, open-ended, and introspective
- Draw from the user's recent reflections when available — reference patterns, moods, or decisions you notice
- Vary the angle: one about emotions, one about patterns/behavior, one about future intention
- Be warm but not patronizing. Speak like a wise friend, not a therapist
- Respond in ${language === "en" ? "English" : language}
- Return ONLY a JSON array of 3 strings, nothing else

${contextBlock}${recentPromptsBlock}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate 3 journal prompts for me." },
        ],
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const raw = result.choices?.[0]?.message?.content ?? "[]";

    // Extract JSON array from response (handle markdown code blocks)
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    const prompts = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return new Response(JSON.stringify({ prompts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("journal-prompt error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
