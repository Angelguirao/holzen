import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { hapticFeedback } from '@/lib/haptics';
import { useTranslation } from 'react-i18next';

const TOTAL_SECONDS = 60;

interface TheVoidProps {
  open: boolean;
  onClose: () => void;
}

export function TheVoid({ open, onClose }: TheVoidProps) {
  const { t } = useTranslation();
  const [seconds, setSeconds] = useState(TOTAL_SECONDS);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (open) {
      setSeconds(TOTAL_SECONDS);
      setStarted(false);
      setCompleted(false);
    }
  }, [open]);

  useEffect(() => {
    if (!started || completed) return;
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setCompleted(true);
          hapticFeedback('success');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [started, completed]);

  const handleStart = useCallback(() => {
    setStarted(true);
    hapticFeedback('light');
  }, []);

  const handleClose = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    onClose();
  }, [onClose]);

  const progress = (TOTAL_SECONDS - seconds) / TOTAL_SECONDS;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeDisplay = `${minutes}:${secs.toString().padStart(2, '0')}`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          style={{
            background: 'radial-gradient(ellipse at center, hsl(30, 60%, 12%) 0%, hsl(25, 50%, 6%) 70%, hsl(20, 40%, 3%) 100%)',
          }}
        >
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 p-2 text-foreground/20 hover:text-foreground/50 transition-colors duration-500"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col items-center gap-12">
            <motion.div
              className="absolute rounded-full"
              style={{
                width: '300px',
                height: '300px',
                background: 'radial-gradient(circle, hsla(35, 70%, 50%, 0.08) 0%, transparent 70%)',
                filter: 'blur(60px)',
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.4, 0.6, 0.4],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {!started && !completed ? (
              <motion.button
                onClick={handleStart}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="relative z-10 text-foreground/40 hover:text-foreground/60 transition-colors duration-700 font-mono text-xs tracking-[0.3em] uppercase"
              >
                {t('void.begin')}
              </motion.button>
            ) : completed ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5 }}
                className="relative z-10 flex flex-col items-center gap-8"
              >
                <p className="text-foreground/30 font-mono text-xs tracking-[0.3em] uppercase">
                  {t('void.youStayed')}
                </p>
                <motion.button
                  onClick={handleClose}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2, duration: 1 }}
                  className="text-foreground/20 hover:text-foreground/40 transition-colors duration-700 font-mono text-[10px] tracking-[0.2em] uppercase"
                >
                  {t('void.return')}
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                className="relative z-10 flex flex-col items-center gap-8"
              >
                <p
                  className="font-mono text-2xl tracking-[0.2em] tabular-nums"
                  style={{ color: `hsla(35, 60%, 70%, ${0.15 + progress * 0.25})` }}
                >
                  {timeDisplay}
                </p>

                <svg width="120" height="120" className="absolute -z-10 opacity-20">
                  <circle cx="60" cy="60" r="56" fill="none" stroke="hsla(35, 50%, 40%, 0.1)" strokeWidth="1" />
                  <circle
                    cx="60" cy="60" r="56" fill="none" stroke="hsla(35, 60%, 55%, 0.3)" strokeWidth="1"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress)}`}
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
