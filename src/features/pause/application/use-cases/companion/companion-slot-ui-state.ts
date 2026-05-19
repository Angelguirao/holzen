import type { RegenerateCompanionSlot } from '@/features/pause/domain/companion-orchestrate';

export interface CompanionSlotLoadingSetters {
  setSignalLoading: (value: boolean) => void;
  setNudgeLoading: (value: boolean) => void;
  setHistoryLoading: (value: boolean) => void;
  setZoomOutLoading: (value: boolean) => void;
}

export interface CompanionSlotErrorSetters {
  setSignalError: (value: boolean) => void;
  setNudgeError: (value: boolean) => void;
  setHistoryError: (value: boolean) => void;
  setZoomOutError: (value: boolean) => void;
}

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
