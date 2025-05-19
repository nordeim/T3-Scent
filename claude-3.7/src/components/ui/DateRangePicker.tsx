// src/components/ui/DateRangePicker.tsx
"use client";

import * as React from "react";
import { cn } from "~/lib/utils";
import { DatePicker, type DatePickerProps } from "./DatePicker"; // Uses your DatePicker component

// This is a VERY basic placeholder for a DateRangePicker.
// A full implementation often uses react-day-picker with range selection.

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  className?: string;
  disabled?: boolean;
  // calendarProps?: any; // For passing props to an underlying calendar library
}

const DateRangePicker = ({ value, onChange, className, disabled }: DateRangePickerProps) => {
  const handleFromChange = (date: Date | null) => {
    if (onChange) {
      onChange({ from: date, to: value?.to ?? null });
    }
  };

  const handleToChange = (date: Date | null) => {
    if (onChange) {
      onChange({ from: value?.from ?? null, to: date });
    }
  };

  return (
    <div className={cn("flex flex-col sm:flex-row gap-2 items-center", className)}>
      <DatePicker
        value={value?.from}
        onChange={handleFromChange}
        placeholder="Start date"
        disabled={disabled}
        className="w-full sm:w-auto"
        aria-label="Start date"
      />
      <span className="text-muted-foreground hidden sm:inline">-</span>
      <DatePicker
        value={value?.to}
        onChange={handleToChange}
        placeholder="End date"
        disabled={disabled}
        className="w-full sm:w-auto"
        aria-label="End date"
      />
    </div>
  );
};
DateRangePicker.displayName = "DateRangePicker";

export { DateRangePicker };
