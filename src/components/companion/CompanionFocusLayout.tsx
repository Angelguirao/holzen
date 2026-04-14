import { ArrowLeft } from 'lucide-react';

interface Props {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}

/** Full-screen companion “chapter” — no bottom nav (matches /pause routing). */
export function CompanionFocusLayout({ title, onBack, children }: Props) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border/30">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-sm font-semibold tracking-tight text-foreground truncate flex-1">{title}</h1>
      </header>
      <main className="flex-1 overflow-y-auto px-4 py-6 w-full max-w-lg mx-auto">{children}</main>
    </div>
  );
}
