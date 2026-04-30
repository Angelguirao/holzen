import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';
import { X, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';
import { checkSignupGate } from '@/lib/signup-gate';
import { NoxHeaderMain } from '@/components/ui/nox-header';

type AuthView = 'sign-in' | 'sign-up' | 'forgot-password';

const Auth = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<AuthView>(() => {
    const v = searchParams.get('view');
    return v === 'sign-up' ? 'sign-up' : 'sign-in';
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : t('common.unexpectedError', { defaultValue: 'Something went wrong' });

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (view === 'sign-up') {
        const gate = await checkSignupGate(supabase);
        if (!gate.allow) {
          if (gate.reason === 'daily_cap') {
            setError(t(
              'auth.signupsDailyCap',
              "Today's signup limit has been reached. Please try again tomorrow.",
            ));
          } else {
            setError(
              t('auth.signupsPaused', { defaultValue: 'Signups are temporarily paused. Please try again later.' }),
            );
          }
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        setConfirmSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
      if (error) throw error;
      setResetSent(true);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    const { error } = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
    if (error) setError(error.message);
  };

  if (confirmSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <NoxHeaderMain title={t('common.holzen')} />
          <p className="text-sm">{t('auth.checkEmailConfirm')}</p>
          <button onClick={() => setConfirmSent(false)} className="text-xs font-mono text-muted-foreground underline">{t('common.back')}</button>
        </div>
      </div>
    );
  }

  if (resetSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <NoxHeaderMain title={t('common.holzen')} />
          <p className="text-sm">{t('auth.checkEmailReset')}</p>
          <button onClick={() => { setResetSent(false); setView('sign-in'); }} className="text-muted-foreground underline text-sm font-sans">{t('auth.backToSignIn')}</button>
        </div>
      </div>
    );
  }

  if (view === 'forgot-password') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <NoxHeaderMain title={t('common.holzen')} subtitle={t('auth.resetYourPassword')} />
          <form onSubmit={handleForgotPassword} className="space-y-4">
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
            <LoadingButton type="submit" className="w-full text-base font-sans font-normal" loading={loading}>{t('auth.sendResetLink')}</LoadingButton>
          </form>
          <button onClick={() => { setView('sign-in'); setError(null); }} className="text-muted-foreground underline text-sm font-sans w-full text-center">{t('auth.backToSignIn')}</button>
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

        <Button variant="outline" className="w-full text-base font-sans font-normal" onClick={handleGoogle}>
          {t('auth.continueWithGoogle')}
        </Button>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-muted-foreground text-base font-sans">{t('auth.or')}</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
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
                <button type="button" onClick={() => { setView('forgot-password'); setError(null); }} className="text-muted-foreground underline text-sm font-sans">
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
          <LoadingButton type="submit" className="w-full text-base font-sans font-normal" loading={loading}>
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

        <button onClick={() => { setView(view === 'sign-up' ? 'sign-in' : 'sign-up'); setError(null); }} className="underline w-full text-center text-base font-sans text-nox-text-link hover:text-nox-text-link/80">
          {view === 'sign-up' ? t('auth.alreadyHaveAccount') : t('auth.createAnAccount')}
        </button>
      </div>
    </div>
  );
};

export default Auth;
