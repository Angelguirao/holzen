import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { ShareReflection } from '@/components/ShareReflection';
import { ReflectionWallpaper } from '@/components/ReflectionWallpaper';
import { hapticFeedback } from '@/lib/haptics';

interface Props {
  message: string;
  context: string | null;
  haiku: string | null;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  subscribed: boolean;
}

export function PauseHeader({ message, context, isFavorite, onToggleFavorite, haiku, subscribed }: Props) {
  return (
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      {context && (
        <p className="text-[10px] font-mono text-muted-foreground/30 uppercase tracking-[0.15em]">
          {context}
        </p>
      )}
      <p className="text-[15px] leading-[1.7] text-foreground/70 font-light line-clamp-3">{message}</p>
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => { hapticFeedback('light'); onToggleFavorite(); }}
          className={`p-1.5 rounded-full transition-all duration-300 ${isFavorite ? 'text-destructive bg-destructive/5' : 'text-muted-foreground/25 hover:text-destructive/60'}`}
          aria-label="Favorite"
        >
          <Heart className={`h-3 w-3 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
        <ShareReflection message={message} context={context} haiku={haiku} />
        {subscribed && <ReflectionWallpaper message={message} mood={null} context={context} haiku={haiku} variant="button" />}
      </div>
    </motion.div>
  );
}
