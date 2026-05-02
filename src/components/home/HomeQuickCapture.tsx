import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { TOOLS } from '@/lib/app-routes';
import { MoodIcon } from '@/components/icons/MoodIcon';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Skeleton } from '@/components/ui/skeleton';
import { hapticFeedback } from '@/lib/haptics';
import { toast } from 'sonner';
import { homeInWidget } from '@/components/home/home-widget-styles';
import { cn } from '@/lib/utils';

const QUICK_MOODS = ['calm', 'anxious', 'fomo', 'uncertain'] as const;

interface LibraryRow {
  id: string;
  created_at: string;
  title: string | null;
}

function relTime(iso: string, locale: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(0, 'day');
  if (diffDays === 1) return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-1, 'day');
  if (diffDays < 7) return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-diffDays, 'day');
  return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

export function HomeQuickCapture() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [libItem, setLibItem] = useState<LibraryRow | null>(null);
  const [loadingLib, setLoadingLib] = useState(true);
  const [mood, setMood] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from('library_items')
        .select('id, created_at, title')
        .eq('user_id', user.id)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) {
        setLibItem((data as LibraryRow | null) ?? null);
        setLoadingLib(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const saveCheckin = useCallback(async () => {
    if (!user) return;
    const trimmed = note.trim();
    if (!mood && !trimmed) {
      toast.message(t('home.quickCapture.checkinNeedOne'));
      return;
    }
    setSaving(true);
    try {
      await supabase.from('practice_entries').insert({
        user_id: user.id,
        type: 'checkin',
        mood: mood ?? 'calm',
        intensity: 3,
        trigger_text: trimmed || null,
      });
      hapticFeedback('success');
      setMood(null);
      setNote('');
      toast.success(t('practice.checkinSaved'));
    } catch {
      toast(t('common.tryAgain'));
    } finally {
      setSaving(false);
    }
  }, [user, mood, note, t]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className={homeInWidget.kicker}>{t('home.quickCapture.checkinTitle')}</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_MOODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMood((prev) => (prev === m ? null : m));
                hapticFeedback('light');
              }}
              className={cn(
                'inline-flex items-center gap-1 rounded-md border px-2 py-1.5 text-[10px] font-mono uppercase tracking-wide transition-colors',
                mood === m
                  ? 'border-primary/60 bg-primary/10 text-foreground'
                  : 'border-border/50 bg-muted/20 text-muted-foreground hover:border-border',
              )}
            >
              <MoodIcon mood={m} size={14} className="opacity-80" />
              {t(`moodCheck.moods.${m}`)}
            </button>
          ))}
        </div>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('home.quickCapture.checkinPlaceholder')}
          className="min-h-[64px] resize-y text-sm font-sans"
          maxLength={500}
        />
        <div className="flex flex-wrap items-center gap-2">
          <LoadingButton
            type="button"
            size="sm"
            onClick={() => void saveCheckin()}
            loading={saving}
            loadingText={t('common.loading')}
            className="text-xs"
          >
            {t('home.quickCapture.checkinSave')}
          </LoadingButton>
          <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" asChild>
            <Link to={TOOLS.practice.checkin}>{t('home.quickCapture.checkinOpenTools')}</Link>
          </Button>
        </div>
      </div>

      <div className="h-px bg-border/50" role="separator" />

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className={homeInWidget.kicker}>{t('home.quickCapture.libraryTitle')}</p>
          <Link to="/archive" className="text-[10px] font-mono uppercase tracking-wider text-primary hover:underline">
            {t('home.quickCapture.libraryOpen')}
          </Link>
        </div>
        {loadingLib ? (
          <Skeleton className="h-3 w-44" />
        ) : libItem ? (
          <p className="text-sm text-foreground/90">
            <BookOpen className="mr-1.5 inline h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            {libItem.title?.trim() || t('home.quickCapture.libraryUntitled')}
            <span className="ml-2 text-[10px] font-mono text-muted-foreground">
              {relTime(libItem.created_at, i18n.language)}
            </span>
          </p>
        ) : (
          <p className={homeInWidget.bodyMuted}>{t('home.quickCapture.libraryEmpty')}</p>
        )}
      </div>
    </div>
  );
}
