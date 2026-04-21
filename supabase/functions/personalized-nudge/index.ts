import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { holzenEdgeError, holzenEdgeLog, holzenEdgeRun } from "../_shared/holzen-edge-log.ts";
import { coingeckoHeaders } from "../_shared/coingecko.ts";
import { withRequestLogging } from "../_shared/with-request-logging.ts";
import {
  holzenResendLogger,
  sendResendBatch,
  type ResendEmail,
} from "../_shared/resend.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(
  withRequestLogging("personalized-nudge", async ({ req }) => {
  try {
    holzenEdgeRun("personalized-nudge", "request", { method: req.method });
    const { verifyServiceAuth } = await import("../_shared/auth.ts");
    if (!verifyServiceAuth(req)) {
      holzenEdgeRun("personalized-nudge", "auth rejected");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    holzenEdgeRun("personalized-nudge", "auth ok");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    // 1. Check current BTC volatility
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true",
      { headers: coingeckoHeaders() }
    );
    const data = await res.json();
    const change24h = Math.abs(data?.bitcoin?.usd_24h_change ?? 0);

    // Only nudge during high volatility (≥3% daily move)
    if (change24h < 3) {
      holzenEdgeLog("personalized-nudge", "run complete", { nudged: 0, reason: "low_volatility", change24h: Number(change24h.toFixed(1)) });
      return new Response(JSON.stringify({ nudged: 0, reason: "low_volatility" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Get users with email notifications enabled (with timezone)
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, email_notifications, quiet_hours_start, quiet_hours_end, timezone, language");

    if (profilesError) throw profilesError;

    // Helper: get user's local hour
    function getUserLocalHour(timezone: string): number {
      try {
        const formatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: timezone });
        return parseInt(formatter.format(new Date()), 10);
      } catch { return new Date().getUTCHours(); }
    }

    // Helper: check quiet hours
    function isInQuietHours(p: any): boolean {
      const start = p.quiet_hours_start;
      const end = p.quiet_hours_end;
      if (start == null || end == null) return false;
      const tz = p.timezone || "UTC";
      const localHour = getUserLocalHour(tz);
      if (start <= end) return localHour >= start && localHour < end;
      return localHour >= start || localHour < end;
    }

    const eligible = (profiles ?? []).filter((p) => p.email_notifications && !isInQuietHours(p));
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    // BTC direction is a global property of this cron run (not per-user) — we
    // compute it once so it can also feed the idempotency key below.
    const runDirection = (data?.bitcoin?.usd_24h_change ?? 0) >= 0 ? "up" : "down";
    // Each user gets bespoke localized copy; we accumulate rendered payloads
    // and ship them in one batched Resend call at the end.
    const queued: ResendEmail[] = [];

    for (const profile of eligible) {
      // Check if user has reflected in the last 48 hours
      const { data: recentReflections } = await supabase
        .from("reflections")
        .select("id")
        .eq("user_id", profile.user_id)
        .gte("created_at", cutoff)
        .limit(1);

      // If they have recent reflections, skip
      if (recentReflections && recentReflections.length > 0) continue;

      // Get user email
      const { data: userData } = await supabase.auth.admin.getUserById(profile.user_id);
      const email = userData?.user?.email;
      if (!email) continue;

      const direction = runDirection;
      const pct = change24h.toFixed(1);
      const userLang = (profile as any).language || "en";

      const NUDGE_COPY: Record<string, { subject: (d: string, p: string) => string; body: (d: string, p: string) => string; reminder: string; cta: string; footer: string }> = {
        en: {
          subject: (d, p) => `BTC is ${d} ${p}% — take a moment`,
          body: (d, p) => `BTC is ${d} ${p}% today.`,
          reminder: "You haven't reflected in a while. No pressure — just a gentle reminder that Holzen is here when you need a moment to pause.",
          cta: "Open Holzen",
          footer: "A gentle nudge from Holzen. Disable in settings.",
        },
        es: {
          subject: (d, p) => `BTC ${d === "up" ? "subió" : "bajó"} ${p}% — tómate un momento`,
          body: (d, p) => `BTC ${d === "up" ? "subió" : "bajó"} ${p}% hoy.`,
          reminder: "No has reflexionado en un tiempo. Sin presión — solo un recordatorio de que Holzen está aquí cuando necesites un momento de pausa.",
          cta: "Abrir Holzen",
          footer: "Un recordatorio amable de Holzen. Desactívalo en ajustes.",
        },
        pt: {
          subject: (d, p) => `BTC ${d === "up" ? "subiu" : "caiu"} ${p}% — faça uma pausa`,
          body: (d, p) => `BTC ${d === "up" ? "subiu" : "caiu"} ${p}% hoje.`,
          reminder: "Faz um tempo que você não refletiu. Sem pressão — só um lembrete de que o Holzen está aqui quando você precisar pausar.",
          cta: "Abrir Holzen",
          footer: "Um lembrete gentil do Holzen. Desative nas configurações.",
        },
        de: {
          subject: (d, p) => `BTC ist ${d === "up" ? "gestiegen" : "gefallen"} um ${p}% — nimm dir einen Moment`,
          body: (d, p) => `BTC ist heute um ${p}% ${d === "up" ? "gestiegen" : "gefallen"}.`,
          reminder: "Du hast eine Weile nicht reflektiert. Kein Druck — nur eine sanfte Erinnerung, dass Holzen da ist, wenn du eine Pause brauchst.",
          cta: "Holzen öffnen",
          footer: "Eine sanfte Erinnerung von Holzen. In den Einstellungen deaktivieren.",
        },
        fr: {
          subject: (d, p) => `BTC a ${d === "up" ? "monté" : "baissé"} de ${p}% — prends un moment`,
          body: (d, p) => `BTC a ${d === "up" ? "monté" : "baissé"} de ${p}% aujourd'hui.`,
          reminder: "Tu n'as pas réfléchi depuis un moment. Pas de pression — juste un rappel que Holzen est là quand tu as besoin d'une pause.",
          cta: "Ouvrir Holzen",
          footer: "Un rappel bienveillant de Holzen. Désactive dans les paramètres.",
        },
        nl: {
          subject: (d, p) => `BTC is ${d === "up" ? "gestegen" : "gedaald"} met ${p}% — neem even een moment`,
          body: (d, p) => `BTC is vandaag ${p}% ${d === "up" ? "gestegen" : "gedaald"}.`,
          reminder: "Je hebt al een tijdje niet gereflecteerd. Geen druk — gewoon een herinnering dat Holzen er is als je een moment van rust nodig hebt.",
          cta: "Holzen openen",
          footer: "Een zachte herinnering van Holzen. Uitschakelen in instellingen.",
        },
        tr: {
          subject: (d, p) => `BTC %${p} ${d === "up" ? "yükseldi" : "düştü"} — bir an dur`,
          body: (d, p) => `BTC bugün %${p} ${d === "up" ? "yükseldi" : "düştü"}.`,
          reminder: "Bir süredir düşünmedin. Baskı yok — sadece bir duraklamaya ihtiyaç duyduğunda Holzen'in burada olduğunu hatırlatmak istedik.",
          cta: "Holzen'i Aç",
          footer: "Holzen'den nazik bir hatırlatma. Ayarlardan devre dışı bırakabilirsin.",
        },
      };

      const copy = NUDGE_COPY[userLang] || NUDGE_COPY.en;

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'IBM Plex Mono', monospace, sans-serif; max-width: 440px; margin: 0 auto; padding: 40px 20px; color: #2a2a2a; background: #f7f5f0;">
  <p style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #737373; margin-bottom: 32px;">HOLZEN</p>

  <p style="font-size: 14px; line-height: 1.8; margin-bottom: 24px;">
    ${copy.body(direction, pct)}
  </p>

  <p style="font-size: 13px; color: #737373; line-height: 1.6; margin-bottom: 24px;">
    ${copy.reminder}
  </p>

  <a href="https://holzen.lovable.app" style="display: inline-block; font-size: 12px; font-family: 'IBM Plex Mono', monospace; color: #2a2a2a; border: 1px solid #d4d0c8; padding: 8px 16px; text-decoration: none; border-radius: 4px;">
    ${copy.cta}
  </a>

  <hr style="border: none; border-top: 1px solid #e5e2dc; margin: 32px 0 16px;">
  <p style="font-size: 11px; color: #a3a3a3;">${copy.footer}</p>
</body>
</html>`;

      queued.push({
        from: "Holzen <notify@holzen.app>",
        to: [email],
        subject: copy.subject(direction, pct),
        html,
      });
    }

    // Idempotency key per day+direction — if Supabase retries the cron within
    // 24h, Resend dedupes the batch and users never get duplicate nudges.
    const dateKey = new Date().toISOString().slice(0, 10);
    const batch = await sendResendBatch(queued, {
      apiKey: RESEND_API_KEY,
      source: "personalized-nudge",
      idempotencyKey: `personalized-nudge:${dateKey}:${runDirection}`,
      logger: holzenResendLogger(
        (m, d) => holzenEdgeLog("personalized-nudge", m, d),
        (m, err) => holzenEdgeError("personalized-nudge", m, err),
      ),
    });

    holzenEdgeLog("personalized-nudge", "run complete", {
      nudged: batch.sent,
      failed: batch.failed,
      chunks: batch.chunks,
      eligible: eligible.length,
      queued: queued.length,
      change24h: Number(change24h.toFixed(1)),
    });
    return new Response(
      JSON.stringify({ nudged: batch.sent, failed: batch.failed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    holzenEdgeError("personalized-nudge", "uncaught error", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  })
);
