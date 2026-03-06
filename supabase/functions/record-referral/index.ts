import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
