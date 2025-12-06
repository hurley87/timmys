import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-timmys-red focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-timmys-cream shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-timmys-red text-white hover:bg-timmys-red-dark active:scale-95",
        outline:
          "border-2 border-timmys-red bg-transparent text-timmys-red hover:bg-timmys-red/10 active:scale-95",
        ghost: "bg-transparent text-timmys-brown hover:bg-timmys-red/10 hover:text-timmys-red",
        destructive: "bg-red-600 text-white hover:bg-red-700 active:scale-95",
      },
      size: {
        default: "h-10 px-4 py-2 rounded-timmys",
        sm: "h-9 px-3 rounded-timmys text-xs",
        lg: "h-12 px-8 rounded-timmys-lg text-base",
        icon: "h-10 w-10 rounded-timmys",
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

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
