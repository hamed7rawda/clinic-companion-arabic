import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full rounded-md border border-input bg-background ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
  {
    variants: {
      inputSize: {
        sm: "h-9 text-sm file:text-xs",
        default: "h-10 text-base md:text-sm file:text-sm",
        lg: "h-12 text-base file:text-base",
      },
    },
    defaultVariants: {
      inputSize: "default",
    },
  },
);

// Per-size paddings (logical properties so RTL/LTR flip automatically).
// Gutter scales with input size so the icon never crowds the text.
const sizeConfig = {
  sm: {
    base: "py-1.5",
    padX: "px-3",
    padStart: "ps-3",
    padEnd: "pe-3",
    padStartWithIcon: "ps-9",
    padEndWithIcon: "pe-9",
    iconStart: "ps-2.5",
    iconEnd: "pe-2.5",
    icon: "h-3.5 w-3.5",
  },
  default: {
    base: "py-2",
    padX: "px-3",
    padStart: "ps-3",
    padEnd: "pe-3",
    padStartWithIcon: "ps-10",
    padEndWithIcon: "pe-10",
    iconStart: "ps-3",
    iconEnd: "pe-3",
    icon: "h-4 w-4",
  },
  lg: {
    base: "py-2.5",
    padX: "px-4",
    padStart: "ps-4",
    padEnd: "pe-4",
    padStartWithIcon: "ps-12",
    padEndWithIcon: "pe-12",
    iconStart: "ps-3.5",
    iconEnd: "pe-3.5",
    icon: "h-5 w-5",
  },
} as const;

export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof inputVariants> {
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, startIcon, endIcon, inputSize, ...props }, ref) => {
    const sz = sizeConfig[inputSize ?? "default"];

    if (startIcon || endIcon) {
      return (
        <div className="relative w-full">
          {startIcon && (
            <span
              className={cn(
                "pointer-events-none absolute inset-y-0 start-0 flex items-center text-muted-foreground [&>svg]:shrink-0",
                sz.iconStart,
                `[&>svg]:${sz.icon}`,
              )}
            >
              <span className={cn("inline-flex", sz.icon, "[&>svg]:h-full [&>svg]:w-full")}>
                {startIcon}
              </span>
            </span>
          )}
          <input
            type={type}
            className={cn(
              inputVariants({ inputSize }),
              sz.base,
              startIcon ? sz.padStartWithIcon : sz.padStart,
              endIcon ? sz.padEndWithIcon : sz.padEnd,
              className,
            )}
            ref={ref}
            {...props}
          />
          {endIcon && (
            <span
              className={cn(
                "pointer-events-none absolute inset-y-0 end-0 flex items-center text-muted-foreground",
                sz.iconEnd,
              )}
            >
              <span className={cn("inline-flex", sz.icon, "[&>svg]:h-full [&>svg]:w-full")}>
                {endIcon}
              </span>
            </span>
          )}
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(inputVariants({ inputSize }), sz.base, sz.padX, className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input, inputVariants };
