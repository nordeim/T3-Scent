// tailwind.config.ts
import { type Config } from "tailwindcss";

export default {
  darkMode: "class", // Enables class-based dark mode (e.g., <html class="dark">)
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}", // For any remaining pages router files (e.g. API routes)
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}", // Primary content source for App Router
  ],
  theme: {
    container: { 
      center: true,
      padding: {
        DEFAULT: "1rem", // Default padding for container
        sm: "1.5rem",    // Padding for sm screens and up
        lg: "2rem",      // Padding for lg screens and up
      },
      screens: { // Max-widths for container at different breakpoints
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1180px", // Custom container width from sample_landing_page
        "2xl": "1440px",
      },
    },
    extend: {
      colors: { 
        // These colors reference CSS variables defined in src/styles/globals.css
        // The CSS variables MUST be defined in HSL format: <HUE> <SATURATION>% <LIGHTNESS>%
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))", // Used for focus rings
        background: "hsl(var(--background))", // Main page background
        foreground: "hsl(var(--foreground))", // Main text color
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))", // Text color on primary background
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
        accent: { // Often used for CTAs or highlighted elements
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
        lg: "var(--radius)", // e.g., 0.5rem
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        // These reference CSS variables defined in src/styles/globals.css
        // Fallback fonts (ui-serif, ui-sans-serif) are Tailwind's defaults
        head: ["var(--font-head)", "ui-serif", "serif"],             // For headings (Cormorant Garamond)
        body: ["var(--font-body)", "ui-sans-serif", "sans-serif"],   // For body text (Montserrat)
        accent: ["var(--font-accent)", "ui-sans-serif", "sans-serif"], // For accent text (Raleway)
        
        // Make 'sans' (Tailwind's default sans-serif utility class prefix) use your body font
        sans: ["var(--font-body)", "ui-sans-serif", "sans-serif"], 
      },
      keyframes: {
        "accordion-down": { 
          from: { height: "0px" }, // Use "0px" instead of "0" for height
          to: { height: "var(--radix-accordion-content-height)" }, 
        },
        "accordion-up": { 
          from: { height: "var(--radix-accordion-content-height)" }, 
          to: { height: "0px" }, // Use "0px"
        },
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        fadeOut: { "0%": { opacity: "1" }, "100%": { opacity: "0" } },
        slideInRight: { "0%": { transform: "translateX(100%)", opacity: "0" }, "100%": { transform: "translateX(0)", opacity: "1" } },
        slideInLeft: { "0%": { transform: "translateX(-100%)", opacity: "0" }, "100%": { transform: "translateX(0)", opacity: "1" } },
        shimmer: { 
          "0%": { backgroundPosition: "-1000px 0" }, 
          "100%": { backgroundPosition: "1000px 0" }, 
        },
        // Add other keyframes from sample_landing_page.html if needed (ctaPulse, markerPulse)
        // Example:
        // ctaPulse: { 
        //   "0%, 100%": { transform: "scale(1)", boxShadow: "0 8px 25px -5px rgba(var(--accent-rgb), 0.4)" }, // Assuming --accent-rgb is defined
        //   "50%": { transform: "scale(1.03)", boxShadow: "0 10px 30px 0px rgba(var(--accent-rgb), 0.5)" }
        // },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        fadeIn: "fadeIn 0.5s ease-in-out",
        fadeOut: "fadeOut 0.5s ease-in-out", // Added fadeOut
        slideInRight: "slideInRight 0.5s ease-in-out",
        slideInLeft: "slideInLeft 0.5s ease-in-out",
        shimmer: "shimmer 2s infinite linear",
        // ctaPulse: "ctaPulse 2.8s infinite alternate cubic-bezier(0.68, -0.55, 0.27, 1.55)",
      },
      // If using @tailwindcss/typography for prose styling:
      typography: (theme: any) => ({
        DEFAULT: {
          css: {
            color: 'hsl(var(--foreground))', // Base prose color
            a: {
              color: 'hsl(var(--primary))',
              '&:hover': {
                color: 'hsl(var(--accent))',
              },
            },
            'h1, h2, h3, h4': {
                fontFamily: 'var(--font-head)',
                color: 'hsl(var(--foreground))', // Or text-primary
            },
            // ... other prose styles
          },
        },
        invert: { // For dark mode prose
            css: {
                color: 'hsl(var(--foreground))', // Should use dark mode foreground
                 a: {
                    color: 'hsl(var(--primary))', // Dark mode primary
                    '&:hover': {
                        color: 'hsl(var(--accent))', // Dark mode accent
                    },
                },
                'h1, h2, h3, h4': {
                    fontFamily: 'var(--font-head)',
                    color: 'hsl(var(--foreground))',
                },
            }
        }
      }),
    },
  },
  plugins: [
    require("tailwindcss-animate"), 
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
} satisfies Config;
