import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { hapticFeedback } from '@/lib/haptics';
import { fetchBtcData, type BtcPriceData } from '@/lib/btc';
import { playBlockDiscoveryTone, startAmbientDrone } from '@/lib/notification-tone';

type VolatilityLevel = 'calm' | 'moderate' | 'intense';
type Mode = 'ambient' | 'void';

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
  calm: 'hsla(180, 50%, 50%, 0.15)',
  moderate: 'hsla(35, 60%, 55%, 0.15)',
  intense: 'hsla(350, 55%, 50%, 0.15)',
};

const ringColors: Record<VolatilityLevel, string> = {
  calm: 'hsla(180, 40%, 60%, 0.3)',
  moderate: 'hsla(35, 50%, 60%, 0.3)',
  intense: 'hsla(350, 45%, 55%, 0.3)',
};

const textColors: Record<VolatilityLevel, string> = {
  calm: 'hsla(180, 30%, 70%, 0.6)',
  moderate: 'hsla(35, 40%, 70%, 0.6)',
  intense: 'hsla(350, 35%, 70%, 0.6)',
};

const BREATH_DURATION = 8;

interface BlockData {
  height: number;
  mempoolSize: number;
  mempoolPending: number;
  lastBlockTime?: number;
  fastestFee?: number;
  difficultyEpochProgress?: number; // 0-1 progress through 2016-block epoch
}

/** Fetch latest block height, mempool info, fees, and last block time */
async function fetchBlockData(): Promise<BlockData | null> {
  try {
    const [heightRes, mempoolRes, blocksRes, feesRes] = await Promise.all([
      fetch('https://mempool.space/api/blocks/tip/height'),
      fetch('https://mempool.space/api/mempool'),
      fetch('https://mempool.space/api/blocks'),
      fetch('https://mempool.space/api/v1/fees/recommended'),
    ]);
    const height = await heightRes.json();
    const mempool = await mempoolRes.json();
    const fees = await feesRes.json().catch(() => null);
    let lastBlockTime: number | undefined;
    try {
      const blocks = await blocksRes.json();
      if (Array.isArray(blocks) && blocks.length > 0) {
        lastBlockTime = blocks[0].timestamp;
      }
    } catch {}

    const h = typeof height === 'number' ? height : parseInt(height);
    const epochProgress = (h % 2016) / 2016;

    return {
      height: h,
      mempoolSize: mempool?.vsize ?? 0,
      mempoolPending: mempool?.count ?? 0,
      lastBlockTime,
      fastestFee: fees?.fastestFee,
      difficultyEpochProgress: epochProgress,
    };
  } catch {
    return null;
  }
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

/** Mempool visualization — pending transactions settling */
function MempoolViz({ level, pending }: { level: VolatilityLevel; pending: number }) {
  const prefersReduced = useReducedMotion();
  const dots = useMemo(() => {
    const count = Math.min(Math.max(Math.floor(pending / 3000), 6), 30);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
      size: 1.5 + Math.random() * 2.5,
      delay: Math.random() * 6,
      duration: 4 + Math.random() * 5,
    }));
  }, [pending]);

  if (prefersReduced) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {dots.map((dot) => (
        <motion.div
          key={dot.id}
          className="absolute rounded-full"
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: dot.size,
            height: dot.size,
            background: glowColors[level],
          }}
          animate={{
            opacity: [0, 0.8, 0],
            y: [0, -30, -60],
            scale: [0.8, 1, 0.3],
          }}
          transition={{
            duration: dot.duration,
            repeat: Infinity,
            delay: dot.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

/** Difficulty epoch progress arc */
function EpochArc({ progress, color }: { progress: number; color: string }) {
  const r = 70;
  const circumference = 2 * Math.PI * r;
  return (
    <motion.svg
      width="160" height="160"
      className="absolute pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.08 }}
      transition={{ delay: 8, duration: 3 }}
    >
      <circle cx="80" cy="80" r={r} fill="none" stroke={color} strokeWidth="0.5" opacity={0.3} />
      <circle
        cx="80" cy="80" r={r} fill="none" stroke={color} strokeWidth="0.5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - progress)}
        transform="rotate(-90 80 80)"
      />
    </motion.svg>
  );
}

/** Contemplative phrases adapted to volatility level */
const VOID_CONTEMPLATIONS: Record<VolatilityLevel, string[]> = {
  calm: [
    'No seconds. Only blocks.',
    'The network keeps time. You don\'t have to.',
    'Each block — a heartbeat of collective energy.',
    'Immutable. Like this moment.',
    'Nothing to react to. Nothing to fix.',
    'Stillness is its own proof of work.',
    'The chain grows. Quietly. Like patience.',
  ],
  moderate: [
    'The market moves. You don\'t have to.',
    'Volatility is noise. Blocks are signal.',
    'Time is a chain of causes. Sit between them.',
    'The mempool stirs. Transactions wait. You can wait too.',
    'Price is a feeling. The chain is a fact.',
    'Between stimulus and response — this space.',
    'Let the candles flicker. The chain doesn\'t flinch.',
  ],
  intense: [
    'The crowd is loud. The chain is silent.',
    'This too will be a block in the past.',
    'Fear and greed are weather. You are the mountain.',
    'Proof of work. Proof of patience.',
    'Every panic sold. Every mania bought. The chain remained.',
    'Breathe. The network is still hashing.',
    'When everything moves — be the thing that doesn\'t.',
  ],
};

function WordByWordText({ text, delay = 0, color }: { text: string; delay?: number; color: string }) {
  const words = text.split(' ');
  return (
    <p className="font-mono text-[10px] leading-relaxed text-center max-w-[260px]" style={{ color }}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.35em]"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 0.5, y: 0 }}
          transition={{ delay: delay + i * 0.35, duration: 0.6, ease: 'easeOut' }}
        >
          {word}
        </motion.span>
      ))}
    </p>
  );
}

