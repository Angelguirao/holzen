import { useRef, useState, useCallback, type ReactNode } from 'react';
import { Heart, Archive, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/lib/haptics';

interface Props {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftLabel?: string;
  rightLabel?: string;
  disabled?: boolean;
}

const THRESHOLD = 80;
const HAPTIC_TRIGGERED = { left: false, right: false };

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftLabel = 'Archive',
  rightLabel = 'Favorite',
  disabled = false,
}: Props) {
  const startX = useRef(0);
  const currentX = useRef(0);
  const swiping = useRef(false);
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  const handleStart = useCallback((clientX: number) => {
    if (disabled) return;
    startX.current = clientX;
    currentX.current = clientX;
    swiping.current = true;
  }, [disabled]);

  const handleMove = useCallback((clientX: number) => {
    if (!swiping.current) return;
    currentX.current = clientX;
    const diff = clientX - startX.current;
    // Dampen the offset for resistance feel
    const dampened = diff > 0 ? Math.min(diff * 0.6, 120) : Math.max(diff * 0.6, -120);
    // Haptic feedback when crossing threshold
    if (dampened < -THRESHOLD && !HAPTIC_TRIGGERED.left) {
      HAPTIC_TRIGGERED.left = true;
      hapticFeedback('medium');
    } else if (dampened > -THRESHOLD) {
      HAPTIC_TRIGGERED.left = false;
    }
    if (dampened > THRESHOLD && !HAPTIC_TRIGGERED.right) {
      HAPTIC_TRIGGERED.right = true;
      hapticFeedback('medium');
    } else if (dampened < THRESHOLD) {
      HAPTIC_TRIGGERED.right = false;
    }
    setOffset(dampened);
  }, []);

  const handleEnd = useCallback(() => {
    if (!swiping.current) return;
    swiping.current = false;
    if (offset > THRESHOLD && onSwipeRight) {
      onSwipeRight();
    } else if (offset < -THRESHOLD && onSwipeLeft) {
      onSwipeLeft();
    }
    setOffset(0);
  }, [offset, onSwipeLeft, onSwipeRight]);

  const leftRevealed = offset < -30;
  const rightRevealed = offset > 30;
  const leftTriggered = offset < -THRESHOLD;
  const rightTriggered = offset > THRESHOLD;

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Left action (archive) — revealed when swiping left */}
      <div
        className={cn(
          'absolute inset-y-0 right-0 flex items-center justify-end px-5 transition-colors',
          leftTriggered ? 'bg-destructive/20' : 'bg-muted/40'
        )}
        style={{ width: '100%' }}
      >
        {leftRevealed && (
          <div className="flex items-center gap-1.5 text-destructive/70">
            <Trash2 className="h-4 w-4" />
            <span className="text-[10px] font-mono">{leftLabel}</span>
          </div>
        )}
      </div>

      {/* Right action (favorite) — revealed when swiping right */}
      <div
        className={cn(
          'absolute inset-y-0 left-0 flex items-center justify-start px-5 transition-colors',
          rightTriggered ? 'bg-muted/50' : 'bg-muted/40'
        )}
        style={{ width: '100%' }}
      >
        {rightRevealed && (
          <div className="flex items-center gap-1.5 text-foreground/75">
            <Heart className="h-4 w-4" />
            <span className="text-[10px] font-mono">{rightLabel}</span>
          </div>
        )}
      </div>

      {/* Main card content */}
      <div
        ref={ref}
        className="relative z-10 bg-background transition-transform"
        style={{
          transform: `translateX(${offset}px)`,
          transition: swiping.current ? 'none' : 'transform 0.25s ease-out',
        }}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => { if (swiping.current) handleMove(e.clientX); }}
        onMouseUp={handleEnd}
        onMouseLeave={() => { if (swiping.current) handleEnd(); }}
      >
        {children}
      </div>
    </div>
  );
}
