/** Market direction / severity helpers shared by companion orchestrate (not intervention-specific). */

export function parseDirection(context?: string): "up" | "down" | "neutral" {
  if (!context) return "neutral";
  const lower = context.toLowerCase();
  if (lower.includes("is down")) return "down";
  if (lower.includes("is up")) return "up";
  return "neutral";
}

export function bucketSeverity(pct: number): "mild" | "moderate" | "high" {
  const abs = Math.abs(pct);
  if (abs >= 10) return "high";
  if (abs >= 5) return "moderate";
  return "mild";
}
