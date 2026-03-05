import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
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

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2">
          <h1 className="text-sm font-mono tracking-widest uppercase text-muted-foreground">Holzen</h1>
          <p className="text-sm text-muted-foreground">
            {isSignUp ? 'Create an account' : 'Sign in to continue'}
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
            <Label htmlFor="password" className="text-xs font-mono">Password</Label>
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
            {isSignUp ? 'Create account' : 'Sign in'}
          </Button>
        </form>

        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
          className="text-xs font-mono text-muted-foreground underline w-full text-center"
        >
          {isSignUp ? 'Already have an account' : 'Create an account'}
        </button>
      </div>
    </div>
  );
};

export default Auth;
