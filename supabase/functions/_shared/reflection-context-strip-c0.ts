/**
 * Template “context strip” for Reflect (phase 1 — no Perplexity).
 * Fingerprints: market direction + severity band.
 */

export function buildReflectionContextStripC0(context: string, severity: number): string {
  const direction = marketDirectionFromContext(context);
  const band = severityBand(severity);

  if (direction === "down") {
    if (band === "extreme") {
      return "When moves this sharp happen, people often point to forced selling, liquidations, or headlines that arrived all at once — not only one clean cause.";
    }
    if (band === "major") {
      return "When the market sells off like this, people often mention macro news, risk-off flows, or traders cutting leverage — alongside their own stress.";
    }
    return "On days like this, some traders watch funding rates and exchange flows; others notice mostly how the move feels in their body.";
  }

  if (direction === "up") {
    if (band === "extreme") {
      return "When rallies run this hot, people often talk about short squeezes, momentum chasers, and headlines that reinforce the story — excitement and fear of missing out together.";
    }
    if (band === "major") {
      return "On strong up days, people often mention ETF flows, short covering, or a narrative catching fire — not only the chart.";
    }
    return "When price drifts higher, some watch liquidity and positioning; others notice whether optimism is starting to feel automatic.";
  }

  return "Even on quieter days, markets move for many reasons at once — flows, news, and mood — while your reaction is still yours to notice.";
}

function marketDirectionFromContext(context: string): "down" | "up" | "flat" {
  const lower = context.toLowerCase();
  if (lower.includes("is down")) return "down";
  if (lower.includes("is up")) return "up";
  return "flat";
}

function severityBand(severity: number): "mild" | "major" | "extreme" {
  if (severity >= 15) return "extreme";
  if (severity >= 7) return "major";
  return "mild";
}
