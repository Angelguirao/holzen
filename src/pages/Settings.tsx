import { useAuth } from '@/hooks/use-auth';
import { useHolzen } from '@/hooks/use-holzen';
import { useSubscription } from '@/hooks/use-subscription';
import { useInstallPrompt } from '@/hooks/use-install-prompt';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { ThresholdSetting } from '@/components/ThresholdSetting';
import { ReferralSection } from '@/components/ReferralSection';
import { Changelog } from '@/components/Changelog';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
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

const APP_VERSION = '1.2.0';

const Settings = () => {
  const { user, signOut } = useAuth();
  const { threshold, setThreshold, cumulativeThreshold, setCumulativeThreshold, emailNotifications, setEmailNotifications, companionPrefs, setCompanionPref, reflectionTone, setReflectionTone, cooldownHours, setCooldownHours } = useHolzen();
  const { subscribed, loading: subLoading, checkoutLoading, startCheckout, openPortal, trialRemaining } = useSubscription();
  const { theme, setTheme } = useTheme();
  const { canInstall, install } = useInstallPrompt();
  const { isSupported: pushSupported, isSubscribed: pushSubscribed, loading: pushLoading, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe } = usePushNotifications();
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const changePassword = useCallback(async () => {
    if (newPassword.length < 6) {
      toast('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('Passwords do not match');
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast('Password updated');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast('Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  }, [newPassword, confirmPassword]);

  useEffect(() => {
    document.title = 'Holzen — Settings';
    return () => { document.title = 'Holzen — Pause before you act'; };
  }, []);

  const exportData = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const [{ data: profile }, { data: reflections }] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('reflections').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);

      const exportPayload = {
        exported_at: new Date().toISOString(),
        profile: profile ? { threshold: profile.threshold, email_notifications: profile.email_notifications, created_at: profile.created_at } : null,
        reflections: reflections?.map((r) => ({ message: r.message, context: r.context, created_at: r.created_at })) ?? [],
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `holzen-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Data exported successfully');
    } catch {
      toast('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const deleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('delete-account');
      if (error) throw error;
      toast('Account deleted');
      await signOut();
    } catch {
      toast('Failed to delete account');
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-mono tracking-widest uppercase text-muted-foreground">
          Settings
        </h1>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Toggle dark mode"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      {/* Threshold */}
      <ThresholdSetting threshold={threshold} onSet={setThreshold} cumulativeThreshold={cumulativeThreshold} onSetCumulative={setCumulativeThreshold} />

      <Separator />

      {/* Cooldown */}
      <div className="space-y-4">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Cooldown</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Minimum time between automatic reflections.
        </p>
        <div className="grid grid-cols-4 gap-2">
          {([1, 6, 12, 24] as const).map((h) => (
            <button
              key={h}
              onClick={() => setCooldownHours(h)}
              className={`rounded-md border px-3 py-2 text-center transition-colors ${
                cooldownHours === h
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground'
              }`}
            >
              <p className="text-xs font-mono">{h}h</p>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Companions */}
      <div className="space-y-4">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Companions</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Optional additions shown below each reflection.
        </p>
        <div className="flex items-center justify-between">
          <Label htmlFor="comp-breathing" className="text-xs font-mono text-muted-foreground">
            Breathing exercise
          </Label>
          <Switch
            id="comp-breathing"
            checked={companionPrefs.breathing}
            onCheckedChange={(v) => setCompanionPref('breathing', v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="comp-haiku" className="text-xs font-mono text-muted-foreground">
            Haiku
          </Label>
          <Switch
            id="comp-haiku"
            checked={companionPrefs.haiku}
            onCheckedChange={(v) => setCompanionPref('haiku', v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="comp-learning" className="text-xs font-mono text-muted-foreground">
            Historical insight
          </Label>
          <Switch
            id="comp-learning"
            checked={companionPrefs.learning}
            onCheckedChange={(v) => setCompanionPref('learning', v)}
          />
        </div>
      </div>

      <Separator />

      {/* Reflection Tone */}
      <div className="space-y-4">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Reflection tone</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Choose the voice of your reflections.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: 'stoic', label: 'Stoic', desc: 'Grounded, like Marcus Aurelius' },
            { value: 'zen', label: 'Zen', desc: 'Spacious, meditative' },
            { value: 'poetic', label: 'Poetic', desc: 'Evocative, literary' },
            { value: 'blunt', label: 'Blunt', desc: 'Direct, no fluff' },
          ] as const).map((t) => (
            <button
              key={t.value}
              onClick={() => setReflectionTone(t.value)}
              className={`rounded-md border px-3 py-2.5 text-left transition-colors ${
                reflectionTone === t.value
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground'
              }`}
            >
              <p className="text-xs font-mono font-medium">{t.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <Separator />
      <div className="space-y-4">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Notifications</p>
        <div className="flex items-center justify-between">
          <Label htmlFor="email-notif" className="text-xs font-mono text-muted-foreground">
            Email notifications
          </Label>
          <Switch
            id="email-notif"
            checked={emailNotifications}
            onCheckedChange={setEmailNotifications}
          />
        </div>
        {pushSupported && (
          <div className="flex items-center justify-between">
            <Label htmlFor="push-notif" className="text-xs font-mono text-muted-foreground">
              Push notifications
            </Label>
            <Switch
              id="push-notif"
              checked={pushSubscribed}
              disabled={pushLoading}
              onCheckedChange={(checked) => checked ? pushSubscribe() : pushUnsubscribe()}
            />
          </div>
        )}
      </div>

      <Separator />

      {/* Subscription */}
      <div className="space-y-3">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Subscription</p>
        {subLoading ? (
          <p className="text-xs font-mono text-muted-foreground">Loading</p>
        ) : subscribed ? (
          <button
            onClick={openPortal}
            className="text-xs font-mono text-muted-foreground underline"
          >
            Manage subscription
          </button>
        ) : (
          <div className="space-y-2">
            {trialRemaining !== undefined && trialRemaining > 0 && (
              <p className="text-xs font-mono text-muted-foreground">
                {trialRemaining} free reflection{trialRemaining !== 1 ? 's' : ''} remaining
              </p>
            )}
            <p className="text-xs font-mono text-muted-foreground">
              $3/month · Cancel anytime
            </p>
            <Button
              onClick={startCheckout}
              disabled={checkoutLoading}
              className="w-full font-mono text-xs"
              size="sm"
            >
              {checkoutLoading ? 'Opening checkout' : 'Subscribe'}
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {/* Referrals */}
      <ReferralSection />

      <Separator />

      {/* Install */}
      {canInstall && (
        <>
          <button
            onClick={install}
            className="text-xs font-mono text-muted-foreground underline"
          >
            Install app
          </button>
          <Separator />
        </>
      )}

      {/* Change password */}
      <div className="space-y-3">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Password</p>
        <Input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="text-xs font-mono"
        />
        <Input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="text-xs font-mono"
        />
        <Button
          onClick={changePassword}
          disabled={changingPassword || !newPassword}
          size="sm"
          className="w-full font-mono text-xs"
        >
          {changingPassword ? 'Updating…' : 'Update password'}
        </Button>
      </div>

      <Separator />

      {/* Data */}
      <div className="space-y-3">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Data</p>
        <button
          onClick={exportData}
          disabled={exporting}
          className="text-xs font-mono text-muted-foreground underline"
        >
          {exporting ? 'Exporting…' : 'Export my data'}
        </button>
      </div>

      <Separator />

      {/* Account */}
      <div className="space-y-3">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Account</p>
        {user && (
          <p className="text-xs font-mono text-muted-foreground truncate">{user.email}</p>
        )}
        <button
          onClick={signOut}
          className="block text-xs font-mono text-muted-foreground underline"
        >
          Sign out
        </button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="text-xs font-mono text-destructive underline">
              Delete account
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-mono text-sm">Delete account</AlertDialogTitle>
              <AlertDialogDescription className="text-xs">
                This will permanently delete your account, all reflections, and all data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-mono text-xs">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteAccount}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono text-xs"
              >
                {deleting ? 'Deleting…' : 'Delete forever'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Separator />

      {/* Changelog & Version */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Changelog />
          <a href="/roadmap" target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-muted-foreground underline">Roadmap</a>
        </div>
        <p className="text-[10px] font-mono text-muted-foreground/50">
          Holzen v{APP_VERSION}
        </p>
      </div>
    </div>
  );
};

export default Settings;
