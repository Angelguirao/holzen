import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Hand, TrendingDown, TrendingUp, Minus, Check, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { hapticFeedback } from '@/lib/haptics';

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
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('reflections')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('outcome', null)
      .then(({ count }) => {
        setPendingCount(count ?? 0);
      });
  }, [user]);

  const handleSelect = async (outcome: string) => {
    setSaving(true);
    await supabase
      .from('reflections')
      .update({ outcome })
      .eq('id', reflectionId);
    setSaved(true);
    setTimeout(() => onComplete(), 1800);
  };

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {saved ? (
          <motion.div
            key="celebration"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex flex-col items-center gap-3 py-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ duration: 0.5, times: [0, 0.6, 1] }}
              className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"
            >
              <Check className="h-5 w-5 text-primary" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-1.5"
            >
              <Flame className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-mono text-muted-foreground">Streak updated</p>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="prompt"
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            <div className="space-y-1">
              <p className="text-sm font-mono text-muted-foreground">What did you do?</p>
              {pendingCount >= 3 ? (
                <p className="text-[10px] font-mono text-muted-foreground/50">
                  You have {pendingCount} reflections without an outcome. Logging builds your streak.
                </p>
              ) : (
                <p className="text-[10px] font-mono text-muted-foreground/50">
                  Logging an outcome builds your streak.
                </p>
              )}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
