import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { writingTextareaClassName } from '@/features/pause/public';

interface WritingFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  /** Minimum rows when inline */
  minRows?: number;
  /** Auto-focus the textarea */
  autoFocus?: boolean;
  /** Additional class for the inline wrapper */
  className?: string;
  /** Disable focus mode (e.g. inside immersive screens that are already focused) */
  disableFocusMode?: boolean;
  /** Custom style overrides for the textarea (used in immersive screens) */
  textareaStyle?: React.CSSProperties;
  /** Custom class for the textarea element */
  textareaClassName?: string;
}

export function WritingField({
  value,
  onChange,
  placeholder,
  maxLength,
  minRows = 3,
  autoFocus = false,
  className,
  disableFocusMode = false,
  textareaStyle,
  textareaClassName,
}: WritingFieldProps) {
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inlineRef = useRef<HTMLDivElement>(null);

  // Track if user typed anything (for subtle animation)
  const hasContent = value.trim().length > 0;

  const openFocusMode = useCallback(() => {
    if (disableFocusMode) return;
    setFocused(true);
    // Lock body scroll
    document.body.style.overflow = 'hidden';
  }, [disableFocusMode]);

  const closeFocusMode = useCallback(() => {
    setFocused(false);
    document.body.style.overflow = '';
  }, []);

  // Cleanup scroll lock on unmount
  useEffect(() => {
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Auto-focus when entering focus mode
  useEffect(() => {
    if (focused && textareaRef.current) {
      // Small delay to let animation start
      const t = setTimeout(() => textareaRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [focused]);

  // Inline textarea (clickable to open focus mode when focus mode is enabled)
  const inlineTextarea = (
    <div ref={inlineRef} className={cn('relative group', className)}>
      <textarea
        ref={disableFocusMode ? textareaRef : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={!disableFocusMode ? openFocusMode : undefined}
        placeholder={placeholder}
        maxLength={maxLength}
        autoFocus={autoFocus && disableFocusMode}
        rows={minRows}
        readOnly={!disableFocusMode}
        className={cn(
          writingTextareaClassName,
          !disableFocusMode && 'cursor-pointer focus:ring-0 focus-visible:ring-0',
          textareaClassName,
        )}
        style={textareaStyle}
      />
      {maxLength && (
        <p className={cn(
          'text-[10px] font-mono text-muted-foreground/30 text-right mt-1 transition-opacity',
          hasContent ? 'opacity-100' : 'opacity-0',
        )}>
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );

  if (disableFocusMode) return inlineTextarea;

  return (
    <>
      {inlineTextarea}

      {/* Focus mode overlay */}
      <AnimatePresence>
        {focused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex flex-col"
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-background/98 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Ambient glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                className="absolute w-96 h-96 rounded-full opacity-[0.03]"
                style={{
                  background: 'radial-gradient(circle, hsl(var(--primary)), transparent)',
                  top: '5%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>

            {/* Close button */}
            <div className="relative z-10 flex items-center justify-end p-4">
              <button
                onClick={closeFocusMode}
                className="p-2.5 rounded-full bg-muted/40 hover:bg-muted/60 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Writing area */}
            <div className="relative z-10 flex-1 flex flex-col items-center px-6 pb-6 max-w-lg mx-auto w-full">
              {/* Prompt / placeholder as subtle header */}
              {placeholder && (
                <motion.p
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                  className="text-[10px] font-mono text-muted-foreground/30 tracking-[0.15em] uppercase text-center mb-6 max-w-[280px] leading-relaxed"
                >
                  {placeholder}
                </motion.p>
              )}

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="flex-1 w-full"
              >
                <textarea
                  ref={textareaRef}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  maxLength={maxLength}
                  placeholder=""
                  className={cn(
                    'w-full h-full bg-transparent border-none',
                    'text-base leading-[2] text-foreground/85 placeholder:text-muted-foreground/20',
                    'resize-none focus:outline-none',
                    'font-[system-ui,_-apple-system,_sans-serif]',
                    textareaClassName,
                  )}
                  style={textareaStyle}
                />
              </motion.div>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="w-full flex items-center justify-between pt-3 border-t border-border/20"
              >
                {maxLength ? (
                  <p className="text-[10px] font-mono text-muted-foreground/25">
                    {value.length}/{maxLength}
                  </p>
                ) : (
                  <div />
                )}
                <button
                  onClick={closeFocusMode}
                  className="text-[10px] font-sans font-medium text-nox-text-link/70 hover:text-nox-text-link transition-colors tracking-wide uppercase"
                >
                  Done
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
