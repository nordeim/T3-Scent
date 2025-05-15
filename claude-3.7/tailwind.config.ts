// tailwind.config.ts
import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}", // If using App Router in future
  ],
  theme: {
    container: { // Optional: Configure default container padding
      center: true,
      padding: "1rem", // Default padding
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          // From original doc, can be mapped to HSL vars or kept as direct values
          light: "#4fd1c5", // Consider if this is needed or if primary variants are enough
          dark: "#1a5b68",  // Consider if this is needed
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          // From original doc
          light: "#f6ad55",
          dark: "#c67c3e",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: { // CTA colors from original, mapped to 'accent' for Shadcn/ui
          DEFAULT: "hsl(var(--accent))", // Was cta.DEFAULT "#ff7b4f"
          foreground: "hsl(var(--accent-foreground))",
          light: "#ff8c69",
          dark: "#e25c39",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Custom colors from original theme:
        // primary: { DEFAULT: "#2a7c8a", light: "#4fd1c5", dark: "#1a5b68" },
        // accent (original): { DEFAULT: "#e0a86f", light: "#f6ad55", dark: "#c67c3e" },
        // cta (original): { DEFAULT: "#ff7b4f", light: "#ff8c69", dark: "#e25c39" },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
        // Example: if you add a display font
        // display: ["var(--font-display)", ...fontFamily.sans],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        fadeOut: { "0%": { opacity: "1" }, "100%": { opacity: "0" } },
        slideInRight: { "0%": { transform: "translateX(100%)", opacity: "0" }, "100%": { transform: "translateX(0)", opacity: "1" } },
        slideInLeft: { "0%": { transform: "translateX(-100%)", opacity: "0" }, "100%": { transform: "translateX(0)", opacity: "1" } },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        fadeIn: "fadeIn 0.5s ease-in-out",
        fadeOut: "fadeOut 0.5s ease-in-out",
        slideInRight: "slideInRight 0.5s ease-in-out",
        slideInLeft: "slideInLeft 0.5s ease-in-out",
        shimmer: "shimmer 2s infinite linear",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"), // Commonly used with Shadcn/ui
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
} satisfies Config;