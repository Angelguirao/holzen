import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldAlert, Search, FileWarning, HeartPulse } from "lucide-react";

// Static manifest of edge-function error-reporting coverage.
// Generated from `supabase/functions/*/index.ts` source by scanning for:
//   - withRequestLogging  → request/response + Sentry capture in catch
//   - EdgeError           → standardized errors that beforeSend() can filter
//   - createLogger        → structured BetterStack logs (.error path forwards to Sentry)
//   - logAudit            → security-sensitive ops written to audit_log
//
// Regenerate with: scripts/scan-edge-coverage.sh (see SentryAlerts runbook)
type Row = { name: string; wrl: boolean; edgeError: boolean; logger: boolean; audit: boolean };

const COVERAGE: Row[] = [
  { name: "admin-library-preview", wrl: true, edgeError: false, logger: true, audit: false },
  { name: "ai-cost-alert", wrl: true, edgeError: false, logger: false, audit: false },
  { name: "auth-email-hook", wrl: true, edgeError: false, logger: false, audit: false },
  { name: "backfill-btc-prices", wrl: true, edgeError: false, logger: false, audit: false },
  { name: "badge-notify", wrl: true, edgeError: false, logger: false, audit: false },
  { name: "check-subscription", wrl: true, edgeError: false, logger: false, audit: false },
  { name: "check-volatility", wrl: true, edgeError: false, logger: false, audit: false },
  { name: "companion-orchestrate", wrl: true, edgeError: false, logger: true, audit: false },
  { name: "create-checkout", wrl: true, edgeError: false, logger: false, audit: false },
  { name: "customer-portal", wrl: true, edgeError: false, logger: false, audit: false },
  { name: "delete-account", wrl: true, edgeError: true, logger: false, audit: true },
  { name: "deliver-letters", wrl: true, edgeError: false, logger: false, audit: false },
  { name: "fetch-source-feeds", wrl: true, edgeError: false, logger: true, audit: false },
  { name: "generate-wallpaper", wrl: true, edgeError: false, logger: true, audit: false },
  { name: "grounding-enrich", wrl: true, edgeError: false, logger: true, audit: false },
  { name: "handle-email-suppression", wrl: true, edgeError: false, logger: false, audit: false },
  { name: "handle-email-unsubscribe", wrl: true, edgeError: false, logger: false, audit: false },
  { name: "health", wrl: true, edgeError: false, logger: false, audit: false },
  { name: "holzen-number", wrl: true, edgeError: false, logger: false, audit: false },
  { name: "holzen-reflect", wrl: true, edgeError: false, logger: true, audit: false },
  { name: "journal-prompt", wrl: true, edgeError: true, logger: true, audit: false },
  { name: "list-checkout-events", wrl: true, edgeError: false, logger: false, audit: false },
  { name: "monthly-report", wrl: true, edgeError: false, logger: true, audit: false },
  { name: "night-reflection", wrl: true, edgeError: false, logger: true, audit: false },
  { name: "notify-checkout-confirmation", wrl: false, edgeError: false, logger: false, audit: false },
  { name: "personalized-nudge", wrl: true, edgeError: false, logger: false, audit: false },
  { name: "pregenerate-companions", wrl: true, edgeError: false, logger: true, audit: false },
  { name: "preview-transactional-email", wrl: true, edgeError: false, logger: false, audit: false },
  { name: "process-email-queue", wrl: true, edgeError: false, logger: false, audit: false },
  { name: "process-referral-pending", wrl: true, edgeError: false, logger: false, audit: false },
  { name: "record-referral", wrl: true, edgeError: false, logger: false, audit: false },
  { name: "reflection-insights", wrl: true, edgeError: false, logger: false, audit: false },
  { name: "refresh-btc-prices", wrl: true, edgeError: false, logger: false, audit: false },
  { name: "register-push", wrl: true, edgeError: false, logger: false, audit: false },
  { name: "retry-flex-credit", wrl: true, edgeError: false, logger: false, audit: false },
  { name: "seed-btc-history", wrl: true, edgeError: false, logger: false, audit: false },
  { name: "send-feedback", wrl: true, edgeError: true, logger: false, audit: false },
  { name: "send-transactional-email", wrl: true, edgeError: false, logger: false, audit: false },
  { name: "stripe-webhook", wrl: true, edgeError: false, logger: false, audit: false },
  { name: "suggest-grounding", wrl: true, edgeError: false, logger: true, audit: false },
  { name: "suggest-ritual", wrl: true, edgeError: false, logger: true, audit: false },
  { name: "weekly-digest", wrl: true, edgeError: false, logger: true, audit: false },
];

