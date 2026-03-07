import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Hand, TrendingDown, TrendingUp, Minus } from 'lucide-react';

const outcomes = [
  { value: 'held', label: 'Held', icon: Hand },
  { value: 'sold', label: 'Sold', icon: TrendingDown },
  { value: 'bought', label: 'Bought', icon: TrendingUp },
  { value: 'nothing', label: 'Nothing', icon: Minus },
] as const;

interface Props {
  reflectionId: string;
  onComplete: () => void;
}

export function OutcomePrompt({ reflectionId, onComplete }: Props) {
  const [saving, setSaving] = useState(false);

  const handleSelect = async (outcome: string) => {
    setSaving(true);
    await supabase
      .from('reflections')
      .update({ outcome })
      .eq('id', reflectionId);
    onComplete();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-mono text-muted-foreground">What did you do?</p>
        <p className="text-[10px] font-mono text-muted-foreground/50">Logging an outcome builds your streak.</p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {outcomes.map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={() => handleSelect(value)}
            className="flex flex-col items-center gap-1 h-auto py-3 text-xs font-mono"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>
      <button
        onClick={onComplete}
        className="text-[10px] font-mono text-muted-foreground/60 underline w-full text-center"
      >
        Skip
      </button>
    </div>
  );
}
