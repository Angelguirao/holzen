import { AnimatePresence, motion } from 'framer-motion';

export type PauseSessionScaffoldCurtainProps = {
  curtainLifted: boolean;
};

/** Initial full-screen curtain before the pause session fades in. */
export function PauseSessionScaffoldCurtain({ curtainLifted }: PauseSessionScaffoldCurtainProps) {
  return (
    <AnimatePresence>
      {!curtainLifted ? (
        <motion.div
          className="fixed inset-0 z-[100] bg-background"
          exit={{ opacity: 0 }}
          transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
        />
      ) : null}
    </AnimatePresence>
  );
}
