"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type SeraMagicCardProps = React.HTMLAttributes<HTMLDivElement> & {
  glowSize?: number;
};

function SeraMagicCard({
  className,
  children,
  glowSize = 360,
  onMouseMove,
  onMouseLeave,
  ...props
}: SeraMagicCardProps) {
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      className={cn(
        "group/magic relative overflow-hidden rounded-[1.75rem] p-px transition-all duration-300",
        className,
      )}
      onMouseMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        setMousePosition({
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        });
        setIsHovered(true);
        onMouseMove?.(event);
      }}
      onMouseLeave={(event) => {
        setIsHovered(false);
        onMouseLeave?.(event);
      }}
      style={{
        background: isHovered
          ? `radial-gradient(${glowSize}px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(184,67,43,0.9), rgba(96,117,83,0.45), rgba(245,236,222,0.24), transparent 72%)`
          : "rgba(39,32,28,0.1)",
      }}
      {...props}
    >
      <div className="absolute inset-px rounded-[calc(1.75rem-1px)] bg-sera-surface" />
      <div className="relative h-full rounded-[calc(1.75rem-1px)] bg-sera-surface shadow-[0_24px_70px_-48px_rgba(39,32,28,0.85)] transition-transform duration-300 group-hover/magic:-translate-y-1">
        {children}
      </div>
    </div>
  );
}

export { SeraMagicCard };
