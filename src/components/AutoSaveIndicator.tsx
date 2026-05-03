import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AutoSaveIndicatorProps {
  show: boolean;
}

export function AutoSaveIndicator({ show }: AutoSaveIndicatorProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground animate-fade-in">
      <Check className="w-3 h-3" />
      saved
    </span>
  );
}

export function useAutoSave() {
  const [saveCount, setSaveCount] = useState(0);

  const triggerSave = () => setSaveCount((c) => c + 1);

  return { saveCount, triggerSave };
}
