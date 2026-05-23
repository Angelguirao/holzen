import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { hapticFeedback } from '@/lib/haptics';
import { cn } from '@/lib/utils';

export type PauseReflectFavoriteButtonProps = {
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

/** Pro-only favorite toggle on the reflection card header row. */
export function PauseReflectFavoriteButton({ isFavorite, onToggleFavorite }: PauseReflectFavoriteButtonProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={() => {
        hapticFeedback('light');
        onToggleFavorite();
      }}
      className={cn(
        'shrink-0 rounded-full p-2 transition-colors',
        isFavorite ? 'bg-destructive/10 text-destructive' : 'text-muted-foreground hover:text-destructive',
      )}
      aria-label={t('pause.reflect.favoriteAria', { defaultValue: 'Favorite this reflection' })}
    >
      <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} aria-hidden />
    </button>
  );
}
