// src/components/ui/Input.tsx
"use client"; // Generally, form inputs might have client-side aspects or be used in client components

import * as React from "react";
import { cn } from "~/lib/utils"; // For Tailwind class merging

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // You can add custom props here if needed, e.g., error states, icons
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leftIcon, rightIcon, ...props }, ref) => {
    const hasLeftIcon = !!leftIcon;
    const hasRightIcon = !!rightIcon;

    return (
      <div className={cn("relative flex items-center w-full", className)}>
        {hasLeftIcon && (
          <span className="absolute left-3 inline-flex items-center justify-center text-muted-foreground">
            {leftIcon}
          </span>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            hasLeftIcon && "pl-10", // Add padding if left icon exists
            hasRightIcon && "pr-10"  // Add padding if right icon exists
            // className // User-provided className should override default padding if necessary, or be applied to wrapper.
            // For direct input styling, apply className here. If wrapper needs styling, apply to the div.
            // Let's keep className on the input for direct styling, but wrapper might need its own prop.
          )}
          ref={ref}
          {...props}
        />
        {hasRightIcon && (
          <span className="absolute right-3 inline-flex items-center justify-center text-muted-foreground">
            {rightIcon}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };