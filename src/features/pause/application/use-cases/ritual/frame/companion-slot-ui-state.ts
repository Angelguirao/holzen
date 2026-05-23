import type { TransitionStartFunction } from 'react';
import type { RegenerateCompanionSlot } from '@/features/pause/domain/companion-orchestrate';

/** @deprecated Prefer `startCompanionSlotTransition` + `useTransition` pending flags. */
export interface CompanionSlotLoadingSetters {
  setSignalLoading: (value: boolean) => void;
  setNudgeLoading: (value: boolean) => void;
  setHistoryLoading: (value: boolean) => void;
  setZoomOutLoading: (value: boolean) => void;
}

export interface CompanionSlotTransitionStarters {
  signal: TransitionStartFunction;
  grounding: TransitionStartFunction;
  history: TransitionStartFunction;
  zoomOut: TransitionStartFunction;
}

export interface CompanionSlotErrorSetters {
  setSignalError: (value: boolean) => void;
  setNudgeError: (value: boolean) => void;
  setHistoryError: (value: boolean) => void;
  setZoomOutError: (value: boolean) => void;
}

/** @deprecated Prefer `startCompanionSlotTransition` + `useTransition` pending flags. */
export function setCompanionSlotLoading(
  slot: RegenerateCompanionSlot,
  setters: CompanionSlotLoadingSetters,
  value: boolean,
): void {
  switch (slot) {
    case 'signal':
      setters.setSignalLoading(value);
      break;
    case 'grounding':
      setters.setNudgeLoading(value);
      break;
    case 'history':
      setters.setHistoryLoading(value);
      break;
    case 'zoomOut':
      setters.setZoomOutLoading(value);
      break;
  }
}

export function startCompanionSlotTransition(
  slot: RegenerateCompanionSlot,
  starters: CompanionSlotTransitionStarters,
  callback: Parameters<TransitionStartFunction>[0],
): void {
  switch (slot) {
    case 'signal':
      starters.signal(callback);
      break;
    case 'grounding':
      starters.grounding(callback);
      break;
    case 'history':
      starters.history(callback);
      break;
    case 'zoomOut':
      starters.zoomOut(callback);
      break;
  }
}

export function setCompanionSlotError(
  slot: RegenerateCompanionSlot,
  setters: CompanionSlotErrorSetters,
  value: boolean,
): void {
  switch (slot) {
    case 'signal':
      setters.setSignalError(value);
      break;
    case 'grounding':
      setters.setNudgeError(value);
      break;
    case 'history':
      setters.setHistoryError(value);
      break;
    case 'zoomOut':
      setters.setZoomOutError(value);
      break;
  }
}
