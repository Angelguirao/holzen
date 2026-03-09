import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { reflectionMessage } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are a wellness ritual designer for Bitcoin holders. Based on the user's current emotional state, suggest a ritual sequence.

Available step types:
- breathe: Breathing exercise (3 cycles inhale/hold/exhale)
- grounding: 5-4-3-2-1 sensory grounding exercise
- checkin: Emotional mood check-in
- reflect: Read and sit with a reflection message
- review: Review personal stats (hold rate, mood patterns)
- journal: Free-form journaling
- physical: Physical action (specify action and durationMinutes)
- decide: Final decision step (hold/sell/buy/nothing) - ALWAYS include as last step

Return a JSON object with:
- steps: array of step objects, each with "type" (required), and for physical steps also "action" (string) and "durationMinutes" (number)
- reasoning: one sentence explaining why this sequence

${reflectionMessage ? `The user's current reflection: "${reflectionMessage}"` : "No active reflection - suggest a general preparedness ritual."}

Respond ONLY with valid JSON.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate steps have valid types
    const validTypes = ['breathe', 'grounding', 'checkin', 'reflect', 'review', 'journal', 'physical', 'decide'];
    const steps = (parsed.steps || []).filter((s: any) => validTypes.includes(s.type));
    
    // Ensure decide is last
    if (!steps.length || steps[steps.length - 1]?.type !== 'decide') {
      steps.push({ type: 'decide' });
    }

    return new Response(JSON.stringify({ steps, reasoning: parsed.reasoning }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-ritual error:", e);
    // Fallback to standard template
    return new Response(JSON.stringify({
      steps: [{ type: "breathe" }, { type: "reflect" }, { type: "journal" }, { type: "decide" }],
      reasoning: "Fallback to standard ritual",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
