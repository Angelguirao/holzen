export type BreathCompletedSegment1Options = {
  briefRitual?: boolean;
  skipped?: boolean;
};

export type BreathCompletedSegment2Options = {
  skipped?: boolean;
};

/** Payload for `pauseLogStep` with `stepType: 'breath_completed'`, first segment. */
export function breathCompletedSegment1Payload(o: BreathCompletedSegment1Options = {}): Record<string, unknown> {
  const payload: Record<string, unknown> = { breath_segment: 1 };
  if (o.briefRitual) payload.brief_ritual = true;
  if (o.skipped) payload.skipped = true;
  return payload;
}

/** Payload for `pauseLogStep` with `stepType: 'breath_completed'`, second segment. */
export function breathCompletedSegment2Payload(o: BreathCompletedSegment2Options = {}): Record<string, unknown> {
  const payload: Record<string, unknown> = { breath_segment: 2 };
  if (o.skipped) payload.skipped = true;
  return payload;
}
