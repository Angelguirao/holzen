export interface EchoUserWord {
  kind: 'note' | 'replay';
  body: string;
  created_at: string;
}

/**
 * Strict Echo payload (Pause V2): surfaces ONLY user-authored text
 * (`pause_step_events` notes + `practice_entries` replay lines). The AI-generated
 * reflect-step prompt is available via `aiPrompt` but is never rendered as the
 * main quote. See `supabase/functions/_shared/past-reflection-util.ts`.
 */
export interface ZoomOutEchoData {
  id?: string;
  created_at: string;
  mood: string | null;
  outcome: string | null;
  context?: string | null;
  /** Original AI-generated reflect-step prompt that started this pause. */
  aiPrompt?: string | null;
  /** Chronological (oldest first). Populated on modern payloads. */
  userWords?: EchoUserWord[];
}

export interface ZoomOutOnThisDayEntry {
  yearsAgo: number;
  price: number;
  date: string;
}

export interface ZoomOutData {
  onThisDay: ZoomOutOnThisDayEntry[];
  currentPrice: number | null;
  echo: ZoomOutEchoData | null;
  deepTime: {
    title: string;
    body: string;
  } | null;
  partial?: boolean;
}