// Functions exempt from full wrapper coverage. `health` is the obvious one (verify_jwt=false probe).
const EXEMPT = new Set<string>(["health"]);

function useIsAdmin() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.from("profiles").select("is_admin").eq("user_id", user.id).single()
      .then(({ data }) => {
        const p = data as { is_admin?: boolean } | null;
        if (typeof p?.is_admin === "boolean") setIsAdmin(p.is_admin);
        else {
          const ids = import.meta.env.VITE_ADMIN_USER_IDS as string | undefined;
          setIsAdmin(!!ids && ids.split(",").map((s) => s.trim()).includes(user.id));
        }
      });
  }, [user]);
  return { isAdmin: !!isAdmin, loading: loading || isAdmin === null };
}

type Severity = "missing" | "partial" | "ok";
function severityOf(r: Row): Severity {
  if (EXEMPT.has(r.name)) return "ok";
  if (!r.wrl) return "missing"; // no Sentry capture path at all → blocks alerting
  if (!r.logger && !r.edgeError) return "partial"; // wrapped, but minimal observability
  return "ok";
}

const sevMeta: Record<Severity, { label: string; variant: "destructive" | "default" | "secondary" }> = {
  missing: { label: "missing", variant: "destructive" },
  partial: { label: "partial", variant: "default" },
  ok: { label: "ok", variant: "secondary" },
};

