import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MILESTONES = [
  { count: 1, reward: '1_week_free', trialDays: 7 },
  { count: 3, reward: '1_month_free', trialDays: 30 },
  { count: 5, reward: 'lifetime', trialDays: 0 },
];

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[RECORD-REFERRAL] ${step}${d}`);
};

async function grantReward(
  supabase: any,
  stripe: any,
  referrerId: string,
  referrerEmail: string,
  milestone: typeof MILESTONES[number]
) {
  // Check if already granted
  const { data: existing } = await supabase
    .from('referral_rewards')
    .select('id')
    .eq('user_id', referrerId)
    .eq('milestone', milestone.count)
    .single();

  if (existing) {
    logStep('Reward already granted', { milestone: milestone.count });
    return;
  }

  if (milestone.reward === 'lifetime') {
    // Grant lifetime access — mark in profiles, cancel Stripe subscription
    await supabase
      .from('profiles')
      .update({ lifetime_access: true })
      .eq('user_id', referrerId);

    // Try to cancel their Stripe subscription (they no longer need it)
    try {
      const customers = await stripe.customers.list({ email: referrerEmail, limit: 1 });
      if (customers.data.length > 0) {
        const subs = await stripe.subscriptions.list({
          customer: customers.data[0].id,
          status: 'active',
          limit: 1,
        });
        if (subs.data.length > 0) {
          await stripe.subscriptions.update(subs.data[0].id, {
            cancel_at_period_end: true,
            metadata: { cancelled_reason: 'lifetime_referral_reward' },
          });
          logStep('Subscription set to cancel at period end for lifetime reward');
        }
      }
    } catch (e) {
      logStep('Error cancelling subscription for lifetime', { error: e.message });
    }
  } else {
    // Extend subscription by adding trial days (credit via Stripe customer balance)
    try {
      const customers = await stripe.customers.list({ email: referrerEmail, limit: 1 });
      if (customers.data.length > 0) {
        const customerId = customers.data[0].id;
        // Credit the customer's balance (negative = credit in cents)
        // $3/month ≈ $0.10/day, 7 days ≈ $0.70, 30 days ≈ $3.00
        const creditCents = milestone.reward === '1_week_free' ? -70 : -300;
        await stripe.customers.createBalanceTransaction(customerId, {
          amount: creditCents,
          currency: 'usd',
          description: `Referral reward: ${milestone.reward} (${milestone.count} referrals)`,
        });
        logStep('Applied balance credit', { creditCents, milestone: milestone.count });
      }
    } catch (e) {
      logStep('Error applying credit', { error: e.message });
    }
  }

  // Record that this reward was granted
  await supabase.from('referral_rewards').insert({
    user_id: referrerId,
    milestone: milestone.count,
    reward_type: milestone.reward,
  });

  logStep('Reward granted', { milestone: milestone.count, reward: milestone.reward });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user from the token
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user }, error: userError } = await anonClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { referral_code } = await req.json();
    if (!referral_code) {
      return new Response(JSON.stringify({ error: 'No referral code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find the referrer
    const { data: referrer } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('referral_code', referral_code)
      .single();

    if (!referrer || referrer.user_id === user.id) {
      return new Response(JSON.stringify({ ok: false, reason: 'Invalid referral' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if already referred
    const { data: existing } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_user_id', user.id)
      .single();

    if (existing) {
      return new Response(JSON.stringify({ ok: false, reason: 'Already referred' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Record the referral
    await supabase.from('referrals').insert({
      referrer_id: referrer.user_id,
      referred_user_id: user.id,
    });

    // Update the referred user's profile
    await supabase
      .from('profiles')
      .update({ referred_by: referral_code })
      .eq('user_id', user.id);

    logStep('Referral recorded, checking milestones');

    // Count total referrals for the referrer
    const { count: referralCount } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', referrer.user_id);

    logStep('Referrer total referrals', { count: referralCount });

    // Get referrer's email for Stripe operations
    const { data: referrerAuth } = await supabase.auth.admin.getUserById(referrer.user_id);
    const referrerEmail = referrerAuth?.user?.email;

    if (referrerEmail && referralCount) {
      const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
      if (stripeKey) {
        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

        // Check each milestone
        for (const milestone of MILESTONES) {
          if (referralCount >= milestone.count) {
            await grantReward(supabase, stripe, referrer.user_id, referrerEmail, milestone);
          }
        }
      } else {
        logStep('STRIPE_SECRET_KEY not set, skipping rewards');
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    logStep('ERROR', { message: e.message });
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
