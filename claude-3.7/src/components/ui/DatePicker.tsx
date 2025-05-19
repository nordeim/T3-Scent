// src/components/ui/DatePicker.tsx
"use client";

import * as React from "react";
import { cn } from "~/lib/utils";
import { Input } from "./Input"; // Uses your Input component
import { FaCalendarAlt } from "react-icons/fa";

// This is a VERY basic placeholder for a DatePicker.
// A full implementation often uses a library like react-day-picker.

export interface DatePickerProps {
  value?: Date | string | null; // Can be Date object or ISO string
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ value, onChange, placeholder = "Select a date", className, disabled, ...props }, ref) => {
    const [dateString, setDateString] = React.useState<string>("");

    React.useEffect(() => {
      if (value instanceof Date) {
        // Format Date object to YYYY-MM-DD for input type="date"
        setDateString(value.toISOString().split('T')[0] ?? "");
      } else if (typeof value === 'string') {
        // If it's already a string, assume it's in correct format or handle parsing
        setDateString(value.split('T')[0] ?? "");
      } else {
        setDateString("");
      }
    }, [value]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newDateString = event.target.value;
      setDateString(newDateString);
      if (onChange) {
        if (newDateString) {
          const [year, month, day] = newDateString.split('-').map(Number);
          if (year && month && day) {
            // Construct date in UTC to avoid timezone issues with date-only inputs
            onChange(new Date(Date.UTC(year, month - 1, day)));
          } else {
            onChange(null); // Invalid date string
          }
        } else {
          onChange(null); // Empty input
        }
      }
    };

    return (
      // Using a simple HTML5 date input for this stub
      // A full component would use a calendar popover.
      <div className={cn("relative", className)}>
         <Input
            type="date"
            ref={ref}
            value={dateString}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            className="pr-10" // Make space for icon
            {...props} // Spread other HTML input attributes
        />
        <FaCalendarAlt className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
    );
  }
);
DatePicker.displayName = "DatePicker";

export { DatePicker };