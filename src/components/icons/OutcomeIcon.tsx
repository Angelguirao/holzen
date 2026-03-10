/**
 * BTC-native metaphor icons for outcome decisions.
 * hold = diamond (diamond hands), sell = pickaxe (mining out),
 * buy/bought = lightning bolt (stacking sats), nothing = block (unmoved block)
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

/** Hold — diamond (diamond hands) */
function HoldIcon(props: IconProps) {
  return wrap(
    <>
      <polygon points="12,2 20,9 12,22 4,9" />
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="8" y1="2" x2="12" y2="9" />
      <line x1="16" y1="2" x2="12" y2="9" />
    </>,
    props,
  );
}

/** Sell — pickaxe (mining out / extracting) */
function SellIcon(props: IconProps) {
  return wrap(
    <>
      <path d="M5 19L15 9" />
      <path d="M15 9l3-3c1-1 3-1 4 0s1 3 0 4l-3 3" />
      <path d="M15 9l-2 2" />
    </>,
    props,
  );
}

/** Buy — lightning bolt (stacking sats / energy) */
function BuyIcon(props: IconProps) {
  return wrap(
    <polygon points="13,2 4,14 11,14 10,22 20,10 13,10" />,
    props,
  );
}

/** Nothing — block / cube (unmoved, solid, a bitcoin block) */
function NothingIcon(props: IconProps) {
  return wrap(
    <>
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 7v10l10 5V12" />
      <path d="M22 7v10l-10 5V12" />
    </>,
    props,
  );
}

const OUTCOME_ICONS: Record<string, React.FC<IconProps>> = {
  held: HoldIcon,
  hold: HoldIcon,
  sold: SellIcon,
  sell: SellIcon,
  bought: BuyIcon,
  buy: BuyIcon,
  nothing: NothingIcon,
};

export function OutcomeIcon({ outcome, ...props }: IconProps & { outcome: string }) {
  const Icon = OUTCOME_ICONS[outcome];
  if (!Icon) return null;
  return <Icon {...props} />;
}

export { OUTCOME_ICONS };
