/**
 * CI cluster anchor for ritual decide outcome Sonner toasts (§3 / check:architecture-alignment).
 * Toast helpers live in `outcome-toast`; re-export for presentation I/O and `public-rpc`.
 */
export {
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from './outcome-toast';
