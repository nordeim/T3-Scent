// src/components/ui/ThemeToggle.tsx
"use client"; // Required because it uses client-side hooks (useTheme, useState, useEffect)

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { FaSun, FaMoon } from "react-icons/fa";
import { Button } from "~/components/ui/Button"; // Assuming a Button component exists

export const ThemeToggle = () => {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted on the client to avoid hydration mismatch
  // when determining the initial theme.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine the current effective theme (light or dark)
  const currentTheme = theme === "system" ? systemTheme : theme;

  const toggleTheme = () => {
    setTheme(currentTheme === "dark" ? "light" : "dark");
  };

  // Until mounted, an explicit null return is better than rendering potentially mismatched UI
  if (!mounted) {
    // Render a placeholder or null to avoid hydration errors during SSR vs client render
    // This button will be invisible until mounted and theme is determined.
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 opacity-0" // Placeholder, invisible
        aria-label="Toggle theme"
        disabled
      />
    );
  }

  return (
    <Button
      variant="ghost" // Using a common Button variant
      size="icon"     // For icon-only buttons
      onClick={toggleTheme}
      aria-label={`Switch to ${currentTheme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${currentTheme === "dark" ? "light" : "dark"} mode`} // Tooltip for clarity
    >
      {currentTheme === "dark" ? (
        <FaSun className="h-5 w-5 text-yellow-400 transition-all hover:text-yellow-300" />
      ) : (
        <FaMoon className="h-5 w-5 text-slate-600 transition-all hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};