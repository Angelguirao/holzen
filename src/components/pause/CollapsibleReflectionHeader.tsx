import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Heart } from 'lucide-react';
import { ShareReflection } from '@/components/ShareReflection';
import { hapticFeedback } from '@/lib/haptics';

interface Props {
  message: string;
  context: string | null;
  haiku: string | null;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  subscribed: boolean;
  /** When true, the full reflection and actions show on first paint (pause ritual reflect step). */
  defaultExpanded?: boolean;
}

export function CollapsibleReflectionHeader({
  message,
  context,
  haiku,
  isFavorite,
  onToggleFavorite,
  subscribed,
  defaultExpanded = false,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div
      className="border-b border-border/10 pb-4 cursor-pointer"
      onClick={() => { setExpanded(!expanded); hapticFeedback('light'); }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded); } }}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {context && (
            <p className="mb-1.5 text-xs font-mono uppercase tracking-wide text-muted-foreground">
              {context}
            </p>
          )}
          <p className={`font-editorial text-base leading-relaxed text-foreground sm:text-lg ${expanded ? '' : 'line-clamp-4'}`}>
            {message}
          </p>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 mt-1"
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-0.5 pt-3" onClick={(e) => e.stopPropagation()}>
              {subscribed && (
                <button
                  onClick={() => { hapticFeedback('light'); onToggleFavorite(); }}
                  className={`p-1.5 rounded-full transition-all duration-300 ${isFavorite ? 'text-destructive bg-destructive/5' : 'text-muted-foreground hover:text-destructive'}`}
                  aria-label="Favorite"
                >
                  <Heart className={`h-3 w-3 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              )}
              <ShareReflection message={message} context={context} haiku={haiku} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
