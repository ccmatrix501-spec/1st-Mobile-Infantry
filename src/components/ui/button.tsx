import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[background-color,color,border-color,box-shadow,transform,opacity] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-fg hover:bg-primary-dim shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-primary)_45%,transparent),0_8px_24px_color-mix(in_oklab,var(--color-primary)_30%,transparent)] text-sm stencil tracking-[0.1em]",
        secondary:
          "bg-surface text-fg border border-border-strong hover:bg-surface-hover hover:border-primary/30 text-sm stencil tracking-[0.1em]",
        ghost: "text-muted hover:text-fg hover:bg-surface-hover",
        outline:
          "border border-primary/40 text-primary hover:bg-primary/10 hover:border-primary text-sm stencil tracking-[0.1em]",
      },
      size: {
        default: "h-11 px-5 rounded-md",
        sm: "h-9 px-4 rounded-md text-xs",
        lg: "h-12 px-7 rounded-md text-base",
        icon: "h-11 w-11 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";