export default function EdgeCoverage() {
  const { isAdmin, loading } = useIsAdmin();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | Severity>("all");
  const [heartbeats, setHeartbeats] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    supabase
      .from("app_config")
      .select("key,value")
      .like("key", "heartbeat.%")
      .then(({ data, error }) => {
        if (cancelled || error || !data) {
          if (!cancelled) setHeartbeats({});
          return;
        }
        const map: Record<string, string> = {};
        for (const row of data as Array<{ key: string; value: unknown }>) {
          const job = row.key.replace(/^heartbeat\./, "");
          // value is jsonb — usually a JSON string holding the UUID.
          const uuid = typeof row.value === "string" ? row.value : String(row.value ?? "");
          if (job && uuid) map[job] = uuid;
        }
        setHeartbeats(map);
      });
    return () => { cancelled = true; };
  }, [isAdmin]);

  const heartbeatCount = useMemo(
    () => (heartbeats ? Object.keys(heartbeats).length : 0),
    [heartbeats],
  );

  const rows = useMemo(() => {
    return COVERAGE.map((r) => ({ ...r, sev: severityOf(r) }))
      .filter((r) => (filter === "all" ? true : r.sev === filter))
      .filter((r) => (q ? r.name.toLowerCase().includes(q.toLowerCase()) : true))
      .sort((a, b) => {
        const order: Record<Severity, number> = { missing: 0, partial: 1, ok: 2 };
        return order[a.sev] - order[b.sev] || a.name.localeCompare(b.name);
      });
  }, [q, filter]);

  const counts = useMemo(() => {
    const c = { total: COVERAGE.length, missing: 0, partial: 0, ok: 0 };
    for (const r of COVERAGE) c[severityOf(r)]++;
    return c;
  }, []);

  if (loading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <div className="p-8">Admin only.</div>;

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <ShieldCheck className="h-4 w-4" />
          <span>Admin · Observability</span>
        </div>
        <h1 className="text-2xl font-semibold">Edge function error-reporting coverage</h1>
        <p className="text-sm text-muted-foreground">
          Static scan of <code>supabase/functions/*/index.ts</code> for the wrappers that route
          uncaught errors into Sentry and BetterStack. Regressions show up here before they show
          up as silent prod errors.
        </p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="text-2xl font-semibold">{counts.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">OK</div>
            <div className="text-2xl font-semibold">{counts.ok}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Partial</div>
            <div className="text-2xl font-semibold">{counts.partial}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Missing</div>
            <div className={`text-2xl font-semibold ${counts.missing > 0 ? "text-destructive" : ""}`}>
              {counts.missing}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileWarning className="h-4 w-4" /> What each column means
          </CardTitle>
          <CardDescription>
            <span className="font-medium text-foreground">withRequestLogging</span> is the only
            required wrapper — it catches uncaught throws and forwards them to Sentry.
            <span className="font-medium text-foreground"> EdgeError</span> +
            <span className="font-medium text-foreground"> createLogger</span> raise the bar from
            "error reaches Sentry" to "error has actionable context".
            <span className="block mt-2">
              <span className="font-medium text-foreground">Heartbeat</span> reads
              {" "}<code>app_config.heartbeat.&lt;function&gt;</code> — when set, the matching
              {" "}<code>pg_cron</code> job pings BetterStack via{" "}
              <code>emit_job_heartbeat()</code>. Missing rows mean the function isn't
              monitored for liveness (only for errors).
              {heartbeats !== null && (
                <span className="ml-1">
                  Found <span className="font-medium text-foreground">{heartbeatCount}</span>
                  {" "}configured heartbeat key{heartbeatCount === 1 ? "" : "s"}.
                </span>
              )}
            </span>
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by function name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "missing", "partial", "ok"] as const).map((k) => (
            <Button
              key={k}
              size="sm"
              variant={filter === k ? "default" : "outline"}
              onClick={() => setFilter(k)}
            >
              {k}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2">Function</th>
                <th className="text-left px-2 py-2">Status</th>
                <th className="text-left px-2 py-2">withRequestLogging</th>
                <th className="text-left px-2 py-2">EdgeError</th>
                <th className="text-left px-2 py-2">createLogger</th>
                <th className="text-left px-2 py-2">logAudit</th>
                <th className="text-left px-2 py-2">Heartbeat</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const meta = sevMeta[r.sev];
                const hbUuid = heartbeats?.[r.name];
                return (
                  <tr key={r.name} className="border-t">
                    <td className="px-4 py-2 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        {r.sev === "missing" ? (
                          <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
                        ) : (
                          <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        {r.name}
                        {EXEMPT.has(r.name) && (
                          <Badge variant="outline" className="text-[10px]">exempt</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2"><Badge variant={meta.variant}>{meta.label}</Badge></td>
                    <td className="px-2 py-2">{r.wrl ? "✓" : <span className="text-destructive font-semibold">✗</span>}</td>
                    <td className="px-2 py-2 text-muted-foreground">{r.edgeError ? "✓" : "—"}</td>
                    <td className="px-2 py-2 text-muted-foreground">{r.logger ? "✓" : "—"}</td>
                    <td className="px-2 py-2 text-muted-foreground">{r.audit ? "✓" : "—"}</td>
                    <td className="px-2 py-2">
                      {heartbeats === null ? (
                        <span className="text-muted-foreground text-xs">…</span>
                      ) : hbUuid ? (
                        <span
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                          title={`heartbeat.${r.name} = ${hbUuid}`}
                        >
                          <HeartPulse className="h-3.5 w-3.5 text-foreground" />
                          <span className="font-mono">{hbUuid.slice(0, 8)}…</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">No functions match.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Regenerating this report</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            The <code>COVERAGE</code> array is a snapshot. After adding or refactoring an edge
            function, rerun the scanner and paste the JSON into this file:
          </p>
          <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">{`cd supabase/functions && python3 -c '
import os, re, json
out=[]
for n in sorted(os.listdir(".")):
  p=os.path.join(n,"index.ts")
  if n=="_shared" or not os.path.isfile(p): continue
  s=open(p,encoding="utf-8",errors="replace").read()
  out.append({"name":n,
    "wrl": bool(re.search(r"\\bwithRequestLogging\\b",s)),
    "edgeError": bool(re.search(r"\\bEdgeError\\b",s)),
    "logger": bool(re.search(r"\\bcreateLogger\\b",s)),
    "audit": bool(re.search(r"\\blogAudit\\b",s))})
print(json.dumps(out,indent=2))'`}</pre>
        </CardContent>
      </Card>
    </div>
  );
}
