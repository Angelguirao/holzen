/** Outlet context from `AppLayout` consumed by Home for pause-ready refresh. */
export type HomeAppLayoutOutletContext = {
  pauseReady?: boolean;
  dismissPauseReady?: () => void;
};
