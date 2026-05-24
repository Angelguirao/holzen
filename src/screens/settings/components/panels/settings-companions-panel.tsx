import { Link } from 'react-router-dom';
import { QuietWindowsManager } from '@/screens/settings/components/QuietWindowsManager';
import { SourceManagement } from '@/screens/settings/components/SourceManagement';
import { ProLock } from '@/components/ui/pro-lock';
import { PRICING } from '@/features/subscription/public';
import { ThresholdSetting } from '@/screens/settings/components/ThresholdSetting';
import { ReferralSection } from '@/screens/settings/components/ReferralSection';
import { CreditsDashboard } from '@/screens/settings/components/CreditsDashboard';
import { InstallHolzenCard } from '@/screens/home/components/InstallHolzenCard';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Info, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  CHECKOUT_SUPPRESSION_WINDOW_DEFAULT_MINUTES,
  CHECKOUT_SUPPRESSION_WINDOW_MIN_MINUTES,
  CHECKOUT_SUPPRESSION_WINDOW_MAX_MINUTES,
} from '@/features/subscription/public';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useSettingsState } from '@/screens/settings/hooks/use-settings-state';
import { GroundingTagInput } from '@/screens/settings/components/GroundingTagInput';
import { ChangeEmailSection } from '@/screens/settings/components/ChangeEmailSection';
import { ChangePasswordSection } from '@/screens/settings/components/ChangePasswordSection';
import { SettingsAccountDataSection } from '@/screens/settings/components/SettingsAccountDataSection';
import { HoldGoalWidget } from '@/screens/home/components/HoldGoalWidget';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TRACKED_ASSETS } from '@/features/market/public';


export function SettingsCompanionsPanel() {
  const {
    t,
    companionPrefs,
    setCompanionPref,
  } = useSettingsState();
  return (
    <>

            <ProLock feature="companions" hideContent>
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('settings.companionsDesc')}
                </p>
                {(['haiku', 'grounding', 'signal', 'zoomOut', 'history'] as const).map((comp) => (
                  <div key={comp} className="flex items-center justify-between">
                    <Label htmlFor={`comp-${comp}`} className="text-xs font-mono text-muted-foreground">
                      {t(`settings.companionLabels.${comp}`)}
                    </Label>
                    <Switch
                      id={`comp-${comp}`}
                      checked={companionPrefs[comp]}
                      onCheckedChange={(v) => setCompanionPref(comp, v)}
                    />
                  </div>
                ))}
              </div>

              {/* Source Management */}
              <SourceManagement />

            </div>
            </ProLock>
    </>
  );
}

