import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

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
    if (!authHeader) throw new Error("Missing authorization");

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify the caller is authenticated (basic auth check)
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error } = await anonClient.auth.getUser();
    if (error || !user) throw new Error("Not authenticated");

    // Check if user has lifetime_access (admin proxy — only admins should call this)
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("lifetime_access")
      .eq("user_id", user.id)
      .single();

    if (!profile?.lifetime_access) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: body } = await req.json().then(b => ({ data: b })).catch(() => ({ data: {} }));
    const days = body?.days ?? 30;

    const since = new Date(Date.now() - days * 86400000).toISOString();

    // Funnel counts using service role (bypasses RLS)
    const events = ["signup", "first_reflection", "hit_free_limit", "upgrade_click", "pro_feature_blocked", "subscribed"];
    const counts: Record<string, number> = {};

    for (const event of events) {
      const { count } = await serviceClient
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("event", event)
        .gte("created_at", since);
      counts[event] = count ?? 0;
    }

    // Unique users per event
    const uniqueUsers: Record<string, number> = {};
    for (const event of events) {
      const { data } = await serviceClient
        .from("analytics_events")
        .select("user_id")
        .eq("event", event)
        .gte("created_at", since);
      const unique = new Set((data || []).map((r: any) => r.user_id));
      uniqueUsers[event] = unique.size;
    }

    // Conversion rates
    const signups = uniqueUsers.signup || 1;
    const conversionRate = ((uniqueUsers.subscribed || 0) / signups * 100).toFixed(1);
    const upgradeClickRate = ((uniqueUsers.upgrade_click || 0) / signups * 100).toFixed(1);
    const limitHitRate = ((uniqueUsers.hit_free_limit || 0) / signups * 100).toFixed(1);

    return new Response(JSON.stringify({
      period_days: days,
      total_events: counts,
      unique_users: uniqueUsers,
      funnel: {
        signup_to_first_reflection: ((uniqueUsers.first_reflection || 0) / signups * 100).toFixed(1) + "%",
        signup_to_hit_limit: limitHitRate + "%",
        signup_to_upgrade_click: upgradeClickRate + "%",
        signup_to_subscribed: conversionRate + "%",
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
