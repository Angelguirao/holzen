import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("No authorization header");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData?.user) throw new Error("Unauthorized");
    const userId = userData.user.id;
    const email = userData.user.email;

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Cancel active Stripe subscriptions
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (stripeKey && email) {
      try {
        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
        const customers = await stripe.customers.list({ email, limit: 1 });
        if (customers.data.length > 0) {
          const subscriptions = await stripe.subscriptions.list({
            customer: customers.data[0].id,
            status: "active",
            limit: 10,
          });
          for (const sub of subscriptions.data) {
            await stripe.subscriptions.cancel(sub.id);
          }
          // Also cancel trialing
          const trialing = await stripe.subscriptions.list({
            customer: customers.data[0].id,
            status: "trialing",
            limit: 10,
          });
          for (const sub of trialing.data) {
            await stripe.subscriptions.cancel(sub.id);
          }
        }
      } catch (e) {
        console.error("Stripe cancellation error (continuing):", e);
      }
    }

    // Delete all user data from every table
    // Order: dependent tables first (collection_items before collections, library_items before reflections)
    await serviceClient.from('collection_items').delete().in(
      'collection_id',
      (await serviceClient.from('collections').select('id').eq('user_id', userId)).data?.map(c => c.id) ?? []
    );

    await Promise.all([
      serviceClient.from('graph_edges').delete().eq('user_id', userId),
      serviceClient.from('user_signal_preferences').delete().eq('user_id', userId),
      serviceClient.from('library_items').delete().eq('user_id', userId),
      serviceClient.from('collections').delete().eq('user_id', userId),
      serviceClient.from('reflection_insights').delete().eq('user_id', userId),
      serviceClient.from('night_reflections').delete().eq('user_id', userId),
      serviceClient.from('user_badges').delete().eq('user_id', userId),
      serviceClient.from('practice_entries').delete().eq('user_id', userId),
      serviceClient.from('ritual_completions').delete().eq('user_id', userId),
      serviceClient.from('ritual_templates').delete().eq('user_id', userId),
      serviceClient.from('future_letters').delete().eq('user_id', userId),
      serviceClient.from('feedback').delete().eq('user_id', userId),
      serviceClient.from('analytics_events').delete().eq('user_id', userId),
      serviceClient.from('testimonials').delete().eq('user_id', userId),
      serviceClient.from('roadmap_votes').delete().eq('user_id', userId),
      serviceClient.from('push_subscriptions').delete().eq('user_id', userId),
      serviceClient.from('referral_rewards').delete().eq('user_id', userId),
      serviceClient.from('referrals').delete().eq('referrer_id', userId),
    ]);

    // Delete reflections and profile last
    await serviceClient.from('reflections').delete().eq('user_id', userId);
    await serviceClient.from('profiles').delete().eq('user_id', userId);

    // Delete the auth user
    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
