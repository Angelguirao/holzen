import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Wind, Heart, BookOpen, Scan, RotateCcw, Lock } from 'lucide-react';
import { hapticFeedback } from '@/lib/haptics';
import { fetchBtcData, type BtcPriceData } from '@/lib/btc';
import { useSubscription } from '@/hooks/use-subscription';
import { EmotionalCheckIn } from '@/components/practice/EmotionalCheckIn';
import { GuidedJournal } from '@/components/practice/GuidedJournal';
import { BodyScan } from '@/components/practice/BodyScan';
import { ReflectionReplay } from '@/components/practice/ReflectionReplay';

type VolatilityLevel = 'calm' | 'moderate' | 'intense';
type PracticeMode = 'menu' | 'breathe' | 'void' | 'checkin' | 'journal' | 'bodyscan' | 'replay';

function getVolatilityLevel(changePercent: number): VolatilityLevel {
  const abs = Math.abs(changePercent);
  if (abs < 2) return 'calm';
  if (abs < 5) return 'moderate';
  return 'intense';
}

const gradients: Record<VolatilityLevel, { from: string; via: string; to: string }> = {
  calm: { from: 'hsla(180, 30%, 15%, 1)', via: 'hsla(200, 25%, 10%, 1)', to: 'hsla(220, 20%, 8%, 1)' },
  moderate: { from: 'hsla(35, 40%, 12%, 1)', via: 'hsla(25, 35%, 10%, 1)', to: 'hsla(15, 30%, 8%, 1)' },
  intense: { from: 'hsla(350, 40%, 14%, 1)', via: 'hsla(340, 35%, 10%, 1)', to: 'hsla(330, 30%, 8%, 1)' },
};

const glowColors: Record<VolatilityLevel, string> = {
  calm: 'hsla(180, 50%, 50%, 0.15)', moderate: 'hsla(35, 60%, 55%, 0.15)', intense: 'hsla(350, 55%, 50%, 0.15)',
};
const ringColors: Record<VolatilityLevel, string> = {
  calm: 'hsla(180, 40%, 60%, 0.3)', moderate: 'hsla(35, 50%, 60%, 0.3)', intense: 'hsla(350, 45%, 55%, 0.3)',
};
const textColors: Record<VolatilityLevel, string> = {
  calm: 'hsla(180, 30%, 70%, 0.6)', moderate: 'hsla(35, 40%, 70%, 0.6)', intense: 'hsla(350, 35%, 70%, 0.6)',
};

const BREATH_DURATION = 8;
const VOID_SECONDS = 60;

const PRACTICE_ITEMS = [
  { id: 'breathe' as const, icon: Wind, labelKey: 'practice.breatheLabel', free: true },
  { id: 'checkin' as const, icon: Heart, labelKey: 'practice.checkinLabel', free: false },
  { id: 'journal' as const, icon: BookOpen, labelKey: 'practice.journalLabel', free: false },
  { id: 'bodyscan' as const, icon: Scan, labelKey: 'practice.bodyscanLabel', free: false },
  { id: 'replay' as const, icon: RotateCcw, labelKey: 'practice.replayLabel', free: false },
] as const;

