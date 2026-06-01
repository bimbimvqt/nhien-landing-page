import * as React from "react";

import { cn } from "@/lib/utils";

const SeraCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-[1.75rem] border border-sera-ink/10 bg-sera-surface shadow-[0_24px_70px_-48px_rgba(39,32,28,0.85)]",
        className,
      )}
      {...props}
    />
  ),
);
SeraCard.displayName = "SeraCard";

const SeraCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6", className)} {...props} />
  ),
);
SeraCardContent.displayName = "SeraCardContent";

export { SeraCard, SeraCardContent };
