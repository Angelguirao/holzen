import { useCallback, useState } from 'react';

type WelcomeBackPauseActions = {
  handleNavigatePauseWithThis: () => void;
  handleStartOverEngagedPause: () => void;
  handleDismiss: () => void;
};

/** Home engaged pause — Figma 411:7503 welcome sheet before `/pause` navigation. */
export function useHomePauseWelcomeBackSheet(actions: WelcomeBackPauseActions) {
  const [open, setOpen] = useState(false);

  const openWelcomeBackSheet = useCallback(() => {
    setOpen(true);
  }, []);

  const onContinue = useCallback(() => {
    setOpen(false);
    actions.handleNavigatePauseWithThis();
  }, [actions]);

  const onStartOver = useCallback(() => {
    setOpen(false);
    actions.handleStartOverEngagedPause();
  }, [actions]);

  const onDiscard = useCallback(() => {
    setOpen(false);
    actions.handleDismiss();
  }, [actions]);

  return {
    welcomeBackOpen: open,
    setWelcomeBackOpen: setOpen,
    openWelcomeBackSheet,
    welcomeBackHandlers: {
      onContinue,
      onStartOver,
      onDiscard,
    },
  };
}
