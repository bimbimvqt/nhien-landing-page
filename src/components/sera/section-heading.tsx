import * as React from "react";

import { cn } from "@/lib/utils";
import { SeraBadge } from "./badge";

type SeraSectionHeadingProps = {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
};

function SeraSectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SeraSectionHeadingProps) {
  return (
    <div
      className={cn(
        "space-y-5",
        align === "center" && "mx-auto max-w-3xl text-center",
        className,
      )}
    >
      <SeraBadge>{eyebrow}</SeraBadge>
      <h2 className="text-4xl font-bold leading-tight text-sera-ink md:text-5xl">
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "text-base leading-8 text-sera-muted md:text-lg",
            align === "center" && "mx-auto max-w-2xl",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}

export { SeraSectionHeading };
