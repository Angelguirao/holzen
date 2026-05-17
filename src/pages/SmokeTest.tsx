import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ExternalLink, CreditCard, ListChecks, Wallet, FileText, RotateCw } from 'lucide-react';
import { AdminSubNav } from '@/components/admin/AdminSubNav';

const TEST_CARDS = [
  { label: 'Success', number: '4242 4242 4242 4242', note: 'Standard happy path' },
  { label: 'Requires auth (3DS)', number: '4000 0027 6000 3184', note: 'Tests SCA / authentication step' },
  { label: 'Decline (generic)', number: '4000 0000 0000 0002', note: 'Card declined; checkout fails cleanly' },
  { label: 'Insufficient funds', number: '4000 0000 0000 9995', note: 'Decline reason: insufficient_funds' },
];

type Scenario = {
  id: 'A' | 'A2' | 'B' | 'C' | 'D';
  title: string;
  goal: string;
  steps: string[];
  verify: { label: string; where: string }[];
};

const SCENARIOS: Scenario[] = [
  {
    id: 'A',
    title: 'Onboarding trial — ensure-trial-subscription',
    goal: 'Confirm the 7-day Pro trial starts in-app (no Checkout redirect, no card at signup).',
    steps: [
      'Sign in with a disposable test user who has no Stripe subscription yet.',
      'Complete onboarding step 2 and tap "Start your free trial" (or call Bruno `ensure-trial-subscription`).',
      'Land on Home with trial entitlement; primary pause CTA should be available.',
    ],
    verify: [
      { label: 'ensure-trial-subscription returns { ok: true, subscription_status: trialing }', where: 'Edge logs / Bruno active/03' },
      { label: 'check-subscription returns subscribed=true, tier=pro', where: 'Edge logs: check-subscription' },
      { label: 'profiles.subscription_tier = pro, subscription_status = trialing', where: 'DB: profiles row' },
      { label: 'PostHog trial.started with source ensure_trial (when created: true)', where: 'PostHog live events' },
    ],
  },
  {
    id: 'A2',
    title: 'Reactivation — Pro via Checkout (post-trial / lapsed)',
    goal: 'After trial ends without a card, Checkout reactivation creates an active paid subscription.',
    steps: [
      'Use a lapsed test user (or cancel trial in Stripe test mode).',
      'From Home or Settings, start reactivation checkout.',
      'Pay with 4242 4242 4242 4242; return with ?subscribed=true.',
    ],
    verify: [
      { label: 'create-checkout (reactivation) + stripe-webhook fired', where: 'Edge logs' },
      { label: 'profiles.subscription_status = active (or trialing if trial re-applied in Stripe)', where: 'DB: profiles row' },
      { label: 'notify-checkout-confirmation when applicable', where: 'Edge logs: notify-checkout-confirmation' },
    ],
  },
  {
    id: 'B',
    title: 'Subscription — Pro Plus',
    goal: 'Same as A but for the higher tier; verifies the planTier branch in create-checkout.',
    steps: [
      'From upgrade UI, choose Pro Plus.',
      'Pay with 4242 4242 4242 4242.',
      'Verify confirmation dialog reflects Pro Plus allowances.',
    ],
    verify: [
      { label: 'create-checkout received planTier=pro_plus', where: 'Edge logs: create-checkout' },
      { label: 'subscription metadata.plan_tier = pro_plus', where: 'Stripe Dashboard → Subscription metadata' },
      { label: 'profiles.subscription_tier = pro_plus', where: 'DB: profiles row' },
    ],
  },
  {
    id: 'C',
    title: 'Flex Pack S — one-off credits (+30)',
    goal: 'Verify the small flex pack grants exactly 30 credits and is recorded in the ledger.',
    steps: [
      'From Settings, buy Flex Pack S.',
      'Pay with 4242 4242 4242 4242.',
      'Land on /settings?credits=true; confirmation dialog shows credits added + new balance.',
    ],
    verify: [
      { label: 'stripe-webhook fired with checkout_kind=flex_pack_s', where: 'Edge logs: stripe-webhook' },
      { label: 'credit_ledger row: delta_credits=+30, reason=flex_pack_purchase', where: 'DB: credit_ledger' },
      { label: 'credit_wallets.balance_credits incremented by 30', where: 'DB: credit_wallets, or Settings → Credits widget' },
      { label: 'No duplicate ledger row on webhook replay (idempotent on session id)', where: 'DB: credit_ledger source_ref' },
    ],
  },
  {
    id: 'D',
    title: 'Flex Pack M — one-off credits (+55)',
    goal: 'Same as C with the larger pack; also exercise the manual retry path if grant fails.',
    steps: [
      'Buy Flex Pack M with 4242 4242 4242 4242.',
      'If the wallet does NOT update within ~30s, open Admin → use retry-flex-credit on the session id.',
    ],
    verify: [
      { label: 'credit_ledger row: delta_credits=+55', where: 'DB: credit_ledger' },
      { label: 'Wallet shows new balance', where: 'Settings → Credits' },
      { label: 'On manual retry: no double-credit (same source_ref)', where: 'Edge logs: retry-flex-credit + DB' },
    ],
  },
];

