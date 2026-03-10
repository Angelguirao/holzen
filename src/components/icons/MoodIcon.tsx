/**
 * Abstract shape icons for the 8-mood system.
 * Each mood is a minimal geometric SVG that evokes the feeling
 * without the juvenile tone of emoji.
 */

interface IconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

function wrap(children: React.ReactNode, { size = 20, className, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      {children}
    </svg>
  );
}

/** FOMO — tight inward spiral (being pulled in) */
function Fomo(props: IconProps) {
  return wrap(
    <path d="M12 3c5 0 8 3 8 8s-3 7-7 7-6-2-6-5 2-4 4-4 3 1 3 2.5" />,
    props,
  );
}

/** Excited — upward radiating burst */
function Excited(props: IconProps) {
  return wrap(
    <>
      <line x1="12" y1="14" x2="12" y2="4" />
      <line x1="8" y1="16" x2="5" y2="6" />
      <line x1="16" y1="16" x2="19" y2="6" />
      <line x1="6" y1="18" x2="2" y2="12" />
      <line x1="18" y1="18" x2="22" y2="12" />
    </>,
    props,
  );
}

/** Greedy — expanding concentric arcs (grabbing, wanting more) */
function Greedy(props: IconProps) {
  return wrap(
    <>
      <circle cx="12" cy="12" r="2" />
      <path d="M12 6a6 6 0 0 1 6 6" />
      <path d="M12 6a6 6 0 0 0-6 6" />
      <path d="M12 2a10 10 0 0 1 10 10" />
      <path d="M12 2a10 10 0 0 0-10 10" />
    </>,
    props,
  );
}

/** Anxious — jagged zigzag line (tension, unease) */
function Anxious(props: IconProps) {
  return wrap(
    <polyline points="2,18 6,8 9,16 12,6 15,16 18,8 22,18" />,
    props,
  );
}

/** Calm — smooth sine wave (peaceful flow) */
function Calm(props: IconProps) {
  return wrap(
    <path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />,
    props,
  );
}

/** Detached — single horizontal line (flat, removed) */
function Detached(props: IconProps) {
  return wrap(
    <line x1="4" y1="12" x2="20" y2="12" />,
    props,
  );
}

/** Uncertain — open question curve (wavering) */
function Uncertain(props: IconProps) {
  return wrap(
    <>
      <path d="M8 8c0-2.5 2-4 4-4s4 1.5 4 4c0 2-1.5 3-4 4" />
      <circle cx="12" cy="18" r="0.5" fill="currentColor" stroke="none" />
    </>,
    props,
  );
}

/** Fearful — downward contracting chevrons (shrinking, retreating) */
function Fearful(props: IconProps) {
  return wrap(
    <>
      <polyline points="6,4 12,9 18,4" />
      <polyline points="6,10 12,15 18,10" />
      <polyline points="6,16 12,21 18,16" />
    </>,
    props,
  );
}

const MOOD_ICONS: Record<string, React.FC<IconProps>> = {
  fomo: Fomo,
  excited: Excited,
  greedy: Greedy,
  anxious: Anxious,
  calm: Calm,
  detached: Detached,
  uncertain: Uncertain,
  fearful: Fearful,
};

export function MoodIcon({ mood, ...props }: IconProps & { mood: string }) {
  const Icon = MOOD_ICONS[mood];
  if (!Icon) return null;
  return <Icon {...props} />;
}

/** For text-based contexts (share stats, notifications) */
export const MOOD_GLYPHS: Record<string, string> = {
  fomo: '◎',
  excited: '↟',
  greedy: '◉',
  anxious: '⌇',
  calm: '∿',
  detached: '—',
  uncertain: '?',
  fearful: '⌄',
};

export { MOOD_ICONS };
export type { IconProps };
