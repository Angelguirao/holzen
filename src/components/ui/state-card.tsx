import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const stateCardVariants = cva("rounded-lg border p-4", {
  variants: {
    state: {
      default: "border-border bg-card text-card-foreground",
      success: "border-primary/30 bg-primary/10 text-foreground",
      warning: "border-secondary bg-secondary/40 text-foreground",
      error: "border-destructive/40 bg-destructive/10 text-foreground",
    },
  },
  defaultVariants: {
    state: "default",
  },
});

export interface StateCardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof stateCardVariants> {
  title: string;
  description?: string;
}

export function StateCard({ className, state, title, description, children, ...props }: StateCardProps) {
  return (
    <div className={cn(stateCardVariants({ state }), className)} {...props}>
      <h4 className="text-sm font-semibold">{title}</h4>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

