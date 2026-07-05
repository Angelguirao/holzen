import { motion } from 'framer-motion';

/** Quarantined until mantra breathing ships — was shown on first-segment breath intro. */
export function PauseBreathIntroMantraLine({ mantra }: { mantra: string }) {
  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6, duration: 1 }}
      className="max-w-sm text-sm italic leading-relaxed text-muted-foreground"
    >
      {`"${mantra}"`}
    </motion.p>
  );
}