/** Format seconds since last block into human-readable */
function formatTimeSince(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs > 0 ? `${secs}s` : ''}`.trim();
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs}h ${remainMins}m`;
}

export default function Breathe() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const [mode, setMode] = useState<Mode>('ambient');
  const [btcData, setBtcData] = useState<BtcPriceData | null>(null);
  const [blockData, setBlockData] = useState<BlockData | null>(null);
  const [level, setLevel] = useState<VolatilityLevel>('calm');
  const [curtainLifted, setCurtainLifted] = useState(false);

  // Void state — no timer, blockchain-synced
  const [voidEntered, setVoidEntered] = useState(false);
  const [contemplationIndex, setContemplationIndex] = useState(0);
  const [timeSinceBlock, setTimeSinceBlock] = useState<number | null>(null);
  const [blockAtEntry, setBlockAtEntry] = useState<number | null>(null);
  const [newBlockMined, setNewBlockMined] = useState(false);
  const [newBlockHeight, setNewBlockHeight] = useState<number | null>(null);
  const [voidElapsed, setVoidElapsed] = useState(0); // seconds in void for dimming

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const contemplationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setCurtainLifted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Fetch BTC + block data
  const loadData = useCallback(async () => {
    const [btc, block] = await Promise.all([
      fetchBtcData().catch(() => null),
      fetchBlockData(),
    ]);
    if (btc) {
      setBtcData(btc);
      setLevel(getVolatilityLevel(btc.changePercent));
    }
    if (block) setBlockData(block);
    return block;
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30_000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Hide nav + prevent scroll
  useEffect(() => {
    document.body.classList.add('ambient-active');
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.classList.remove('ambient-active');
      document.body.style.overflow = '';
    };
  }, []);

  // Void: tick time-since-last-block every second
  useEffect(() => {
    if (mode !== 'void' || !voidEntered) return;
    const tick = () => {
      if (blockData?.lastBlockTime) {
        setTimeSinceBlock(Math.floor(Date.now() / 1000) - blockData.lastBlockTime);
      }
      setVoidElapsed((prev) => prev + 1);
    };
    tick();
    tickRef.current = setInterval(tick, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [mode, voidEntered, blockData?.lastBlockTime]);

  // Void: poll for new blocks every 15s
  useEffect(() => {
    if (mode !== 'void' || !voidEntered) return;
    pollRef.current = setInterval(async () => {
      const fresh = await fetchBlockData();
      if (fresh) {
        if (blockAtEntry && fresh.height > blockAtEntry && !newBlockMined) {
          setNewBlockMined(true);
          setNewBlockHeight(fresh.height);
          hapticFeedback('success');
          playBlockDiscoveryTone();
        }
        setBlockData(fresh);
      }
    }, 15_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [mode, voidEntered, blockAtEntry, newBlockMined]);

  // Void: cycle contemplations every 12s
  useEffect(() => {
    if (mode !== 'void' || !voidEntered) return;
    contemplationTimerRef.current = setInterval(() => {
      setContemplationIndex((prev) => (prev + 1) % VOID_CONTEMPLATIONS[level].length);
    }, 20_000);
    return () => { if (contemplationTimerRef.current) clearInterval(contemplationTimerRef.current); };
  }, [mode, voidEntered]);

  // Void: ambient drone
  const stopDroneRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (mode !== 'void' || !voidEntered) return;
    stopDroneRef.current = startAmbientDrone();
    return () => {
      stopDroneRef.current?.();
      stopDroneRef.current = null;
    };
  }, [mode, voidEntered]);

  const handleClose = useCallback(() => {
    [pollRef, contemplationTimerRef, tickRef].forEach((ref) => {
      if (ref.current) clearInterval(ref.current);
    });
    stopDroneRef.current?.();
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const enterVoid = useCallback(() => {
    setVoidEntered(false);
    setContemplationIndex(0);
    setNewBlockMined(false);
    setNewBlockHeight(null);
    setVoidElapsed(0);
    setBlockAtEntry(blockData?.height ?? null);
    setMode('void');
  }, [blockData]);

  const backToAmbient = useCallback(() => {
    [pollRef, contemplationTimerRef, tickRef].forEach((ref) => {
      if (ref.current) clearInterval(ref.current);
    });
    stopDroneRef.current?.();
    setMode('ambient');
  }, []);

  const grad = gradients[level];
  const backgroundStyle = {
    background: `radial-gradient(ellipse at 50% 40%, ${grad.from}, ${grad.via} 50%, ${grad.to} 100%)`,
  };

  const labelMap: Record<VolatilityLevel, string> = {
    calm: t('ambient.calm'),
    moderate: t('ambient.moderate'),
    intense: t('ambient.intense'),
  };

  return (
    <>
      {/* Dark curtain entrance */}
      <AnimatePresence>
        {!curtainLifted && (
          <motion.div
            className="fixed inset-0 z-[200] bg-background"
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </AnimatePresence>

      <div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center select-none"
        style={backgroundStyle}
      >
        {/* Mempool particles */}
        {blockData && <MempoolViz level={level} pending={blockData.mempoolPending} />}

        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 p-2 rounded-full transition-opacity hover:opacity-80 z-10"
          style={{ color: textColors[level] }}
          aria-label="Exit"
        >
          <X className="h-5 w-5" />
        </button>

        <AnimatePresence mode="wait">
          {mode === 'ambient' && (
            <motion.div
              key="ambient"
              className="flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Breathing circles */}
              <div className="relative flex items-center justify-center">
                {/* Outer glow ring */}
                <motion.div
                  className="absolute rounded-full"
                  style={{
                    width: 220,
                    height: 220,
                    background: `radial-gradient(circle, ${glowColors[level]}, transparent 70%)`,
                  }}
                  animate={prefersReducedMotion ? { scale: 1, opacity: 0.15 } : {
                    scale: [1, 1.25, 1],
                    opacity: [0.1, 0.2, 0.1],
                  }}
                  transition={{
                    duration: BREATH_DURATION,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.3,
                  }}
                />

                {/* Main breathing circle */}
                <motion.div
                  className="relative rounded-full flex items-center justify-center"
                  style={{
                    width: 140,
                    height: 140,
                    border: `1px solid ${ringColors[level]}`,
                    background: `radial-gradient(circle at 50% 40%, ${glowColors[level]}, transparent 80%)`,
                    boxShadow: `0 0 60px 20px ${glowColors[level]}`,
                  }}
                  animate={prefersReducedMotion ? { scale: 1, opacity: 0.4 } : {
                    scale: [1, 1.15, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: BREATH_DURATION,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  {blockData && (
                    <span
                      className="font-mono text-[11px] tabular-nums tracking-wider"
                      style={{ color: textColors[level], opacity: 0.5 }}
                    >
                      {blockData.height.toLocaleString()}
                    </span>
                  )}
                </motion.div>
              </div>

              {/* Labels */}
              <div className="mt-14 text-center space-y-4">
                <p
                  className="text-[10px] font-mono tracking-[0.3em] uppercase"
                  style={{ color: textColors[level] }}
                >
                  {labelMap[level]}
                </p>

                {blockData && (
                  <motion.p
                    className="text-[10px] font-mono leading-relaxed max-w-[240px]"
                    style={{ color: textColors[level], opacity: 0.35 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.35 }}
                    transition={{ delay: 2, duration: 1.5 }}
                  >
                    {t('breathe.blockGrounding', 'Block {{height}}. Immutable. Like this moment.', { height: blockData.height.toLocaleString() })}
                  </motion.p>
                )}

                {blockData && blockData.mempoolPending > 0 && (
                  <motion.p
                    className="text-[9px] font-mono tabular-nums"
                    style={{ color: textColors[level], opacity: 0.2 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.2 }}
                    transition={{ delay: 3.5, duration: 1.5 }}
                  >
                    {formatNumber(blockData.mempoolPending)} {t('breathe.pendingTx', 'transactions waiting to confirm')}
                  </motion.p>
                )}
              </div>

              {/* Enter the void */}
              <div className="mt-12 flex flex-col items-center gap-4">
                <button
                  onClick={enterVoid}
                  className="text-[10px] font-mono tracking-[0.2em] uppercase transition-opacity hover:opacity-80"
                  style={{ color: textColors[level], opacity: 0.4 }}
                >
                  {t('void.enter', 'Enter the void')}
                </button>
              </div>

              {/* Breathing instruction */}
              <p
                className="absolute bottom-12 text-[9px] font-mono tracking-[0.2em] uppercase"
                style={{ color: textColors[level], opacity: 0.3 }}
              >
                {t('ambient.breathe')}
              </p>
            </motion.div>
          )}

          {mode === 'void' && (
            <motion.div
              key="void"
              className="flex flex-col items-center gap-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              onAnimationComplete={() => !voidEntered && setVoidEntered(true)}
            >
              {/* Ambient glow — slow cosmic pulse */}
              <motion.div
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: 350,
                  height: 350,
                  background: `radial-gradient(circle, ${glowColors[level]}, transparent 70%)`,
                  filter: 'blur(80px)',
                }}
                animate={prefersReducedMotion ? { opacity: 0.3 } : {
                  scale: [1, 1.08, 1],
                  opacity: [0.2, 0.35, 0.2],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Block height — the only clock */}
              <motion.div
                className="relative z-10 flex flex-col items-center gap-3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 1.5, ease: 'easeOut' }}
              >
                <p
                  className="font-mono text-3xl tracking-[0.15em] tabular-nums"
                  style={{ color: textColors[level], opacity: 0.35 }}
                >
                  {blockData?.height.toLocaleString() ?? '···'}
                </p>
                <motion.p
                  className="font-mono text-[8px] tracking-[0.3em] uppercase"
                  style={{ color: textColors[level], opacity: 0.2 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.2 }}
                  transition={{ delay: 2, duration: 1 }}
                >
                  {t('void.currentBlock', 'current block')}
                </motion.p>
              </motion.div>

              {/* Time since last block — ticking with blockchain time */}
              {timeSinceBlock !== null && (
                <motion.div
                  className="relative z-10 flex flex-col items-center gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 3, duration: 1.5 }}
                >
                  <p
                    className="font-mono text-sm tabular-nums tracking-wider"
                    style={{ color: textColors[level], opacity: 0.25 }}
                  >
                    {formatTimeSince(timeSinceBlock)}
                  </p>
                  <p
                    className="font-mono text-[8px] tracking-[0.2em] uppercase"
                    style={{ color: textColors[level], opacity: 0.15 }}
                  >
                    {t('void.sinceLastBlock', 'since last block')}
                  </p>
                  <motion.p
                    className="font-mono text-[7px] tracking-[0.15em] italic"
                    style={{ color: textColors[level], opacity: 0.12 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.12 }}
                    transition={{ delay: 5, duration: 1.5 }}
                  >
                    {timeSinceBlock > 1200
                      ? t('void.longWait', 'patience — the network is searching')
                      : timeSinceBlock > 900
                        ? t('void.searching', 'the network is searching')
                        : t('void.typical', 'typical: ~10 min')}
                  </motion.p>
                </motion.div>
              )}

              {/* New block mined — reverent moment */}
              <AnimatePresence>
                {newBlockMined && newBlockHeight && (
                  <motion.div
                    className="relative z-10 flex flex-col items-center gap-3"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2, ease: 'easeOut' }}
                  >
                    <motion.div
                      className="w-2 h-2 rounded-full"
                      style={{ background: textColors[level] }}
                      animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0.3, 0.6] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <p
                      className="font-mono text-[10px] tracking-[0.2em] text-center max-w-[220px] leading-relaxed"
                      style={{ color: textColors[level], opacity: 0.45 }}
                    >
                      {t('void.blockMined', 'A new block was found. {{height}}. Time moved forward.', { height: newBlockHeight.toLocaleString() })}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Contemplative text — word by word */}
              {voidEntered && (
                <motion.div
                  key={contemplationIndex}
                  className="relative z-10 mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <WordByWordText
                    text={VOID_CONTEMPLATIONS[level][contemplationIndex % VOID_CONTEMPLATIONS[level].length]}
                    delay={0.5}
                    color={textColors[level]}
                  />
                </motion.div>
              )}

              {/* Return — when you're ready */}
              <motion.button
                onClick={backToAmbient}
                className="relative z-10 font-mono text-[9px] tracking-[0.2em] uppercase transition-colors duration-700 mt-6"
                style={{ color: textColors[level], opacity: 0.15 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.15 }}
                transition={{ delay: 6, duration: 2 }}
                whileHover={{ opacity: 0.4 }}
              >
                {t('void.return')}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
