import { useQuery } from '@tanstack/react-query';
import { Database, RefreshCw } from 'lucide-react';
import {
  getAdminAppliedMigrationsQueryOptions,
  type AppliedMigrationRow,
} from '@/screens/admin/public-queries';

function formatVersion(v: string): string {
  // Supabase migration versions are timestamps like 20260425121947
  if (/^\d{14}$/.test(v)) {
    const y = v.slice(0, 4);
    const mo = v.slice(4, 6);
    const d = v.slice(6, 8);
    const h = v.slice(8, 10);
    const mi = v.slice(10, 12);
    return `${y}-${mo}-${d} ${h}:${mi} UTC`;
  }
  return v;
}

export function MigrationStatus() {
  const {
    data: rows = [],
    isPending,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery(getAdminAppliedMigrationsQueryOptions());

  const latest: AppliedMigrationRow | undefined = rows[0];
  const errorMessage =
    error instanceof Error ? error.message : error != null ? String(error) : 'Failed to load migrations';

  return (
    <div className="rounded-xl border border-border/30 bg-card/20 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-3.5 w-3.5 text-muted-foreground/60" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">
            Migration Status
          </span>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="text-[10px] font-mono text-muted-foreground/60 hover:text-foreground inline-flex items-center gap-1 disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {isError && (
        <p className="text-[10px] font-mono text-destructive">{errorMessage}</p>
      )}

      {!isError && latest && (
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground/60">Last applied</p>
          <p className="text-sm font-mono text-foreground">{formatVersion(latest.version)}</p>
          {latest.name && (
            <p className="text-[10px] font-mono text-muted-foreground/70 truncate">{latest.name}</p>
          )}
        </div>
      )}

      {!isError && rows.length > 1 && (
        <details className="text-[10px] font-mono text-muted-foreground/60">
          <summary className="cursor-pointer hover:text-foreground">
            Recent ({rows.length})
          </summary>
          <ul className="mt-2 space-y-1 max-h-64 overflow-auto">
            {rows.map((r) => (
              <li key={r.version} className="flex justify-between gap-3 border-b border-border/10 py-1">
                <span className="text-muted-foreground/80">{formatVersion(r.version)}</span>
                <span className="text-muted-foreground/50 truncate">{r.name || '—'}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {!isError && !isPending && rows.length === 0 && (
        <p className="text-[10px] font-mono text-muted-foreground/50">No migrations recorded.</p>
      )}

      <p className="text-[9px] text-muted-foreground/40">
        Reads <code>supabase_migrations.schema_migrations</code>. Each row = one applied migration via the GitHub sync pipeline.
      </p>
    </div>
  );
}
