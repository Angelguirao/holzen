import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X, GripVertical, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { hapticFeedback } from '@/lib/haptics';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { STEP_REGISTRY, STEP_CATEGORIES, type StepData } from './ritual/stepRegistry';

interface Props {
  onSave: (steps: StepData[], name: string) => void;
  onCancel: () => void;
  initialSteps?: StepData[];
  initialName?: string;
}

export function RitualBuilder({ onSave, onCancel, initialSteps, initialName }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [name, setName] = useState(initialName || '');
  const [steps, setSteps] = useState<StepData[]>(initialSteps || []);
  const [showPicker, setShowPicker] = useState(false);
  const [physicalAction, setPhysicalAction] = useState('');
  const [physicalDuration, setPhysicalDuration] = useState(5);
  const [saving, setSaving] = useState(false);

  const addStep = useCallback((type: string) => {
    if (type === 'physical') {
      // Handled by physical form
      return;
    }
    setSteps((prev) => [...prev, { type }]);
    setShowPicker(false);
    hapticFeedback('light');
  }, []);

  const addPhysical = useCallback(() => {
    if (!physicalAction.trim()) return;
    setSteps((prev) => [...prev, { type: 'physical', action: physicalAction.trim(), durationMinutes: physicalDuration }]);
    setPhysicalAction('');
    setPhysicalDuration(5);
    setShowPicker(false);
    hapticFeedback('light');
  }, [physicalAction, physicalDuration]);

  const removeStep = useCallback((index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
    hapticFeedback('light');
  }, []);

  const moveStep = useCallback((from: number, to: number) => {
    setSteps((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }, []);

  const saveTemplate = useCallback(async () => {
    if (!user || !name.trim() || steps.length === 0) return;
    setSaving(true);
    try {
      await supabase.from('ritual_templates' as any).insert({
        user_id: user.id,
        name: name.trim(),
        steps,
      });
      toast(t('ritual.builder.saved'));
    } catch {
      toast(t('common.tryAgain'));
    } finally {
      setSaving(false);
    }
  }, [user, name, steps, t]);

  const handleStart = useCallback(() => {
    if (steps.length === 0) return;
    // Ensure there's a 'decide' step at the end
    const finalSteps = steps[steps.length - 1]?.type === 'decide' ? steps : [...steps, { type: 'decide' }];
    onSave(finalSteps, name || 'Custom');
  }, [steps, name, onSave]);

  return (
    <div className="space-y-5">
      <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/50 text-center">
        {t('ritual.builder.title')}
      </p>

      {/* Name */}
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('ritual.builder.namePlaceholder')}
        className="text-sm font-mono bg-muted/20 border-border/40"
      />

      {/* Steps list */}
      <div className="space-y-1.5">
        {steps.map((s, i) => {
          const reg = STEP_REGISTRY[s.type];
          const Icon = reg?.icon;
          return (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-md border border-border/30 bg-muted/10">
              <GripVertical className="h-3 w-3 text-muted-foreground/30 shrink-0 cursor-grab" />
              {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />}
              <div className="flex-1 min-w-0">
                <span className="text-xs font-mono">{t(reg?.label ?? s.type)}</span>
                {s.type === 'physical' && s.action && (
                  <span className="text-[10px] text-muted-foreground/40 ml-2">{s.action} · {s.durationMinutes}min</span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {i > 0 && (
                  <button onClick={() => moveStep(i, i - 1)} className="text-[9px] font-mono text-muted-foreground/30 hover:text-muted-foreground px-1">↑</button>
                )}
                {i < steps.length - 1 && (
                  <button onClick={() => moveStep(i, i + 1)} className="text-[9px] font-mono text-muted-foreground/30 hover:text-muted-foreground px-1">↓</button>
                )}
                <button onClick={() => removeStep(i)} className="text-muted-foreground/30 hover:text-foreground p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}

        {steps.length === 0 && (
          <p className="text-xs text-muted-foreground/40 text-center py-4">{t('ritual.builder.empty')}</p>
        )}
      </div>

      {/* Add step */}
      {!showPicker ? (
        <button
          onClick={() => setShowPicker(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md border border-dashed border-border/40 hover:border-border/80 transition-colors"
        >
          <Plus className="h-3 w-3 text-muted-foreground/50" />
          <span className="text-[10px] font-mono text-muted-foreground/50">{t('ritual.builder.addStep')}</span>
        </button>
      ) : (
        <div className="space-y-3 rounded-md border border-border/40 p-3">
          {STEP_CATEGORIES.map((cat) => {
            const catSteps = Object.entries(STEP_REGISTRY).filter(([, v]) => v.category === cat.id);
            if (catSteps.length === 0) return null;
            return (
              <div key={cat.id} className="space-y-1">
                <p className="text-[9px] font-mono tracking-widest uppercase text-muted-foreground/40">
                  {t(cat.labelKey)}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {catSteps.map(([type, config]) => {
                    if (type === 'physical') {
                      return null; // Handled separately below
                    }
                    const Icon = config.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => addStep(type)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border/30 hover:border-border/60 hover:bg-muted/20 transition-all text-xs font-mono"
                      >
                        <Icon className="h-3 w-3 text-muted-foreground/50" />
                        {t(config.label)}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Physical action input */}
          <div className="space-y-1.5">
            <p className="text-[9px] font-mono tracking-widest uppercase text-muted-foreground/40">
              {t('ritual.builder.customAction')}
            </p>
            <div className="flex gap-2">
              <Input
                value={physicalAction}
                onChange={(e) => setPhysicalAction(e.target.value)}
                placeholder={t('ritual.builder.actionPlaceholder')}
                className="text-xs font-mono bg-muted/20 border-border/40 flex-1"
              />
              <Input
                type="number"
                value={physicalDuration}
                onChange={(e) => setPhysicalDuration(Number(e.target.value) || 5)}
                className="text-xs font-mono bg-muted/20 border-border/40 w-16"
                min={1}
                max={60}
              />
              <Button variant="outline" size="sm" onClick={addPhysical} disabled={!physicalAction.trim()} className="font-mono text-xs shrink-0">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-[9px] text-muted-foreground/30">{t('ritual.builder.actionHint')}</p>
          </div>

          <button onClick={() => setShowPicker(false)} className="text-[10px] font-mono text-muted-foreground/40 hover:text-muted-foreground">
            {t('common.cancel')}
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} className="font-mono text-xs">
          {t('common.back')}
        </Button>
        <div className="flex-1" />
        {name.trim() && steps.length > 0 && (
          <Button variant="ghost" size="sm" onClick={saveTemplate} disabled={saving} className="font-mono text-xs gap-1">
            <Save className="h-3 w-3" />
            {t('ritual.builder.saveTemplate')}
          </Button>
        )}
        <Button
          size="sm"
          onClick={handleStart}
          disabled={steps.length === 0}
          className="font-mono text-xs"
        >
          {t('ritual.builder.startRitual')}
        </Button>
      </div>
    </div>
  );
}
