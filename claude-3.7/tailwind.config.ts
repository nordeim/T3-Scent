// tailwind.config.ts
import { type Config } from "tailwindcss";

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
      padding: {
        DEFAULT: "1rem", 
        sm: "1.5rem",    
        lg: "2rem",      
      },
      screens: {
        sm: "640px", md: "768px", lg: "1024px", xl: "1180px", "2xl": "1440px",
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
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        head: ["var(--font-head)", "ui-serif", "serif"],
        body: ["var(--font-body)", "ui-sans-serif", "sans-serif"],
        accent: ["var(--font-accent)", "ui-sans-serif", "sans-serif"],
        sans: ["var(--font-body)", "ui-sans-serif", "sans-serif"], 
      },
      keyframes: {
        "accordion-down": { from: { height: "0px" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0px" } },
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        shimmer: { "0%": { backgroundPosition: "-1000px 0" }, "100%": { backgroundPosition: "1000px 0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        fadeIn: "fadeIn 0.5s ease-in-out",
        shimmer: "shimmer 2s infinite linear",
      },
      typography: (theme: any) => ({ // Basic prose styling using theme colors
        DEFAULT: {
          css: {
            '--tw-prose-body': theme('colors.foreground / 1'),
            '--tw-prose-headings': theme('colors.foreground / 1'), // Or theme('colors.primary / 1')
            '--tw-prose-lead': theme('colors.muted.foreground / 1'),
            '--tw-prose-links': theme('colors.primary / 1'),
            '--tw-prose-bold': theme('colors.foreground / 1'),
            '--tw-prose-counters': theme('colors.muted.foreground / 1'),
            '--tw-prose-bullets': theme('colors.muted.foreground / 1'),
            '--tw-prose-hr': theme('colors.border / 1'),
            '--tw-prose-quotes': theme('colors.foreground / 1'),
            '--tw-prose-quote-borders': theme('colors.border / 1'),
            '--tw-prose-captions': theme('colors.muted.foreground / 1'),
            '--tw-prose-code': theme('colors.foreground / 1'),
            '--tw-prose-pre-code': theme('colors.foreground / 1'), // Text inside code block
            '--tw-prose-pre-bg': theme('colors.muted / 1'),         // Code block background
            '--tw-prose-th-borders': theme('colors.border / 1'),
            '--tw-prose-td-borders': theme('colors.border / 1'),
            // Dark mode prose variables
            '--tw-prose-invert-body': theme('colors.foreground / 1'), // Should use dark foreground
            '--tw-prose-invert-headings': theme('colors.foreground / 1'),
            '--tw-prose-invert-lead': theme('colors.muted.foreground / 1'),
            '--tw-prose-invert-links': theme('colors.primary / 1'),
            // ... and so on for all invert variables
             h1: { fontFamily: 'var(--font-head)'},
             h2: { fontFamily: 'var(--font-head)'},
             h3: { fontFamily: 'var(--font-head)'},
          },
        },
      }),
    },
  },
  plugins: [
    require("tailwindcss-animate"), 
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
} satisfies Config;