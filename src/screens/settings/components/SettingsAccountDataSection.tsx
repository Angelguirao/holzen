import { useActionState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingButton } from '@/components/ui/loading-button';
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
import { deleteAccountAction, signOutAction } from '@/features/auth/public';
import { exportDataAction } from '@/features/user/public';

export function SettingsAccountDataSection() {
  const { t } = useTranslation();
  const [exportState, exportFormAction, exportPending] = useActionState(exportDataAction, {});
  const [deleteState, deleteFormAction, deletePending] = useActionState(deleteAccountAction, {});
  const [signOutState, signOutFormAction, signOutPending] = useActionState(signOutAction, {});

  useEffect(() => {
    if (!exportState.success) return;
    if (exportState.format === 'csv') {
      toast.success('CSV exported', {
        description: `${exportState.pauseCount ?? 0} pauses.`,
      });
    } else {
      toast.success('Data exported', {
        description: `${exportState.pauseCount ?? 0} pauses.`,
      });
    }
  }, [exportState.success, exportState.format, exportState.pauseCount]);

  useEffect(() => {
    if (exportState.error === 'not_authenticated') {
      toast.error('Sign in to export data');
    } else if (exportState.error === 'export_failed') {
      toast.error('Export failed');
    }
  }, [exportState.error]);

  useEffect(() => {
    if (deleteState.success) {
      toast.success('Account deleted');
    } else if (deleteState.error === 'not_authenticated') {
      toast.error('Sign in to delete your account');
    } else if (deleteState.error === 'delete_failed') {
      toast.error('Failed to delete account');
    }
  }, [deleteState.success, deleteState.error]);

  useEffect(() => {
    if (signOutState.error === 'sign_out_failed') {
      toast.error(t('settings.signOutFailed', { defaultValue: 'Sign out failed' }));
    }
  }, [signOutState.error, t]);

  return (
    <>
      <div className="space-y-3">
        <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.data')}</p>
        <div className="flex gap-4">
          <form action={exportFormAction}>
            <input type="hidden" name="format" value="json" />
            <LoadingButton
              type="submit"
              variant="link"
              loading={exportPending}
              loadingText={t('settings.exporting')}
              className="text-xs font-mono text-muted-foreground underline p-0 h-auto"
            >
              {t('settings.exportJson')}
            </LoadingButton>
          </form>
          <form action={exportFormAction}>
            <input type="hidden" name="format" value="csv" />
            <LoadingButton
              type="submit"
              variant="link"
              loading={exportPending}
              loadingText={t('settings.exporting')}
              className="text-xs font-mono text-muted-foreground underline p-0 h-auto"
            >
              {t('settings.exportCsv')}
            </LoadingButton>
          </form>
        </div>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button type="button" className="block text-xs font-mono text-muted-foreground underline">
            {t('common.signOut')}
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono text-sm">{t('common.signOut')}</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              {t('settings.signOutConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-mono text-xs">{t('common.cancel')}</AlertDialogCancel>
            <form action={signOutFormAction} className="inline">
              <AlertDialogAction type="submit" disabled={signOutPending} className="font-mono text-xs">
                {signOutPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                {t('common.signOut')}
              </AlertDialogAction>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button type="button" className="text-xs font-mono text-destructive underline">
            {t('settings.deleteAccount')}
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono text-sm">{t('settings.deleteAccount')}</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              {t('settings.deleteAccountDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-mono text-xs">{t('common.cancel')}</AlertDialogCancel>
            <form action={deleteFormAction} className="inline">
              <AlertDialogAction
                type="submit"
                disabled={deletePending}
                className="font-mono text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletePending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                {deletePending ? t('settings.deleting') : t('settings.deleteForever')}
              </AlertDialogAction>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
