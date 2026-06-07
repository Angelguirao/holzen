import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, Moon, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useSnooze } from '@/features/user/public-hooks';
import {
  formatSnoozePresetUntilClock,
  formatSnoozeUntilSummary,
  inferSnoozeDurationPreset,
  isSnoozeUntilValid,
  mergeSnoozeDateAndTime,
  defaultCustomSnoozeDate,
  SNOOZE_PRESET_HOURS,
  type SnoozeDurationPreset,
} from '@/features/user/domain/snooze-schedule';
import { hapticFeedback } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => i);

type SnoozePanelProps = {
  open: boolean;
  onClose: () => void;
};

/** Figma 475:27864 / 28339 / 30002 — snooze duration panel (Silence pauses). */
export function SnoozePanel({ open, onClose }: SnoozePanelProps) {
  "use memo";
  const { t } = useTranslation();
  const { snoozedUntil, isActive, snooze, snoozeUntil, cancelSnooze } = useSnooze();

  const [silenceEnabled, setSilenceEnabled] = useState(false);
  const [preset, setPreset] = useState<SnoozeDurationPreset>('2h');
  const [customDate, setCustomDate] = useState(() => defaultCustomSnoozeDate());
  const [customHour, setCustomHour] = useState(8);
  const [customMinute, setCustomMinute] = useState(0);
  const [customCalendarExpanded, setCustomCalendarExpanded] = useState(false);
  const [savingCustom, setSavingCustom] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSilenceEnabled(isActive);
    if (isActive && snoozedUntil) {
      const inferred = inferSnoozeDurationPreset(snoozedUntil);
      setPreset(inferred);
      if (inferred === 'custom') {
        setCustomDate(new Date(snoozedUntil));
        setCustomHour(snoozedUntil.getHours());
        setCustomMinute(snoozedUntil.getMinutes());
        setCustomCalendarExpanded(false);
      } else {
        setCustomCalendarExpanded(false);
      }
      return;
    }

    setPreset('2h');
    const fallback = defaultCustomSnoozeDate();
    setCustomDate(fallback);
    setCustomHour(fallback.getHours());
    setCustomMinute(fallback.getMinutes());
    setCustomCalendarExpanded(false);
  }, [open, isActive, snoozedUntil]);

  const customUntilDraft = useMemo(
    () => mergeSnoozeDateAndTime(customDate, customHour, customMinute),
    [customDate, customHour, customMinute],
  );

  const customSaveValid = isSnoozeUntilValid(customUntilDraft);

  const presetUntilClock =
    preset === 'custom'
      ? null
      : formatSnoozePresetUntilClock(preset, {
          snoozedUntil,
          isActive: silenceEnabled && isActive,
        });

  const presetUntilSuffix = presetUntilClock ? (
    <span className="ml-1 italic text-muted-foreground">
      {t('snooze.untilTimeSuffix', {
        time: presetUntilClock,
        defaultValue: `Until ${presetUntilClock}`,
      })}
    </span>
  ) : null;

  const applyPreset = useCallback(
    async (nextPreset: SnoozeDurationPreset) => {
      if (nextPreset === 'custom') return;
      hapticFeedback('light');
      await snooze(SNOOZE_PRESET_HOURS[nextPreset]);
      toast(
        t('snooze.activatedPreset', {
          hours: SNOOZE_PRESET_HOURS[nextPreset],
          defaultValue: `Pauses silenced for ${SNOOZE_PRESET_HOURS[nextPreset]} hours`,
        }),
        { duration: 3000 },
      );
    },
    [snooze, t],
  );

  const handleSilenceToggle = useCallback(
    async (checked: boolean) => {
      hapticFeedback('light');
      setSilenceEnabled(checked);
      if (!checked) {
        await cancelSnooze();
        toast(t('snooze.cancelled', { defaultValue: 'Silence cancelled' }), { duration: 2000 });
        return;
      }

      if (preset === 'custom') {
        setCustomCalendarExpanded(true);
        return;
      }

      await applyPreset(preset);
    },
    [applyPreset, cancelSnooze, preset, t],
  );

  const handlePresetChange = useCallback(
    async (value: string) => {
      const next = value as SnoozeDurationPreset;
      setPreset(next);
      if (next === 'custom') {
        setCustomCalendarExpanded(true);
        return;
      }
      setCustomCalendarExpanded(false);
      if (silenceEnabled) {
        await applyPreset(next);
      }
    },
    [applyPreset, silenceEnabled],
  );

  const handleSaveCustom = useCallback(async () => {
    if (!customSaveValid) return;
    hapticFeedback('light');
    setSavingCustom(true);
    try {
      await snoozeUntil(customUntilDraft);
      setSilenceEnabled(true);
      setCustomCalendarExpanded(false);
      toast(
        t('snooze.activatedUntil', {
          summary: formatSnoozeUntilSummary(customUntilDraft),
          defaultValue: `Pauses silenced until ${formatSnoozeUntilSummary(customUntilDraft)}`,
        }),
        { duration: 3000 },
      );
    } finally {
      setSavingCustom(false);
    }
  }, [customSaveValid, customUntilDraft, snoozeUntil, t]);

  const savedCustomSummary =
    silenceEnabled && isActive && snoozedUntil && preset === 'custom' && !customCalendarExpanded
      ? formatSnoozeUntilSummary(snoozedUntil)
      : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <Moon className="h-6 w-6 shrink-0 text-foreground" aria-hidden />
        <DialogTitle className={cn(homeInWidget.kicker, 'flex-1 text-left font-normal text-secondary-foreground')}>
          {t('snooze.panelTitle', { defaultValue: 'Snoozed pauses' })}
        </DialogTitle>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
          aria-label={t('common.close', { defaultValue: 'Close' })}
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="space-y-2 pt-2">
        <div className="flex items-center gap-2">
          <p className="flex-1 text-base font-medium leading-6 tracking-wide text-foreground">
            {t('snooze.silencePauses', { defaultValue: 'Silence pauses' })}
          </p>
          <Switch
            checked={silenceEnabled}
            onCheckedChange={handleSilenceToggle}
            aria-label={t('snooze.silencePauses', { defaultValue: 'Silence pauses' })}
          />
        </div>

        <DialogDescription className="text-sm leading-5 tracking-wide text-foreground">
          {t('snooze.selectHowLong', { defaultValue: 'Select how long' })}
        </DialogDescription>

        <RadioGroup value={preset} onValueChange={handlePresetChange} className="gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-md p-1">
            <RadioGroupItem value="2h" id="snooze-2h" className="h-5 w-5 border-2 border-border" />
            <span className="flex-1 text-sm leading-5 tracking-wide text-foreground">
              {t('snooze.2h', { defaultValue: '2 hours' })}
              {preset === '2h' ? presetUntilSuffix : null}
            </span>
          </label>

          <label className="flex cursor-pointer items-center gap-2 rounded-md p-1">
            <RadioGroupItem value="6h" id="snooze-6h" className="h-5 w-5 border-2 border-border" />
            <span className="flex-1 text-sm leading-5 tracking-wide text-foreground">
              {t('snooze.6h', { defaultValue: '6 hours' })}
              {preset === '6h' ? presetUntilSuffix : null}
            </span>
          </label>

          <label className="flex cursor-pointer items-center gap-2 rounded-md p-1">
            <RadioGroupItem value="custom" id="snooze-custom" className="h-5 w-5 border-2 border-border" />
            <span className="text-sm leading-5 tracking-wide text-foreground">
              {t('snooze.untilSpecificTime', { defaultValue: 'Until a specific time' })}
            </span>
          </label>
        </RadioGroup>

        {preset === 'custom' ? (
          savedCustomSummary && !customCalendarExpanded ? (
            <div className="rounded-lg bg-background p-2">
              <button
                type="button"
                onClick={() => setCustomCalendarExpanded(true)}
                className="flex w-full items-center justify-between gap-2 rounded-md p-1 text-left"
              >
                <span className="w-14 shrink-0 text-sm text-muted-foreground">
                  {t('snooze.untilLabel', { defaultValue: 'Until' })}
                </span>
                <span className="flex min-w-0 flex-1 items-center gap-2 rounded border border-border/60 px-2 py-1.5 text-sm text-foreground">
                  <span className="min-w-0 flex-1 truncate">{savedCustomSummary}</span>
                  <Pencil className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 rounded-2xl border border-border bg-background p-4">
              <button
                type="button"
                onClick={() => setCustomCalendarExpanded((v) => !v)}
                className="flex w-full items-center justify-between gap-2 text-left"
              >
                <span className="w-14 shrink-0 text-sm text-muted-foreground">
                  {t('snooze.untilLabel', { defaultValue: 'Until' })}
                </span>
                <span className="flex min-w-0 flex-1 items-center gap-2 rounded px-2 py-1.5 text-sm text-foreground">
                  <span className="min-w-0 flex-1 truncate">
                    {formatSnoozeUntilSummary(customUntilDraft)}
                  </span>
                  {customCalendarExpanded ? (
                    <ChevronUp className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                  ) : (
                    <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                  )}
                </span>
              </button>

              {customCalendarExpanded ? (
                <>
                  <Calendar
                    mode="single"
                    selected={customDate}
                    onSelect={(day) => {
                      if (day) setCustomDate(day);
                    }}
                    disabled={(day) => day < new Date(new Date().setHours(0, 0, 0, 0))}
                    className="mx-auto p-0"
                  />

                  <div className="space-y-2">
                    <p className="text-center text-sm leading-5 text-foreground">
                      {t('snooze.hour', { defaultValue: 'Hour' })}
                    </p>
                    <div className="flex justify-center gap-2">
                      <Select
                        value={String(customHour)}
                        onValueChange={(value) => setCustomHour(Number(value))}
                      >
                        <SelectTrigger className="w-[72px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HOUR_OPTIONS.map((hour) => (
                            <SelectItem key={hour} value={String(hour)}>
                              {format(new Date(2000, 0, 1, hour), 'HH')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={String(customMinute)}
                        onValueChange={(value) => setCustomMinute(Number(value))}
                      >
                        <SelectTrigger className="w-[72px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MINUTE_OPTIONS.map((minute) => (
                            <SelectItem key={minute} value={String(minute)}>
                              {format(new Date(2000, 0,  1, 0, minute), 'mm')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!customSaveValid || savingCustom}
                    onClick={handleSaveCustom}
                    className={cn(
                      homeInWidget.ctaNoxPrimary,
                      'mt-2 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground',
                    )}
                  >
                    {t('snooze.save', { defaultValue: 'Save' })}
                  </button>
                </>
              ) : null}
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}
