import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

const COOKIE_KEY = 'holzen_cookie_consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(COOKIE_KEY);
    if (!accepted) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, 'true');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-4 left-4 right-4 z-[60] flex justify-center pointer-events-none"
        >
          <div className="pointer-events-auto w-full max-w-md bg-card border border-border rounded-sm p-4 shadow-lg flex items-start gap-4">
            <p className="text-[11px] font-mono text-muted-foreground leading-relaxed flex-1">
              This site uses essential cookies for authentication only. No tracking. See our{' '}
              <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors">
                Privacy Policy
              </Link>.
            </p>
            <Button
              onClick={accept}
              variant="outline"
              size="sm"
              className="font-mono text-[10px] h-6 px-3 shrink-0"
            >
              Got it
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
