import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

const CHANGELOG = [
  {
    version: '1.1.0',
    date: 'March 2026',
    changes: [
      'New 3-tab layout: Home, History, Settings',
      'Favorite reflections with star bookmark',
      'Export your data as JSON',
      'Delete account option',
      '3 free reflections before subscribing',
      'In-app changelog',
    ],
  },
  {
    version: '1.0.0',
    date: 'February 2026',
    changes: [
      'AI-generated reflections on BTC volatility',
      'Adjustable volatility threshold',
      'Email and push notifications',
      'Reflection history with sharing',
      'Referral program with rewards',
      'Dark mode support',
    ],
  },
];

export function Changelog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-mono text-muted-foreground underline"
      >
        What's new
      </button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono text-sm">Changelog</AlertDialogTitle>
            <AlertDialogDescription className="sr-only">Version history</AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-6">
            {CHANGELOG.map((entry) => (
              <div key={entry.version} className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-mono font-medium">v{entry.version}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{entry.date}</span>
                </div>
                <ul className="space-y-1">
                  {entry.changes.map((change, i) => (
                    <li key={i} className="text-xs text-muted-foreground leading-relaxed">
                      · {change}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <AlertDialogFooter>
            <AlertDialogAction className="font-mono text-xs">Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
