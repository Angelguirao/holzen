import { useState } from 'react';
import { useIsAdmin } from '@/app/hooks/use-is-admin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Bell, ExternalLink, Slack, Mail, ListChecks, RotateCw } from 'lucide-react';
import { AdminSubNav } from '@/screens/admin/components/AdminSubNav';

type AlertRule = {
  id: string;
  name: string;
  why: string;
  filters: { label: string; value: string }[];
  trigger: string;
  channels: ('slack' | 'email')[];
  severity: 'critical' | 'high' | 'normal';
};

const RULES: AlertRule[] = [
  {
    id: 'edge-new-issue',
    name: 'New edge function error (first seen)',
    why: 'Catches previously unseen errors the moment they appear — the gap our current setup misses.',
    filters: [
      { label: 'Project', value: 'holzen edges (server)' },
      { label: 'Environment', value: 'production' },
      { label: 'Level', value: 'error, fatal' },
      { label: 'is:', value: 'unresolved is:new' },
    ],
    trigger: 'A new issue is created (issue.created) — fires once per fingerprint.',
    channels: ['slack', 'email'],
    severity: 'critical',
  },
  {
    id: 'edge-regression',
    name: 'Regression — resolved issue reappears',
    why: 'A bug we marked fixed is back. Signals a bad deploy or incomplete fix.',
    filters: [
      { label: 'Project', value: 'holzen edges (server)' },
      { label: 'Environment', value: 'production' },
      { label: 'is:', value: 'regressed' },
    ],
    trigger: 'An issue changes state from resolved → unresolved.',
    channels: ['slack', 'email'],
    severity: 'high',
  },
  {
    id: 'edge-spike',
    name: 'Error spike — known issue burning through quota',
    why: 'Existing issue suddenly explodes (e.g. webhook outage). Avoids alert fatigue from rule #1.',
    filters: [
      { label: 'Project', value: 'holzen edges (server)' },
      { label: 'Environment', value: 'production' },
      { label: 'Level', value: 'error, fatal' },
    ],
    trigger: 'event.frequency > 25 events in 5 minutes (per issue).',
    channels: ['slack'],
    severity: 'high',
  },
  {
    id: 'frontend-new-issue',
    name: 'New frontend error (first seen, prod)',
    why: 'Same as #1 but for the React app. Lower priority — Slack only.',
    filters: [
      { label: 'Project', value: 'holzen web (frontend)' },
      { label: 'Environment', value: 'production' },
      { label: 'is:', value: 'unresolved is:new' },
      { label: 'Level', value: 'error, fatal' },
    ],
    trigger: 'A new issue is created (issue.created).',
    channels: ['slack'],
    severity: 'normal',
  },
];

const sevColor: Record<AlertRule['severity'], 'destructive' | 'default' | 'secondary'> = {
  critical: 'destructive',
  high: 'default',
  normal: 'secondary',
};

