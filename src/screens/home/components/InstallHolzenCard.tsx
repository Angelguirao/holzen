import { useEffect, useRef, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInstallPrompt } from '@/app/hooks/use-install-prompt';
import { useAuth } from '@/features/auth/public';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import type { PWAInstallElement } from '@/types/pwa-install';

const DISMISS_KEY = 'holzen_install_card_dismissed_v1';

interface Props {
  /** When true, ignore the dismissed flag (e.g. Settings re-entry). */
  alwaysShow?: boolean;
  /** Compact variant for Settings (no dismiss button, smaller padding). */
  compact?: boolean;
  className?: string;
}

function insertPwaInstallAnalyticsEvent(userId: string | undefined, event: string, metadata?: Record<string, unknown>) {
  if (!userId) return;
  void supabase.from('analytics_events').insert([{ user_id: userId, event, metadata: (metadata ?? {}) as never }]);
}

export function InstallHolzenCard({ alwaysShow = false, compact = false, className }: Props) {
  const { user } = useAuth();
  const { canInstall, isInstalled, install } = useInstallPrompt();
  const elRef = useRef<PWAInstallElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });
  const shownRef = useRef(false);

  // Lazy-load the web component only when this card mounts and is visible
  useEffect(() => {
    if (isInstalled) return;
    if (!alwaysShow && dismissed) return;
    let cancelled = false;
    import('@khmyznikov/pwa-install').then(() => {
      if (!cancelled) setLoaded(true);
    }).catch((err) => {
      console.warn('[InstallHolzenCard] failed to load pwa-install', err);
    });
    return () => { cancelled = true; };
  }, [isInstalled, alwaysShow, dismissed]);

  // Fire shown analytics once
  useEffect(() => {
    if (isInstalled || (!alwaysShow && dismissed) || shownRef.current) return;
    shownRef.current = true;
    insertPwaInstallAnalyticsEvent(user?.id, 'pwa_install_prompt_shown', { surface: compact ? 'settings' : 'home' });
  }, [isInstalled, dismissed, alwaysShow, compact, user?.id]);

  if (isInstalled) return null;
  if (!alwaysShow && dismissed) return null;

  const handleInstall = async () => {
    insertPwaInstallAnalyticsEvent(user?.id, 'pwa_install_prompt_accepted', { surface: compact ? 'settings' : 'home', native: canInstall });
    if (canInstall) {
      // Native Android/Desktop Chrome path — use the captured beforeinstallprompt
      await install();
      return;
    }
    // iOS Safari / fallback path — show the instructional sheet
    elRef.current?.showDialog(true);
  };

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
    setDismissed(true);
    insertPwaInstallAnalyticsEvent(user?.id, 'pwa_install_prompt_dismissed', { surface: 'home' });
  };

  return (
    <>
      <div
        className={cn(
          'relative rounded-md border border-border/40 bg-muted/20 overflow-hidden',
          compact ? 'p-3' : 'p-4',
          className,
        )}
      >
        {!compact && (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className="absolute top-2 right-2 text-muted-foreground/60 hover:text-foreground transition-colors p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        <div className="flex items-start gap-3">
          <Smartphone className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#DBB366' }} />
          <div className="flex-1 min-w-0 pr-4">
            <p className="font-sans text-[#dbb266] font-medium text-base">
              Install Holzen
            </p>
            <p className="leading-relaxed text-foreground mt-1.5 text-base">
              Install Holzen to receive pauses when Bitcoin moves.
              <span className="block leading-relaxed text-[#7b8a9d] mt-1 text-xs">
                Required on iPhone for notifications. Tap Share, then Add to Home Screen.
              </span>
            </p>
            <Button
              onClick={handleInstall}
              size="sm"
              className="w-full font-sans text-base mt-3"
            >
              <Download className="h-3 w-3 mr-1.5" />
              Install Holzen
            </Button>
          </div>
        </div>
      </div>

      {/* Lazy-mounted web component — invisible until showDialog() */}
      {loaded && (
        <pwa-install
          ref={elRef as never}
          manifest-url="/manifest.json"
          icon="/icon-512.png"
          name="Holzen"
          description="Pause before you act. Bitcoin volatility check-ins."
          manual-chrome="true"
        />
      )}
    </>
  );
}
