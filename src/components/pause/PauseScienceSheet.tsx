import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Wind, Heart, BookOpen, RefreshCw, Target } from 'lucide-react';

const STEPS = [
  { key: 'breathe', icon: Wind },
  { key: 'feel', icon: Heart },
  { key: 'reflect', icon: BookOpen },
  { key: 'shift', icon: RefreshCw },
  { key: 'decide', icon: Target },
] as const;

export function PauseScienceSheet() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button className="text-[8px] font-mono text-muted-foreground/25 hover:text-muted-foreground/50 transition-colors duration-500 tracking-[0.12em] uppercase">
          {t('pauseScience.whyThisOrder')}
        </button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <div className="px-6 pt-4 pb-8 space-y-6 overflow-y-auto">
          <p className="text-xs font-mono tracking-[0.15em] uppercase text-muted-foreground/60">
            {t('pauseScience.title')}
          </p>
          <div className="space-y-5">
            {STEPS.map(({ key, icon: Icon }) => (
              <div key={key} className="flex gap-3">
                <div className="mt-0.5 w-6 h-6 rounded-full bg-muted/60 flex items-center justify-center shrink-0">
                  <Icon className="h-3 w-3 text-muted-foreground/60" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-foreground">
                    {t(`pauseScience.${key}`)}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {t(`pauseScience.${key}Desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
