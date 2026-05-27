import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';
import { X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { PageHeading } from '@/components/ui/page-heading';
import { useAuthScreen } from '@/screens/marketing/hooks/use-auth-screen';

const AuthScreen = () => {
  const {
    t,
    view,
    setView,
    toggleSignUpSignIn,
    email,
    setEmail,
    password,
    setPassword,
    error,
    setError,
    confirmSent,
    setConfirmSent,
    resetSent,
    setResetSent,
    emailAuthFormAction,
    emailAuthPending,
    forgotFormAction,
    forgotPending,
    handleGoogle,
    isGooglePending,
  } = useAuthScreen();

  if (confirmSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <PageHeading title={t('common.holzen')} />
          <p className="text-sm">{t('auth.checkEmailConfirm')}</p>
          <button type="button" onClick={() => setConfirmSent(false)} className="text-xs font-mono text-muted-foreground underline">{t('common.back')}</button>
        </div>
      </div>
    );
  }

  if (resetSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <PageHeading title={t('common.holzen')} />
          <p className="text-sm">{t('auth.checkEmailReset')}</p>
          <button type="button" onClick={() => { setResetSent(false); setView('sign-in'); }} className="text-muted-foreground underline text-sm font-sans">{t('auth.backToSignIn')}</button>
        </div>
      </div>
    );
  }

  if (view === 'forgot-password') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <PageHeading title={t('common.holzen')} subtitle={t('auth.resetYourPassword')} />
          <form
            action={forgotFormAction}
            onSubmit={() => setError(null)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="auth-forgot-email" className="text-base font-sans">{t('auth.email')}</Label>
              <Input
                id="auth-forgot-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="font-mono text-sm"
              />
            </div>
            {error && <p className="text-xs text-destructive font-mono">{error}</p>}
            <LoadingButton type="submit" className="w-full text-base font-sans font-normal" loading={forgotPending}>{t('auth.sendResetLink')}</LoadingButton>
          </form>
          <button type="button" onClick={() => setView('sign-in')} className="text-muted-foreground underline text-sm font-sans w-full text-center">{t('auth.backToSignIn')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <Link
        to="/welcome"
        aria-label="Close"
        className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-5 w-5" />
      </Link>
      <div className="w-full max-w-sm space-y-8">
        <header className="space-y-3">
          <h1 className="text-sm font-mono tracking-[0.25em] uppercase" style={{ color: '#DBB366' }}>Holzen</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {view === 'sign-up' ? t('auth.createAnAccount') : t('auth.signInToContinue')}
          </p>
        </header>

        <LoadingButton variant="outline" className="w-full text-base font-sans font-normal" onClick={handleGoogle} loading={isGooglePending}>
          {t('auth.continueWithGoogle')}
        </LoadingButton>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-muted-foreground text-base font-sans">{t('auth.or')}</span>
          <Separator className="flex-1" />
        </div>

        <form
          action={emailAuthFormAction}
          onSubmit={() => setError(null)}
          className="space-y-4"
        >
          <input type="hidden" name="intent" value={view} />
          <div className="space-y-2">
            <Label htmlFor="auth-email" className="text-base font-sans">{t('auth.email')}</Label>
            <Input
              id="auth-email"
              name="email"
              type="email"
              autoComplete={view === 'sign-up' ? 'email' : 'username'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="auth-password" className="text-base font-sans">{t('auth.password')}</Label>
              {view === 'sign-in' && (
                <button type="button" onClick={() => setView('forgot-password')} className="text-muted-foreground underline text-sm font-sans">
                  {t('auth.forgotPassword')}
                </button>
              )}
            </div>
            <Input
              id="auth-password"
              name="password"
              type="password"
              autoComplete={view === 'sign-up' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={view === 'sign-up' ? 8 : 6}
              {...(view === 'sign-up' && { pattern: '(?=.*[A-Za-z])(?=.*\\d).{8,}' })}
              className="font-mono text-sm"
            />
            {view === 'sign-up' && (
              <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
                <Info className="h-3 w-3 mt-0.5 shrink-0" aria-hidden="true" />
                <span>Must be at least 8 characters and include a letter and a number.</span>
              </p>
            )}
          </div>
          {error && <p className="text-xs text-destructive font-mono">{error}</p>}
          <LoadingButton type="submit" className="w-full text-base font-sans font-normal" loading={emailAuthPending}>
            {view === 'sign-up' ? t('common.signUp') : t('common.signIn')}
          </LoadingButton>
        </form>

        {view === 'sign-up' && (
          <p className="text-center leading-relaxed text-sm font-sans text-muted-foreground">
            <Trans
              i18nKey="auth.agreeToTerms"
              components={{
                terms: <Link to="/terms" className="underline underline-offset-2 hover:text-foreground transition-colors" />,
                privacy: <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors" />,
              }}
            />
          </p>
        )}

        <button type="button" onClick={toggleSignUpSignIn} className="underline w-full text-center text-base font-sans text-nox-text-link hover:text-nox-text-link/80">
          {view === 'sign-up' ? t('auth.alreadyHaveAccount') : t('auth.createAnAccount')}
        </button>
      </div>
    </div>
  );
};

export default AuthScreen;
