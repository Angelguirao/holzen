import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

type AuthView = 'sign-in' | 'sign-up' | 'forgot-password';

const Auth = () => {
  const [view, setView] = useState<AuthView>('sign-in');
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
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?type=recovery`,
      });
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
    const { error } = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (error) setError(error.message);
  };

  if (confirmSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <h1 className="text-sm font-mono tracking-widest uppercase text-muted-foreground">Holzen</h1>
          <p className="text-sm">Check your email to confirm your account.</p>
          <button
            onClick={() => setConfirmSent(false)}
            className="text-xs font-mono text-muted-foreground underline"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (resetSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <h1 className="text-sm font-mono tracking-widest uppercase text-muted-foreground">Holzen</h1>
          <p className="text-sm">Check your email for a password reset link.</p>
          <button
            onClick={() => { setResetSent(false); setView('sign-in'); }}
            className="text-xs font-mono text-muted-foreground underline"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  if (view === 'forgot-password') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <h1 className="text-sm font-mono tracking-widest uppercase text-muted-foreground">Holzen</h1>
            <p className="text-sm text-muted-foreground">Reset your password</p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-mono">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="font-mono text-sm"
              />
            </div>

            {error && (
              <p className="text-xs text-destructive font-mono">{error}</p>
            )}

            <Button type="submit" className="w-full font-mono text-xs" disabled={loading}>
              Send reset link
            </Button>
          </form>

          <button
            onClick={() => { setView('sign-in'); setError(null); }}
            className="text-xs font-mono text-muted-foreground underline w-full text-center"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2">
          <h1 className="text-sm font-mono tracking-widest uppercase text-muted-foreground">Holzen</h1>
          <p className="text-sm text-muted-foreground">
            {view === 'sign-up' ? 'Create an account' : 'Sign in to continue'}
          </p>
        </div>

        <Button
          variant="outline"
          className="w-full font-mono text-xs"
          onClick={handleGoogle}
        >
          Continue with Google
        </Button>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground font-mono">or</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-mono">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-mono">Password</Label>
              {view === 'sign-in' && (
                <button
                  type="button"
                  onClick={() => { setView('forgot-password'); setError(null); }}
                  className="text-xs font-mono text-muted-foreground underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="font-mono text-sm"
            />
          </div>

          {error && (
            <p className="text-xs text-destructive font-mono">{error}</p>
          )}

          <Button type="submit" className="w-full font-mono text-xs" disabled={loading}>
            {view === 'sign-up' ? 'Create account' : 'Sign in'}
          </Button>
        </form>

        <button
          onClick={() => { setView(view === 'sign-up' ? 'sign-in' : 'sign-up'); setError(null); }}
          className="text-xs font-mono text-muted-foreground underline w-full text-center"
        >
          {view === 'sign-up' ? 'Already have an account' : 'Create an account'}
        </button>
      </div>
    </div>
  );
};

export default Auth;