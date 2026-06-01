import * as React from "react";

import { cn } from "@/lib/utils";

type SeraBadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "light" | "warm" | "dark";
};

function SeraBadge({ className, tone = "warm", ...props }: SeraBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]",
        tone === "warm" &&
          "border-sera-ember/15 bg-sera-ember/10 text-sera-ember",
        tone === "light" && "border-white/25 bg-white/12 text-white backdrop-blur-md",
        tone === "dark" && "border-sera-ink/15 bg-sera-ink/5 text-sera-ink",
        className,
      )}
      {...props}
    />
  );
}

export { SeraBadge };
