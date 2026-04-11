import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const tagVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      state: {
        default: "border-input bg-background text-muted-foreground",
        selected: "border-transparent bg-primary/15 text-foreground",
      },
    },
    defaultVariants: {
      state: "default",
    },
  },
);

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof tagVariants> {}

export function Tag({ className, state, ...props }: TagProps) {
  return <span className={cn(tagVariants({ state }), className)} {...props} />;
}

