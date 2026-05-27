import { buildReflectionContextStripC0 } from "./reflection-context-strip-c0.ts";
import {
  composeReflectFallbackOneVoice,
  reflectCopyAlreadyAsksQuestion,
  reflectHypothesisFallbackTemplate,
  reflectInquiryFallbackTemplate,
} from "./reflect-fallback-templates.ts";

export type ReflectionV2Payload = {
  schemaVersion: 2;
  land: string;
  hypothesis: string;
  inquiry: string;
  contextStrip: string;
  message: string;
  haiku?: string | null;
};

/** @deprecated Use reflectInquiryFallbackTemplate from reflect-fallback-templates.ts */
export function inquiryFallbackForMood(mood: string | undefined, context: string): string {
  return reflectInquiryFallbackTemplate(mood ?? "", context);
}

export type ReflectionFallbackSeed = {
  message?: string;
  land?: string;
  hypothesis?: string;
  inquiry?: string;
  /** Pre-composed display copy when seed authors provide it */
  integratedMessage?: string;
  haiku?: string | null;
};

export function mapReflectionFallbackToV2(
  fallback: ReflectionFallbackSeed,
  opts: { context: string; severity: number; mood?: string },
): ReflectionV2Payload {
  const mood = opts.mood ?? "";
  const contextStrip = buildReflectionContextStripC0(opts.context, opts.severity);

  const hasStructuredSeed = Boolean(
    fallback.land?.trim() || fallback.integratedMessage?.trim() ||
      (fallback.inquiry?.trim() && fallback.hypothesis?.trim()),
  );

  if (hasStructuredSeed) {
    const land = (fallback.land ?? fallback.message ?? "").trim();
    const hypothesis = (fallback.hypothesis ?? reflectHypothesisFallbackTemplate(mood, opts.context)).trim();
    let inquiry = (fallback.inquiry ?? "").trim();
    if (!inquiry && !reflectCopyAlreadyAsksQuestion(`${land} ${hypothesis}`)) {
      inquiry = reflectInquiryFallbackTemplate(mood, opts.context);
    }
    const message = (fallback.integratedMessage ?? "").trim() ||
      composeReflectFallbackOneVoice(land, hypothesis, inquiry);
    return {
      schemaVersion: 2,
      land,
      hypothesis,
      inquiry,
      contextStrip,
      message,
      haiku: fallback.haiku ?? null,
    };
  }

  const land = (fallback.message ?? "").trim();
  const hypothesis = reflectHypothesisFallbackTemplate(mood, opts.context);
  let inquiry = reflectInquiryFallbackTemplate(mood, opts.context);
  if (reflectCopyAlreadyAsksQuestion(land)) {
    inquiry = "";
  }
  const message = composeReflectFallbackOneVoice(land, hypothesis, inquiry);

  return {
    schemaVersion: 2,
    land,
    hypothesis,
    inquiry,
    contextStrip,
    message,
    haiku: fallback.haiku ?? null,
  };
}
