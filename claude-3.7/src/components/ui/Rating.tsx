// src/components/ui/Rating.tsx
"use client";

import React, { useState } from 'react';
import { FaStar, FaRegStar, FaStarHalfAlt } from 'react-icons/fa';
import { cn } from '~/lib/utils';

interface RatingProps {
  value: number; // The current rating value (e.g., 3.5)
  count?: number; // Total number of stars (e.g., 5)
  size?: 'sm' | 'md' | 'lg'; // Size of the stars
  color?: string; // Tailwind color class for filled stars (e.g., 'text-yellow-400')
  readOnly?: boolean;
  onChange?: (value: number) => void;
  className?: string;
  showValue?: boolean; // Whether to show the numeric value next to stars
}

export const Rating: React.FC<RatingProps> = ({
  value,
  count = 5,
  size = 'md',
  color = 'text-yellow-400', // Default star color
  readOnly = true,
  onChange,
  className,
  showValue = false,
}) => {
  const [hoverValue, setHoverValue] = useState<number | undefined>(undefined);

  const stars = Array.from({ length: count }, (_, i) => i + 1);

  const handleClick = (newValue: number) => {
    if (!readOnly && onChange) {
      onChange(newValue);
    }
  };

  const handleMouseEnter = (newValue: number) => {
    if (!readOnly) {
      setHoverValue(newValue);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverValue(undefined);
    }
  };

  const starSizeClass = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }[size];

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {stars.map((starValue) => {
        const effectiveValue = hoverValue ?? value;
        let StarComponent = FaRegStar; // Default to empty star

        if (effectiveValue >= starValue) {
          StarComponent = FaStar; // Full star
        } else if (effectiveValue >= starValue - 0.5) {
          StarComponent = FaStarHalfAlt; // Half star
        }

        return (
          <StarComponent
            key={starValue}
            className={cn(
              starSizeClass,
              effectiveValue >= starValue - 0.5 ? color : 'text-gray-300 dark:text-gray-600',
              !readOnly && 'cursor-pointer transition-transform hover:scale-110'
            )}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            aria-hidden="true" // Individual stars are decorative, overall rating conveyed by value/aria-label
          />
        );
      })}
      {showValue && <span className="ml-2 text-sm font-medium text-muted-foreground">{value.toFixed(1)}</span>}
    </div>
  );
};