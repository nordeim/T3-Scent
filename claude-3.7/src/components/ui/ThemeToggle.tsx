// src/components/ui/ThemeToggle.tsx
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { FaSun, FaMoon } from "react-icons/fa";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted on the client to avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    
    // Store preference in localStorage
    localStorage.setItem("theme", theme === "dark" ? "light" : "dark");
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <FaSun className="h-5 w-5 text-yellow-400" />
      ) : (
        <FaMoon className="h-5 w-5 text-primary" />
      )}
    </button>
  );
};