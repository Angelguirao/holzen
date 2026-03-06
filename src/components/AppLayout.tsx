import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function AppLayout() {
  return (
    <div className="min-h-screen flex items-start justify-center p-6 pb-20">
      <div className="w-full max-w-sm pt-4">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-sm font-mono tracking-widest uppercase text-muted-foreground">
            Holzen
          </h1>
        </div>
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
