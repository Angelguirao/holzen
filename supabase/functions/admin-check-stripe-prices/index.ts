import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { withRequestLogging } from "../_shared/with-request-logging.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Admin-only guardrail: verifies the four Stripe price ID secrets
 * (Pro, Pro+, Flex S, Flex M) are present, well-formed (`price_…`),
 * and actually resolve against Stripe with a recurring/one-off mode
 * matching their intended use. Read-only — never mutates Stripe.
 */

const REQUIRED = [
  { secret: "STRIPE_PRICE_ID_PRO", label: "Pro subscription", expected: "recurring" },
  { secret: "STRIPE_PRICE_ID_PRO_PLUS", label: "Pro+ subscription", expected: "recurring" },
  { secret: "STRIPE_PRICE_ID_FLEX_PACK_S", label: "Flex pack S", expected: "one_time" },
  { secret: "STRIPE_PRICE_ID_FLEX_PACK_M", label: "Flex pack M", expected: "one_time" },
] as const;

type CheckResult = {
  secret: string;
  label: string;
  ok: boolean;
  value: string | null;
  error: string | null;
  active?: boolean;
  type?: string;
  expected_type?: string;
  amount?: number | null;
  currency?: string | null;
};

serve(
  withRequestLogging("admin-check-stripe-prices", async ({ req }) => {
    if (req.method !== "POST" && req.method !== "GET") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "STRIPE_SECRET_KEY is not configured",
          results: [],
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const results: CheckResult[] = [];
    for (const item of REQUIRED) {
      const value = Deno.env.get(item.secret) ?? null;
      const base: CheckResult = {
        secret: item.secret,
        label: item.label,
        ok: false,
        value,
        error: null,
        expected_type: item.expected,
      };

      if (!value) {
        results.push({ ...base, error: "Secret is not set" });
        continue;
      }
      const trimmed = value.trim();
      if (!trimmed.startsWith("price_")) {
        results.push({
          ...base,
          error:
            trimmed.startsWith("prod_")
              ? "This is a Stripe Product ID (prod_…). The secret must be a Price ID (price_…)."
              : "Invalid format — Stripe Price IDs must start with 'price_'.",
        });
        continue;
      }

      try {
        const price = await stripe.prices.retrieve(trimmed);
        const matches = item.expected === "recurring"
          ? price.type === "recurring"
          : price.type === "one_time";
        results.push({
          ...base,
          ok: price.active && matches,
          active: price.active,
          type: price.type,
          amount: price.unit_amount ?? null,
          currency: price.currency ?? null,
          error: !price.active
            ? "Price exists but is archived/inactive in Stripe."
            : !matches
              ? `Price type is '${price.type}' but expected '${item.expected}'.`
              : null,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push({ ...base, error: msg });
      }
    }

    const allOk = results.every((r) => r.ok);
    return new Response(
      JSON.stringify({ ok: allOk, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }),
);