export default function Breathe() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { subscribed } = useSubscription();

  const [mode, setMode] = useState<PracticeMode>('menu');
  const [btcData, setBtcData] = useState<BtcPriceData | null>(null);
  const [level, setLevel] = useState<VolatilityLevel>('calm');
  const [curtainLifted, setCurtainLifted] = useState(false);

  // Void state
  const [voidSeconds, setVoidSeconds] = useState(VOID_SECONDS);
  const [voidStarted, setVoidStarted] = useState(false);
  const [voidCompleted, setVoidCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setCurtainLifted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchBtcData();
      setBtcData(data);
      setLevel(getVolatilityLevel(data.changePercent));
    } catch { /* silently continue */ }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60_000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    document.body.classList.add('ambient-active');
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.classList.remove('ambient-active');
      document.body.style.overflow = '';
    };
  }, []);

  // Void timer
  useEffect(() => {
    if (mode !== 'void' || !voidStarted || voidCompleted) return;
    intervalRef.current = setInterval(() => {
      setVoidSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setVoidCompleted(true);
          hapticFeedback('success');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [mode, voidStarted, voidCompleted]);

  const handleClose = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (window.history.length > 1) navigate(-1);
    else navigate('/', { replace: true });
  }, [navigate]);

  const goToMenu = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setMode('menu');
  }, []);

  const startBreathing = useCallback(() => setMode('breathe'), []);

  const startVoid = useCallback(() => {
    setVoidSeconds(VOID_SECONDS);
    setVoidStarted(false);
    setVoidCompleted(false);
    setMode('void');
  }, []);

  const selectPractice = useCallback((id: PracticeMode) => {
    if (id !== 'breathe' && !subscribed) {
      hapticFeedback('warning');
      return;
    }
    if (id === 'breathe') {
      startBreathing();
    } else {
      setMode(id);
    }
  }, [subscribed, startBreathing]);

  const grad = gradients[level];
  const backgroundStyle = {
    background: `radial-gradient(ellipse at 50% 40%, ${grad.from}, ${grad.via} 50%, ${grad.to} 100%)`,
  };

  const voidProgress = (VOID_SECONDS - voidSeconds) / VOID_SECONDS;
  const minutes = Math.floor(voidSeconds / 60);
  const secs = voidSeconds % 60;
  const timeDisplay = `${minutes}:${secs.toString().padStart(2, '0')}`;

  const labelMap: Record<VolatilityLevel, string> = {
    calm: t('ambient.calm'), moderate: t('ambient.moderate'), intense: t('ambient.intense'),
  };

  const sharedProps = {
    onComplete: goToMenu,
    textColor: textColors[level],
    ringColor: ringColors[level],
    glowColor: glowColors[level],
  };

  return (
    <>
      <AnimatePresence>
        {!curtainLifted && (
          <motion.div className="fixed inset-0 z-[200] bg-background" exit={{ opacity: 0 }} transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }} />
        )}
      </AnimatePresence>

      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center select-none overflow-y-auto" style={backgroundStyle}>
        {/* Close / Back */}
        <button
          onClick={mode === 'menu' ? handleClose : goToMenu}
          className="absolute top-6 right-6 p-2 rounded-full transition-opacity hover:opacity-80 z-10"
          style={{ color: textColors[level] }}
          aria-label={mode === 'menu' ? 'Exit' : 'Back'}
        >
          <X className="h-5 w-5" />
        </button>

        <AnimatePresence mode="wait">
          {/* ===== PRACTICE MENU ===== */}
          {mode === 'menu' && (
            <motion.div
              key="menu"
              className="flex flex-col items-center gap-8 px-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-[10px] font-mono tracking-[0.3em] uppercase" style={{ color: textColors[level], opacity: 0.5 }}>
                {t('practice.title')}
              </p>

              <div className="flex flex-col gap-3 w-full max-w-[280px]">
                {PRACTICE_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const locked = !item.free && !subscribed;
                  return (
                    <button
                      key={item.id}
                      onClick={() => selectPractice(item.id)}
                      className="flex items-center gap-4 px-4 py-3.5 rounded-lg border transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        borderColor: locked ? 'rgba(255,255,255,0.04)' : ringColors[level],
                        background: locked ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)',
                        opacity: locked ? 0.4 : 1,
                      }}
                    >
                      <Icon className="h-4 w-4 shrink-0" style={{ color: textColors[level] }} />
                      <span className="text-xs font-mono tracking-wider flex-1 text-left" style={{ color: textColors[level] }}>
                        {t(item.labelKey)}
                      </span>
                      {locked && <Lock className="h-3 w-3 shrink-0" style={{ color: textColors[level], opacity: 0.5 }} />}
                    </button>
                  );
                })}
              </div>

              {btcData && (
                <p className="text-[10px] font-mono tabular-nums mt-4" style={{ color: textColors[level], opacity: 0.3 }}>
                  {labelMap[level]} · {Math.abs(btcData.changePercent).toFixed(1)}% 24h
                </p>
              )}
            </motion.div>
          )}

          {/* ===== BREATHING ===== */}
          {mode === 'breathe' && (
            <motion.div
              key="ambient"
              className="flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative flex items-center justify-center">
                <motion.div
                  className="absolute rounded-full"
                  style={{ width: 220, height: 220, background: `radial-gradient(circle, ${glowColors[level]}, transparent 70%)` }}
                  animate={prefersReducedMotion ? { scale: 1, opacity: 0.15 } : { scale: [1, 1.25, 1], opacity: [0.1, 0.2, 0.1] }}
                  transition={{ duration: BREATH_DURATION, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                />
                <motion.div
                  className="relative rounded-full"
                  style={{
                    width: 140, height: 140,
                    border: `1px solid ${ringColors[level]}`,
                    background: `radial-gradient(circle at 50% 40%, ${glowColors[level]}, transparent 80%)`,
                    boxShadow: `0 0 60px 20px ${glowColors[level]}`,
                  }}
                  animate={prefersReducedMotion ? { scale: 1, opacity: 0.4 } : { scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: BREATH_DURATION, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>

              <div className="mt-16 text-center space-y-3">
                <p className="text-[10px] font-mono tracking-[0.3em] uppercase" style={{ color: textColors[level] }}>
                  {labelMap[level]}
                </p>
                {btcData && (
                  <p className="text-[10px] font-mono tabular-nums" style={{ color: textColors[level], opacity: 0.5 }}>
                    {Math.abs(btcData.changePercent).toFixed(1)}% · 24h
                  </p>
                )}
              </div>

              <div className="mt-12 flex flex-col items-center gap-4">
                <button
                  onClick={startVoid}
                  className="text-[10px] font-mono tracking-[0.2em] uppercase transition-opacity hover:opacity-80"
                  style={{ color: textColors[level], opacity: 0.4 }}
                >
                  {t('breathe.startTimer')}
                </button>
              </div>

              <p className="absolute bottom-12 text-[9px] font-mono tracking-[0.2em] uppercase" style={{ color: textColors[level], opacity: 0.3 }}>
                {t('ambient.breathe')}
              </p>
            </motion.div>
          )}

          {/* ===== VOID TIMER ===== */}
          {mode === 'void' && (
            <motion.div
              key="void"
              className="flex flex-col items-center gap-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                className="absolute rounded-full pointer-events-none"
                style={{ width: 300, height: 300, background: `radial-gradient(circle, ${glowColors[level]}, transparent 70%)`, filter: 'blur(60px)' }}
                animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              />

              {!voidStarted && !voidCompleted ? (
                <motion.button
                  onClick={() => { setVoidStarted(true); hapticFeedback('light'); }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="relative z-10 font-mono text-xs tracking-[0.3em] uppercase transition-colors duration-700"
                  style={{ color: textColors[level], opacity: 0.6 }}
                >
                  {t('void.begin')}
                </motion.button>
              ) : voidCompleted ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.5 }}
                  className="relative z-10 flex flex-col items-center gap-8"
                >
                  <p className="font-mono text-xs tracking-[0.3em] uppercase" style={{ color: textColors[level], opacity: 0.6 }}>
                    {t('void.youStayed')}
                  </p>
                  <button onClick={goToMenu} className="font-mono text-[10px] tracking-[0.2em] uppercase transition-colors duration-700" style={{ color: textColors[level], opacity: 0.3 }}>
                    {t('void.return')}
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1 }}
                  className="relative z-10 flex flex-col items-center gap-8"
                >
                  <p className="font-mono text-2xl tracking-[0.2em] tabular-nums" style={{ color: textColors[level], opacity: 0.15 + voidProgress * 0.35 }}>
                    {timeDisplay}
                  </p>
                  <svg width="120" height="120" className="absolute -z-10 opacity-20">
                    <circle cx="60" cy="60" r="56" fill="none" stroke={ringColors[level]} strokeWidth="1" style={{ opacity: 0.3 }} />
                    <circle cx="60" cy="60" r="56" fill="none" stroke={ringColors[level]} strokeWidth="1" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 56}`} strokeDashoffset={`${2 * Math.PI * 56 * (1 - voidProgress)}`} transform="rotate(-90 60 60)" style={{ transition: 'stroke-dashoffset 1s linear' }} />
                  </svg>
                  <button onClick={goToMenu} className="font-mono text-[10px] tracking-[0.2em] uppercase transition-colors duration-700 mt-4" style={{ color: textColors[level], opacity: 0.25 }}>
                    {t('common.back')}
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ===== PRO PRACTICES ===== */}
          {mode === 'checkin' && <motion.div key="checkin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><EmotionalCheckIn {...sharedProps} /></motion.div>}
          {mode === 'journal' && <motion.div key="journal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><GuidedJournal {...sharedProps} /></motion.div>}
          {mode === 'bodyscan' && <motion.div key="bodyscan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><BodyScan {...sharedProps} /></motion.div>}
          {mode === 'replay' && <motion.div key="replay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><ReflectionReplay {...sharedProps} /></motion.div>}
        </AnimatePresence>
      </div>
    </>
  );
}
