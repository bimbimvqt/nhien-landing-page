import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-sera-ember/25 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-sera-ink text-white shadow hover:bg-sera-ink/90",
        secondary:
          "border-transparent bg-sera-linen text-sera-ink hover:bg-sera-cream",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "border-sera-ink/15 text-sera-ink",
        success: "border-transparent bg-emerald-500 text-white hover:bg-emerald-500/80",
        brand: "border-transparent bg-sera-ember text-white hover:bg-sera-ember/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
