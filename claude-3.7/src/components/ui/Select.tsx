// src/components/ui/Select.tsx
"use client";

import * as React from "react";
import { cn } from "~/lib/utils";
import { FaChevronDown } from "react-icons/fa";

// This is a VERY simplified Select component placeholder.
// A production-ready Select (like Shadcn/ui's) would use Radix UI Select for accessibility and functionality.

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  placeholder?: string;
  // For a custom styled trigger if not using native select:
  // onValueChange?: (value: string) => void;
  // value?: string;
  // buttonClassName?: string; // if using a custom trigger button
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, ...props }, ref) => {
    return (
      <div className={cn("relative w-full", className)}>
        <select
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none",
            // props.buttonClassName // Only if this select is a custom styled one
          )}
          ref={ref}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };

// Note: A full Shadcn/ui style Select would be much more complex:
// import * as SelectPrimitive from "@radix-ui/react-select";
// const SelectTrigger = React.forwardRef<...>(({ className, children, ...props }, ref) => (
//   <SelectPrimitive.Trigger ref={ref} className={cn(...)} {...props}>
//     {children}
//     <SelectPrimitive.Icon asChild><FaChevronDown ... /></SelectPrimitive.Icon>
//   </SelectPrimitive.Trigger>
// ));
// const SelectContent = React.forwardRef<...>(({ className, children, position="popper", ...props }, ref) => (
//   <SelectPrimitive.Portal>
//     <SelectPrimitive.Content ref={ref} className={cn(...)} position={position} {...props}>
//       <SelectPrimitive.Viewport className={cn(...)}>{children}</SelectPrimitive.Viewport>
//     </SelectPrimitive.Content>
//   </SelectPrimitive.Portal>
// ));
// etc. for Item, Label, Separator...
// export { SelectRoot: SelectPrimitive.Root, SelectValue: SelectPrimitive.Value, SelectTrigger, SelectContent, ... }