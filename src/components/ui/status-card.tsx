import * as React from "react";
import { cn } from "@/lib/utils";

type StatusTone = "default" | "success" | "warning" | "error";

const toneClasses: Record<StatusTone, string> = {
  default: "border-border bg-card text-card-foreground",
  success: "border-green-500/30 bg-green-500/10 text-foreground",
  warning: "border-yellow-500/30 bg-yellow-500/10 text-foreground",
  error: "border-destructive/40 bg-destructive/10 text-foreground",
};

export interface StatusCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string;
  tone?: StatusTone;
}

export function StatusCard({ label, value, tone = "default", className, ...props }: StatusCardProps) {
  return (
    <div className={cn("rounded-lg border p-3", toneClasses[tone], className)} {...props}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold leading-none">{value}</p>
    </div>
  );
}

