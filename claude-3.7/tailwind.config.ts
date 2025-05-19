// tailwind.config.ts
import { type Config } from "tailwindcss";
// Removed: import defaultTheme from "tailwindcss/defaultTheme"; 
// We'll define fonts directly or use CSS variables set in globals.css

export default {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: { 
      center: true,
      padding: "1rem", 
      screens: {
        sm: "640px", md: "768px", lg: "1024px", xl: "1180px", "2xl": "1440px", // Adjusted container widths
      },
    },
    extend: {
      colors: { // These now reference the CSS variables defined in globals.css
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Direct CSS variable usage from sample_landing_page.html if not using HSL for everything:
        // 'html-bg': 'var(--clr-bg-html)',
        // 'html-text': 'var(--clr-text-html)',
        // 'html-primary': 'var(--clr-primary-html)',
        // 'html-accent': 'var(--clr-accent-html)',
        // 'html-cta': 'var(--clr-cta-html)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        // Reference CSS variables defined in globals.css
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui"], // Montserrat as primary sans
        serif: ["var(--font-head)", "ui-serif", "Georgia"],      // Cormorant Garamond as primary serif
        accent: ["var(--font-accent)", "ui-sans-serif"],          // Raleway as accent font
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" }, },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" }, },
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        // ... other keyframes ...
        shimmer: { "0%": { backgroundPosition: "-1000px 0" }, "100%": { backgroundPosition: "1000px 0" }, },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        fadeIn: "fadeIn 0.5s ease-in-out",
        // ... other animations ...
        shimmer: "shimmer 2s infinite linear",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"), 
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
} satisfies Config;
