import * as React from "react";
import Link from "next/link";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

const seraButtonVariants = cva(
  "group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sera-ember/30 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-sera-deep text-white shadow-[0_18px_45px_-22px_rgba(39,32,28,0.8)] hover:bg-sera-ember hover:shadow-[0_18px_45px_-20px_rgba(184,67,43,0.7)]",
        accent:
          "bg-sera-ember text-white shadow-[0_18px_45px_-22px_rgba(184,67,43,0.75)] hover:bg-sera-deep",
        light:
          "border border-white/25 bg-white/12 text-white backdrop-blur-md hover:bg-white/22",
        outline:
          "border border-sera-ink/15 bg-sera-surface text-sera-ink hover:border-sera-ember/35 hover:bg-sera-cream",
        ghost: "text-sera-ink hover:bg-sera-cream",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-5",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10 px-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type BaseProps = VariantProps<typeof seraButtonVariants> & {
  asChild?: boolean;
  arrow?: boolean;
};

type SeraButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & BaseProps;

const SeraButton = React.forwardRef<HTMLButtonElement, SeraButtonProps>(
  ({ className, variant, size, asChild = false, arrow = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const content =
      asChild && !arrow
        ? children
        : arrow && React.isValidElement<{ children?: React.ReactNode }>(children)
        ? React.cloneElement(children, {
            children: (
              <>
                {children.props.children}
                <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </>
            ),
          })
        : (
            <>
              {children}
              {arrow && (
                <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
              )}
            </>
          );

    return (
      <Comp
        ref={ref}
        className={cn(seraButtonVariants({ variant, size, className }))}
        {...props}
      >
        {content}
      </Comp>
    );
  },
);
SeraButton.displayName = "SeraButton";

type SeraLinkButtonProps = React.ComponentProps<typeof Link> &
  BaseProps & {
    className?: string;
  };

function SeraLinkButton({
  className,
  variant,
  size,
  arrow,
  children,
  ...props
}: SeraLinkButtonProps) {
  return (
    <SeraButton asChild variant={variant} size={size} arrow={arrow} className={className}>
      <Link {...props}>{children}</Link>
    </SeraButton>
  );
}

export { SeraButton, SeraLinkButton, seraButtonVariants };
