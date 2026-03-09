import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { hapticFeedback } from '@/lib/haptics';
import { useCallback } from 'react';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  context: string | null;
  message: string;
  reflectionId: string | null;
  companions: any;
  companionPrefs: any;
  severity: 'mild' | 'moderate' | 'high';
  onDismiss: () => void;
}

export function ReflectionTriggerOverlay({
  open,
  context,
  message,
  reflectionId,
  companions,
  companionPrefs,
  severity,
  onDismiss,
}: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const prefersReduced = useReducedMotion();

  const handleEnter = useCallback(() => {
    hapticFeedback('medium');
    navigate('/pause', {
      state: {
        reflectionMessage: message,
        context,
        reflectionId,
        companions,
        companionPrefs,
        severity,
      },
    });
  }, [navigate, message, context, reflectionId, companions, companionPrefs, severity]);

  const handleDismiss = useCallback(() => {
    hapticFeedback('light');
    onDismiss();
  }, [onDismiss]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          style={{
            background: 'radial-gradient(ellipse at 50% 40%, hsl(var(--background)) 0%, hsl(var(--muted)) 60%, hsl(var(--background)) 100%)',
          }}
        >
          {/* Close */}
          <button
            onClick={handleDismiss}
            className="absolute top-6 right-6 p-2 text-muted-foreground/30 hover:text-foreground/60 transition-colors duration-500 z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Ambient breathing orb */}
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 300,
              height: 300,
              background: 'radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 70%)',
              filter: 'blur(80px)',
            }}
            animate={prefersReduced ? {} : {
              scale: [1, 1.15, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          <div className="relative z-10 max-w-sm w-full flex flex-col items-center gap-10 text-center">
            {/* Context */}
            {context && (
              <motion.p
                className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider"
                initial={prefersReduced ? {} : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                {context}
              </motion.p>
            )}

            {/* Prompt */}
            <motion.p
              className="text-lg font-mono text-foreground/80 leading-relaxed"
              initial={prefersReduced ? {} : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              {t('triggerOverlay.readyToPause')}
            </motion.p>

            {/* Enter button */}
            <motion.button
              onClick={handleEnter}
              className="px-8 py-4 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all duration-500"
              initial={prefersReduced ? {} : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="text-xs font-mono text-primary/70 tracking-[0.2em] uppercase">
                {t('triggerOverlay.enterPause')}
              </span>
            </motion.button>

            {/* Dismiss */}
            <motion.button
              onClick={handleDismiss}
              className="text-[10px] font-mono text-muted-foreground/25 hover:text-muted-foreground/50 transition-colors duration-500 tracking-[0.15em] uppercase"
              initial={prefersReduced ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 1 }}
            >
              {t('triggerOverlay.notNow')}
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
