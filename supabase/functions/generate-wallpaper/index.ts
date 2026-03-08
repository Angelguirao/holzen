import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { message, mood, context } = await req.json();
    if (!message) throw new Error("Missing reflection message");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build a rich prompt for the wallpaper
    const moodDescriptions: Record<string, string> = {
      calm: "serene, peaceful, soft blues and greens, gentle flowing water",
      anxious: "turbulent skies clearing, tension releasing, deep purples fading to amber",
      confident: "bold geometric forms, warm golden light, strong composition",
      fearful: "dark storm clouds parting to reveal light, dramatic contrast",
      neutral: "minimalist zen garden, balanced stones, muted earth tones",
      excited: "vibrant energy, dynamic shapes, warm oranges and electric blues",
    };

    const moodStyle = mood && moodDescriptions[mood] 
      ? moodDescriptions[mood] 
      : "abstract minimalist, contemplative, muted warm earth tones";

    const contextHint = context 
      ? `The market context is: ${context}. ` 
      : "";

    const prompt = `Create a beautiful, artistic phone wallpaper (portrait orientation) inspired by this personal reflection about financial composure: "${message.substring(0, 200)}". ${contextHint}Visual style: ${moodStyle}. The image should be abstract and atmospheric — no text, no words, no letters, no numbers. Think fine art photography or abstract painting. Moody, cinematic lighting. Suitable as a phone lock screen wallpaper. High quality, visually striking.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("Failed to generate wallpaper");
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error("No image was generated");
    }

    return new Response(
      JSON.stringify({ image: imageUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-wallpaper error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
