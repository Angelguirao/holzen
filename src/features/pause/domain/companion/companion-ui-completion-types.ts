export type CompanionUiCompletionStep =
  | 'breathing'
  | 'haiku'
  | 'grounding'
  | 'signal'
  | 'zoomOut'
  | 'history';

export interface CompanionUiCompletionState {
  breathing: boolean;
  haiku: boolean;
  grounding: boolean;
  signal: boolean;
  zoomOut: boolean;
  history: boolean;
}

/** Default / placeholder before the first `loadCompanionUiCompletionState` result. */
export const EMPTY_COMPANION_UI_COMPLETION: CompanionUiCompletionState = {
  breathing: false,
  haiku: false,
  grounding: false,
  signal: false,
  zoomOut: false,
  history: false,
};
