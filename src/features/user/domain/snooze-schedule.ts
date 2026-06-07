import { addHours, format, isTomorrow, isToday } from 'date-fns';

export type SnoozeDurationPreset = '2h' | '6h' | 'custom';

export const SNOOZE_PRESET_HOURS: Record<Exclude<SnoozeDurationPreset, 'custom'>, number> = {
  '2h': 2,
  '6h': 6,
};

const PRESET_TOLERANCE_MS = 20 * 60 * 1000;

/** Default custom snooze anchor when opening the calendar (tomorrow 08:00 local). */
export function defaultCustomSnoozeDate(from = new Date()): Date {
  const next = new Date(from);
  next.setDate(next.getDate() + 1);
  next.setHours(8, 0, 0, 0);
  return next;
}

export function addSnoozePresetHours(preset: Exclude<SnoozeDurationPreset, 'custom'>, from = new Date()): Date {
  return addHours(from, SNOOZE_PRESET_HOURS[preset]);
}

/** Infer which radio preset matches an active snooze end time. */
export function inferSnoozeDurationPreset(snoozedUntil: Date, from = new Date()): SnoozeDurationPreset {
  const remainingMs = snoozedUntil.getTime() - from.getTime();
  const twoTarget = SNOOZE_PRESET_HOURS['2h'] * 60 * 60 * 1000;
  const sixTarget = SNOOZE_PRESET_HOURS['6h'] * 60 * 60 * 1000;

  if (Math.abs(remainingMs - twoTarget) <= PRESET_TOLERANCE_MS) return '2h';
  if (Math.abs(remainingMs - sixTarget) <= PRESET_TOLERANCE_MS) return '6h';
  return 'custom';
}

/** Figma summary row — e.g. "Tomorrow, 08:00" or "Friday 19, 08:00". */
export function formatSnoozeUntilSummary(until: Date, from = new Date()): string {
  const time = format(until, 'HH:mm');
  if (isTomorrow(until)) return `Tomorrow, ${time}`;
  if (isToday(until)) return `Today, ${time}`;
  return `${format(until, 'EEEE d')}, ${time}`;
}

/** Clock suffix for the 2-hour preset row — "Until HH:mm". */
export function formatSnoozePresetUntilClock(
  preset: SnoozeDurationPreset,
  opts: { snoozedUntil: Date | null; isActive: boolean; from?: Date },
): string | null {
  if (preset !== '2h') return null;
  const from = opts.from ?? new Date();
  const end =
    opts.isActive && opts.snoozedUntil && opts.snoozedUntil > from
      ? opts.snoozedUntil
      : addSnoozePresetHours('2h', from);
  return format(end, 'HH:mm');
}

export function mergeSnoozeDateAndTime(date: Date, hour: number, minute: number): Date {
  const merged = new Date(date);
  merged.setHours(hour, minute, 0, 0);
  return merged;
}

export function isSnoozeUntilValid(until: Date, from = new Date()): boolean {
  return until.getTime() > from.getTime();
}