export default function SentryAlerts() {
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
          <Bell className="h-4 w-4" />
          <span>Admin · Observability</span>
        </div>
        <h1 className="text-2xl font-semibold">Sentry → Slack & email alerting</h1>
        <p className="text-sm text-muted-foreground">
          Runbook for wiring Sentry issue alerts to Slack <code>#holzen-alerts</code> and the
          on-call email list, so newly captured edge-function errors page us immediately.
          Configuration lives in the Sentry dashboard — this page just documents the exact rules
          to create. Tick each step as you complete it.
        </p>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks className="h-4 w-4" /> One-time integration setup
          </CardTitle>
          <CardDescription>Do this once per Sentry org. Skip steps already done.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {[
            {
              k: 'setup.slack',
              icon: <Slack className="h-4 w-4" />,
              title: 'Install Sentry → Slack integration',
              body: (
                <>
                  Sentry → <em>Settings → Integrations → Slack → Add Workspace</em>. Authorize the
                  Holzen workspace, then map the Sentry project to <code>#holzen-alerts</code>.
                </>
              ),
            },
            {
              k: 'setup.email',
              icon: <Mail className="h-4 w-4" />,
              title: 'Confirm email routing',
              body: (
                <>
                  Sentry → <em>Settings → Notifications → Issue Alerts</em>. Verify the on-call
                  email list (or a shared inbox) is subscribed at the org level so rule actions
                  marked "send a notification to a member / team" actually deliver.
                </>
              ),
            },
            {
              k: 'setup.envtag',
              icon: <AlertTriangle className="h-4 w-4" />,
              title: 'Verify environment tags',
              body: (
                <>
                  Open a recent edge event in Sentry → confirm <code>environment: production</code>
                  is set (sourced from <code>SENTRY_ENVIRONMENT</code> in the edge runtime). If
                  events come through as <code>development</code>, fix the env var before adding
                  rules — otherwise prod filters silently match nothing.
                </>
              ),
            },
          ].map(s => (
            <div key={s.k} className="flex items-start gap-2">
              <Checkbox id={s.k} checked={!!checked[s.k]} onCheckedChange={() => toggle(s.k)} className="mt-0.5" />
              <label htmlFor={s.k} className={`flex-1 ${checked[s.k] ? 'line-through text-muted-foreground' : ''}`}>
                <div className="font-medium flex items-center gap-2">{s.icon} {s.title}</div>
                <div className="text-muted-foreground text-xs mt-0.5">{s.body}</div>
              </label>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Progress: {Object.values(checked).filter(Boolean).length} ticked
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          <RotateCw className="h-3.5 w-3.5" /> Reset
        </Button>
      </div>

      {RULES.map(rule => (
        <Card key={rule.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <Badge variant={sevColor[rule.severity]}>{rule.severity}</Badge>
                  {rule.name}
                </CardTitle>
                <CardDescription>{rule.why}</CardDescription>
              </div>
              <div className="flex gap-1">
                {rule.channels.includes('slack') && (
                  <Badge variant="outline" className="gap-1"><Slack className="h-3 w-3" /> Slack</Badge>
                )}
                {rule.channels.includes('email') && (
                  <Badge variant="outline" className="gap-1"><Mail className="h-3 w-3" /> Email</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Filters / scope</div>
              <ul className="space-y-1">
                {rule.filters.map((f, i) => (
                  <li key={i} className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{f.label}</span>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{f.value}</code>
                  </li>
                ))}
              </ul>
            </div>
            <Separator />
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Trigger</div>
              <div>{rule.trigger}</div>
            </div>
            <Separator />
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Actions</div>
              <ul className="text-muted-foreground space-y-1">
                {rule.channels.includes('slack') && (
                  <li>Send notification to Slack workspace · channel <code>#holzen-alerts</code></li>
                )}
                {rule.channels.includes('email') && (
                  <li>Send notification to on-call team / email list (org-level subscribers)</li>
                )}
              </ul>
            </div>
            <div className="flex items-start gap-2 pt-1">
              <Checkbox
                id={`done.${rule.id}`}
                checked={!!checked[`done.${rule.id}`]}
                onCheckedChange={() => toggle(`done.${rule.id}`)}
                className="mt-0.5"
              />
              <label
                htmlFor={`done.${rule.id}`}
                className={`text-sm ${checked[`done.${rule.id}`] ? 'line-through text-muted-foreground' : ''}`}
              >
                Rule created in Sentry and verified (used "Send Test Notification")
              </label>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ExternalLink className="h-4 w-4" /> Verification & noise control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="text-foreground font-medium">Smoke test: </span>
            From Sentry → Alerts → pick a rule → <em>Send Test Notification</em>. Confirm Slack
            and email both deliver. Then trigger a real error in a non-prod edge function
            (throw inside a temporary handler) and verify the rule fires end-to-end.
          </p>
          <p>
            <span className="text-foreground font-medium">Quota guard: </span>
            <code>beforeSend</code> in <code>_shared/sentry.ts</code> already filters expected
            <code> EdgeError</code> codes (auth_required, rate_limited, bad_input, not_found).
            New alerts will only fire on genuinely uncaptured errors.
          </p>
          <p>
            <span className="text-foreground font-medium">Mute strategy: </span>
            For known-noisy issues, mark them <em>Ignored until N events / time window</em> in
            Sentry rather than disabling the alert rule.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
