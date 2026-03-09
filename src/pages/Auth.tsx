import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';

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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (view === 'sign-up') {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        setConfirmSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: any) {
      setError(e.message);
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
    } catch (e: any) {
      setError(e.message);
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
          <h1 className="text-sm font-mono tracking-widest uppercase text-muted-foreground">{t('common.holzen')}</h1>
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
          <h1 className="text-sm font-mono tracking-widest uppercase text-muted-foreground">{t('common.holzen')}</h1>
          <p className="text-sm">{t('auth.checkEmailReset')}</p>
          <button onClick={() => { setResetSent(false); setView('sign-in'); }} className="text-xs font-mono text-muted-foreground underline">{t('auth.backToSignIn')}</button>
        </div>
      </div>
    );
  }

  if (view === 'forgot-password') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <h1 className="text-sm font-mono tracking-widest uppercase text-muted-foreground">{t('common.holzen')}</h1>
            <p className="text-sm text-muted-foreground">{t('auth.resetYourPassword')}</p>
          </div>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-mono">{t('auth.email')}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="font-mono text-sm" />
            </div>
            {error && <p className="text-xs text-destructive font-mono">{error}</p>}
            <Button type="submit" className="w-full font-mono text-xs" disabled={loading}>{t('auth.sendResetLink')}</Button>
          </form>
          <button onClick={() => { setView('sign-in'); setError(null); }} className="text-xs font-mono text-muted-foreground underline w-full text-center">{t('auth.backToSignIn')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2">
          <h1 className="text-sm font-mono tracking-widest uppercase text-muted-foreground">{t('common.holzen')}</h1>
          <p className="text-sm text-muted-foreground">
            {view === 'sign-up' ? t('auth.createAnAccount') : t('auth.signInToContinue')}
          </p>
        </div>

        <Button variant="outline" className="w-full font-mono text-xs" onClick={handleGoogle}>
          {t('auth.continueWithGoogle')}
        </Button>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground font-mono">{t('auth.or')}</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-mono">{t('auth.email')}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="font-mono text-sm" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-mono">{t('auth.password')}</Label>
              {view === 'sign-in' && (
                <button type="button" onClick={() => { setView('forgot-password'); setError(null); }} className="text-xs font-mono text-muted-foreground underline">
                  {t('auth.forgotPassword')}
                </button>
              )}
            </div>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="font-mono text-sm" />
          </div>
          {error && <p className="text-xs text-destructive font-mono">{error}</p>}
          <Button type="submit" className="w-full font-mono text-xs" disabled={loading}>
            {view === 'sign-up' ? t('common.signUp') : t('common.signIn')}
          </Button>
        </form>

        {view === 'sign-up' && (
          <p className="text-[10px] font-mono text-muted-foreground/60 text-center leading-relaxed">
            <Trans
              i18nKey="auth.agreeToTerms"
              components={{
                terms: <Link to="/terms" className="underline underline-offset-2 hover:text-foreground transition-colors" />,
                privacy: <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors" />,
              }}
            />
          </p>
        )}

        <button onClick={() => { setView(view === 'sign-up' ? 'sign-in' : 'sign-up'); setError(null); }} className="text-xs font-mono text-muted-foreground underline w-full text-center">
          {view === 'sign-up' ? t('auth.alreadyHaveAccount') : t('auth.createAnAccount')}
        </button>
      </div>
    </div>
  );
};

export default Auth;
