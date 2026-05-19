import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import {
  getQuietWindowsQueryOptions,
  quietWindowsQueryKey,
  type QuietWindow,
} from '@/lib/quiet-windows-query';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type QuietWindowUpdate = Database['public']['Tables']['quiet_windows']['Update'];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function QuietWindowsManager({ userId }: { userId?: string }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: windows = [] } = useQuery(getQuietWindowsQueryOptions(userId));

  const bumpQuietWindows = useCallback(() => {
    if (!userId) return;
    void queryClient.invalidateQueries({ queryKey: quietWindowsQueryKey(userId) });
  }, [queryClient, userId]);

  const addWindow = async () => {
    if (!userId) return;
    const { error } = await supabase.from('quiet_windows').insert({
      user_id: userId,
      label: t('quietWindows.newLabel', { defaultValue: 'Work hours' }),
      start_hour: 9,
      end_hour: 17,
      days: [1, 2, 3, 4, 5],
      active: true,
    });
    if (!error) {
      bumpQuietWindows();
      toast(t('quietWindows.added', { defaultValue: 'Quiet window added' }));
    }
  };

  const updateWindow = async (id: string, updates: Partial<QuietWindow>) => {
    await supabase.from('quiet_windows').update(updates as QuietWindowUpdate).eq('id', id);
    if (!userId) return;
    queryClient.setQueryData<QuietWindow[]>(quietWindowsQueryKey(userId), (prev) => {
      if (!prev) return prev;
      return prev.map((w) => (w.id === id ? { ...w, ...updates } : w));
    });
  };

  const deleteWindow = async (id: string) => {
    await supabase.from('quiet_windows').delete().eq('id', id);
    if (userId) {
      queryClient.setQueryData<QuietWindow[]>(quietWindowsQueryKey(userId), (prev) => {
        if (!prev) return prev;
        return prev.filter((w) => w.id !== id);
      });
    }
    toast(t('quietWindows.removed', { defaultValue: 'Quiet window removed' }));
  };

  const toggleDay = (window: QuietWindow, day: number) => {
    const days = window.days.includes(day)
      ? window.days.filter((d) => d !== day)
      : [...window.days, day].sort();
    updateWindow(window.id, { days });
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
          {t('quietWindows.title', { defaultValue: 'Extended schedules' })}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={addWindow}
          className="h-6 px-2 text-[10px] font-sans font-medium text-nox-text-link/70 hover:text-nox-text-link"
        >
          <Plus className="h-3 w-3 mr-1" />
          {t('quietWindows.add', { defaultValue: 'Add window' })}
        </Button>
      </div>

      {windows.length === 0 && (
        <p className="text-[10px] font-mono text-muted-foreground/30 italic">
          {t('quietWindows.empty', {
            defaultValue: 'Add extra quiet windows for work, focus, or other schedules.',
          })}
        </p>
      )}

      {windows.map((w) => (
        <div
          key={w.id}
          className="space-y-2 rounded-md border border-border/40 p-3"
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={w.label}
              onChange={(e) => updateWindow(w.id, { label: e.target.value })}
              placeholder={t('quietWindows.labelPlaceholder', { defaultValue: 'Label (e.g. Work hours)' })}
              className="flex-1 bg-transparent border-none outline-none text-xs font-mono text-foreground/80 placeholder:text-muted-foreground/30"
            />
            <Switch
              checked={w.active}
              onCheckedChange={(v) => updateWindow(w.id, { active: v })}
            />
            <button
              onClick={() => deleteWindow(w.id)}
              className="p-1 text-muted-foreground/30 hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-[10px] font-mono text-muted-foreground/50">{t('common.from')}</p>
              <select
                value={w.start_hour}
                onChange={(e) => updateWindow(w.id, { start_hour: Number(e.target.value) })}
                className="w-full text-xs font-mono px-2 py-1.5 rounded-md border border-border/60 bg-background text-foreground"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-mono text-muted-foreground/50">{t('common.until')}</p>
              <select
                value={w.end_hour}
                onChange={(e) => updateWindow(w.id, { end_hour: Number(e.target.value) })}
                className="w-full text-xs font-mono px-2 py-1.5 rounded-md border border-border/60 bg-background text-foreground"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
          </div>

          {/* Day picker */}
          <div className="flex gap-1">
            {DAY_LABELS.map((label, i) => (
              <button
                key={i}
                onClick={() => toggleDay(w, i)}
                className={`flex-1 text-[9px] font-mono py-1 rounded-md transition-colors ${
                  w.days.includes(i)
                    ? 'bg-muted/50 text-foreground border border-border/60'
                    : 'bg-muted/30 text-muted-foreground/40 border border-transparent hover:bg-muted/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
