import { cn } from "@/lib/utils";

type LayoutSpacingType = "xs" | "s" | "m" | "l";

const heightByType: Record<LayoutSpacingType, string> = {
  xs: "h-2",
  s: "h-4",
  m: "h-6",
  l: "h-8",
};

export function LayoutSpacing({ type, className }: { type: LayoutSpacingType; className?: string }) {
  return <div aria-hidden className={cn("w-full", heightByType[type], className)} />;
}

