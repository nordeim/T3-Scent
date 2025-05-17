// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names into a single string,
 * merging Tailwind CSS classes intelligently.
 * @param inputs - An array of class values (strings, objects, arrays).
 * @returns A string of combined and merged class names.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// You can add other general utility functions here.
// For example, a utility to generate slugs (if not using a library):
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-"); // Replace multiple - with single -
}

// Delay function (useful for simulating network latency or debouncing)
export const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
