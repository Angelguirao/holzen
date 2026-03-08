import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { category, message } = await req.json();
    if (!message?.trim()) throw new Error("Message is required");
    if (!["bug", "feature", "question"].includes(category)) throw new Error("Invalid category");

    // Save to DB
    const { error: insertError } = await supabase
      .from("feedback")
      .insert({ user_id: user.id, category, message: message.trim() });
    if (insertError) throw insertError;

    // Send email via Resend
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (RESEND_API_KEY) {
      const categoryEmoji: Record<string, string> = {
        bug: "🐛",
        feature: "💡",
        question: "❓",
      };

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Holzen Feedback <notify@notify.holzen.app>",
          to: ["hello@holzen.app"],
          subject: `${categoryEmoji[category] || ""} [${category.toUpperCase()}] New feedback from ${user.email}`,
          html: `
            <div style="font-family: monospace; max-width: 600px; margin: 0 auto;">
              <h2 style="font-size: 14px; color: #666;">New Feedback</h2>
              <table style="font-size: 13px; border-collapse: collapse; width: 100%;">
                <tr><td style="padding: 4px 8px; color: #999;">Category</td><td style="padding: 4px 8px;">${category}</td></tr>
                <tr><td style="padding: 4px 8px; color: #999;">User</td><td style="padding: 4px 8px;">${user.email}</td></tr>
                <tr><td style="padding: 4px 8px; color: #999;">User ID</td><td style="padding: 4px 8px; font-size: 11px;">${user.id}</td></tr>
              </table>
              <div style="margin-top: 16px; padding: 12px; background: #f5f5f5; border-radius: 6px; font-size: 13px; white-space: pre-wrap;">${message.trim()}</div>
            </div>
          `,
        }),
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-feedback error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
