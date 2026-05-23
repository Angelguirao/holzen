import * as React from "react";

import { cn } from "@/lib/utils";
import { writingTextareaClassName } from "@/components/ui/writing-textarea";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(writingTextareaClassName, "min-h-[88px]", className)}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
