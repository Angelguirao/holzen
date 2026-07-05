/** Wire types for featured intervention headline (legacy product surface). */

export type RegenerateCompanionSlot = 'signal' | 'grounding' | 'history' | 'zoomOut';

export interface InterventionPrimary {
  type: 'mirror' | 'pattern' | 'trap';
  data: unknown;
}

export interface InterventionSecondary {
  type: 'zoom_out';
  data: unknown;
}

export interface InterventionState {
  mode: 'insight' | 'question';
  primary: InterventionPrimary | null;
  secondary: InterventionSecondary | null;
  question: string | null;
}
