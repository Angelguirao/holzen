import * as React from "react";
import { cn } from "@/lib/utils";

export interface NoxHeaderMainProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
}

export function NoxHeaderMain({ title, subtitle, rightSlot, className, ...props }: NoxHeaderMainProps) {
  return (
    <header className={cn("flex items-start justify-between border-b border-border pb-4", className)} {...props}>
      <div>
        <h1 className="font-editorial text-2xl tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {rightSlot}
    </header>
  );
}

export interface NoxHeaderModalProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  description?: string;
}

export function NoxHeaderModal({ title, description, className, ...props }: NoxHeaderModalProps) {
  return (
    <header className={cn("space-y-1 border-b border-border pb-3", className)} {...props}>
      <h2 className="text-lg font-semibold">{title}</h2>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </header>
  );
}

