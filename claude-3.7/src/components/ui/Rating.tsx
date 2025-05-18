// src/components/ui/Rating.tsx
"use client";

import React, { useState } from 'react';
import { FaStar, FaRegStar, FaStarHalfAlt } from 'react-icons/fa';
import { cn } from '~/lib/utils';

interface RatingProps {
  value: number; // The current rating value (e.g., 3.5)
  count?: number; // Total number of stars (e.g., 5)
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; // Size of the stars
  color?: string; // Tailwind color class for filled stars (e.g., 'text-yellow-400')
  readOnly?: boolean;
  onChange?: (value: number) => void;
  className?: string;
  showValue?: boolean | "fraction"; // Whether to show the numeric value next to stars, or as fraction e.g. 3.5/5
  precision?: 0.5 | 1; // Rating precision, 0.5 for half stars, 1 for full stars
}

export const Rating: React.FC<RatingProps> = ({
  value,
  count = 5,
  size = 'md',
  color = 'text-yellow-400',
  readOnly = true,
  onChange,
  className,
  showValue = false,
  precision = 0.5, // Default to allowing half-star precision in display
}) => {
  const [hoverValue, setHoverValue] = useState<number | undefined>(undefined);

  const starsToRender = Array.from({ length: count }, (_, i) => i + 1);

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
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
  }[size];

  return (
    <div className={cn("flex items-center gap-0.5", className)} 
         onMouseLeave={handleMouseLeave}
         role={readOnly ? undefined : "slider"}
         aria-valuenow={readOnly ? undefined : value}
         aria-valuemin={readOnly ? undefined : 0}
         aria-valuemax={readOnly ? undefined : count}
         aria-label={readOnly ? `Rating: ${value} out of ${count} stars` : "Interactive star rating"}
         tabIndex={readOnly ? undefined : 0}
         onKeyDown={(e) => {
            if (!readOnly && onChange) {
                if (e.key === 'ArrowRight' && value < count) onChange(value + (precision === 0.5 ? 0.5 : 1));
                if (e.key === 'ArrowLeft' && value > 0) onChange(value - (precision === 0.5 ? 0.5 : 1));
            }
         }}
    >
      {starsToRender.map((starValue) => {
        const displayValue = hoverValue ?? value;
        let StarIcon = FaRegStar;

        if (precision === 0.5) {
            if (displayValue >= starValue) {
                StarIcon = FaStar;
            } else if (displayValue >= starValue - 0.5) {
                StarIcon = FaStarHalfAlt;
            }
        } else { // precision is 1
            if (displayValue >= starValue) {
                StarIcon = FaStar;
            }
        }
        
        return (
          <button
            type="button"
            key={starValue}
            className={cn(
              "p-0.5", // Add some padding for easier clicking/hovering
              !readOnly && 'cursor-pointer transition-transform hover:scale-125 focus:scale-110 focus:outline-none focus:ring-1 focus:ring-ring rounded-sm'
            )}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            disabled={readOnly}
            aria-label={readOnly ? undefined : `Set rating to ${starValue} star${starValue > 1 ? 's' : ''}`}
          >
            <StarIcon
              className={cn(
                starSizeClass,
                (precision === 0.5 ? (displayValue >= starValue - 0.5) : (displayValue >= starValue)) 
                    ? color 
                    : 'text-gray-300 dark:text-gray-600'
              )}
            />
          </button>
        );
      })}
      {showValue && (
        <span className={cn("ml-2 text-sm font-medium text-muted-foreground", `text-${size}`)}>
            {value.toFixed(1)}
            {showValue === "fraction" && `/${count}`}
        </span>
      )}
    </div>
  );
};