export default function SmokeTest() {
  const { isAdmin, loading } = useIsAdmin();
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  if (loading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <div className="p-8">Admin only.</div>;

  const toggle = (k: string) => setChecked(s => ({ ...s, [k]: !s[k] }));
  const reset = () => setChecked({});

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <AdminSubNav />
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <ListChecks className="h-4 w-4" />
          <span>Admin · QA</span>
        </div>
        <h1 className="text-2xl font-semibold">Stripe checkout smoke test</h1>
        <p className="text-sm text-muted-foreground">
          Walk through scenarios A–D end-to-end with Stripe test cards. Tick each step as you go.
          Use this before a release that touches checkout, webhooks, credits, or notifications.
        </p>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4" /> Test cards</CardTitle>
          <CardDescription>Stripe test mode only. Any future expiry, any CVC, any ZIP.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {TEST_CARDS.map(c => (
            <div key={c.number} className="flex items-center justify-between gap-4 text-sm">
              <div>
                <div className="font-medium">{c.label}</div>
                <div className="text-xs text-muted-foreground">{c.note}</div>
              </div>
              <code className="text-xs bg-muted px-2 py-1 rounded">{c.number}</code>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Where to verify</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex items-start gap-2">
            <Wallet className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
            <div>
              <div className="font-medium">Wallet & ledger</div>
              <div className="text-muted-foreground">
                <Link to="/settings" className="underline">Settings → Credits</Link> for live balance.
                Query <code>credit_ledger</code> and <code>credit_wallets</code> for the source of truth.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
            <div>
              <div className="font-medium">Edge function logs</div>
              <div className="text-muted-foreground">
                Watch <code>create-checkout</code>, <code>stripe-webhook</code>,
                <code> check-subscription</code>, <code>notify-checkout-confirmation</code>,
                <code> retry-flex-credit</code>. Filter by your <code>cid</code> (sent as <code>x-cid</code>).
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <ExternalLink className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
            <div>
              <div className="font-medium">Stripe Dashboard (test mode)</div>
              <div className="text-muted-foreground">
                Customers → your test email. Inspect Subscription, Checkout Session, and Webhook attempt history.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <ListChecks className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
            <div>
              <div className="font-medium">In-app history</div>
              <div className="text-muted-foreground">
                <Link to="/settings/billing-history" className="underline">Settings → Billing history</Link> for the user-visible trail.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Progress: {Object.values(checked).filter(Boolean).length} ticked
        </div>
        <Button variant="outline" size="sm" onClick={reset}><RotateCw className="h-3.5 w-3.5" /> Reset</Button>
      </div>

      {SCENARIOS.map(s => {
        const stepKeys = s.steps.map((_, i) => `${s.id}.s${i}`);
        const verifyKeys = s.verify.map((_, i) => `${s.id}.v${i}`);
        const allKeys = [...stepKeys, ...verifyKeys];
        const done = allKeys.every(k => checked[k]);
        return (
          <Collapsible key={s.id} defaultOpen>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Badge variant={done ? 'default' : 'secondary'}>{s.id}</Badge>
                        {s.title}
                      </CardTitle>
                      <CardDescription>{s.goal}</CardDescription>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground mt-1" />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Steps</div>
                    <ul className="space-y-2">
                      {s.steps.map((step, i) => {
                        const k = `${s.id}.s${i}`;
                        return (
                          <li key={k} className="flex items-start gap-2 text-sm">
                            <Checkbox id={k} checked={!!checked[k]} onCheckedChange={() => toggle(k)} className="mt-0.5" />
                            <label htmlFor={k} className={checked[k] ? 'line-through text-muted-foreground' : ''}>{step}</label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Verify</div>
                    <ul className="space-y-2">
                      {s.verify.map((v, i) => {
                        const k = `${s.id}.v${i}`;
                        return (
                          <li key={k} className="flex items-start gap-2 text-sm">
                            <Checkbox id={k} checked={!!checked[k]} onCheckedChange={() => toggle(k)} className="mt-0.5" />
                            <label htmlFor={k} className={`flex-1 ${checked[k] ? 'line-through text-muted-foreground' : ''}`}>
                              <span>{v.label}</span>
                              <span className="block text-xs text-muted-foreground">→ {v.where}</span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );
}
