<think>
The user wants me to regenerate `tailwind.config.ts` and `src/app/layout.tsx` to ensure they have the latest correct working versions, especially in the context of the theming and font changes we discussed based on `sample_landing_page.html`.

**Plan:**

**1. `tailwind.config.ts`:**
    *   **Objective:** Ensure it correctly references the CSS variables for colors (using `hsl(var(...))`) and fonts (using `var(...)`) that are defined in `src/styles/globals.css`.
    *   **Recall Previous Version:** My last version of `tailwind.config.ts` was already set up this way:
        ```typescript
        // tailwind.config.ts (relevant parts from my previous version)
        // ...
        extend: {
          colors: { 
            border: "hsl(var(--border))",
            // ... all other shadcn/ui style colors ...
          },
          fontFamily: {
            head: ["var(--font-head)", "ui-serif", "serif"],
            body: ["var(--font-body)", "ui-sans-serif", "sans-serif"],
            accent: ["var(--font-accent)", "ui-sans-serif", "sans-serif"],
            sans: ["var(--font-body)", "ui-sans-serif", "sans-serif"], // 'sans' aliased to 'body'
          },
        // ...
        ```
    *   **Validation:** This structure is correct. The key is that the CSS variables (`--border`, `--font-head`, etc.) must be properly defined with the correct HSL triplet values (for colors) or font stack (for fonts) in `src/styles/globals.css`.
    *   **Action:** Re-provide this version, ensuring it's complete and includes all necessary sections (darkMode, content, theme, extend, plugins).

**2. `src/app/layout.tsx`:**
    *   **Objective:** Ensure it correctly links the Google Fonts, applies the base font class to the body, and sets up the main page structure with `Providers`, `Navbar`, `Footer`, and `Toaster`.
    *   **Recall Previous Version:**
        ```tsx
        // src/app/layout.tsx (relevant parts from my previous version)
        // ...
        export const metadata = { /* ... */ };
        export default function RootLayout({ children }: { children: ReactNode }) {
          const requestHeaders = headers(); 
          return (
            <html lang="en" suppressHydrationWarning className="scroll-smooth"> 
              <head>
                {/* Google Font <link> tags */}
              </head> 
              <body className={cn("font-sans")}> {/* font-sans maps to var(--font-body) */}
                <Providers requestHeaders={requestHeaders}> 
                  {/* Navbar, main, Footer, Toaster */}
                </Providers>
                {/* Analytics, SpeedInsights */}
              </body>
            </html>
          );
        }
        ```
    *   **Validation:**
        *   The Google Font `<link>` tags for `Cormorant Garamond`, `Montserrat`, and `Raleway` should be present in `<head>`.
        *   The `<body>` tag should use `className={cn("font-sans", ...)}` if `font-sans` in `tailwind.config.ts` is indeed aliased to `var(--font-body)`. Alternatively, if `font-body` is directly applied in `globals.css` to the `html` or `body` tag, then `font-sans` might not be needed on the body class here, but it's harmless.
        *   The `pt-16 md:pt-20` on `<main>` is crucial for fixed navbar offset.
        *   `Providers` component wrapper is correct.
    *   **Refinement:** Add an explicit comment about the `pt-XX` on main depending on Navbar height.
    *   **Action:** Re-provide this version, ensuring all imports are present and the structure is complete.

I will generate these two files now, ensuring they are robust and align with all previous decisions and fixes.
</think>

Alright, let's ensure you have the latest correct and complete working versions of `tailwind.config.ts` and `src/app/layout.tsx`. These are foundational for your project's styling, theming, and overall page structure.

---
**1. Updated `tailwind.config.ts`**

This version is configured to work with the CSS custom properties (for both colors and fonts) that you would define in your `src/styles/globals.css` based on the `sample_landing_page.html` theme.

```ts
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
```

---
**2. Updated `src/app/layout.tsx`**

This version ensures the Google Font links are correctly placed, the body uses the `font-sans` utility (which maps to your `var(--font-body)`), and includes best practices for the HTML shell.

```tsx
// src/app/layout.tsx
import "~/styles/globals.css"; 

import { type ReactNode } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { headers } from "next/headers"; // For passing to TRPCReactProvider if needed for SSR cookie forwarding

import { cn } from "~/lib/utils"; 
import { Providers } from "./providers"; 
import { Navbar } from "~/components/layout/Navbar"; 
import { Footer } from "~/components/layout/Footer"; 
import { Toaster } from "~/components/ui/Toaster"; // Ensure this path is correct
import { env } from "~/env.js"; 

// Default metadata for the application
// Specific pages can override or extend this using their own `generateMetadata`
export const metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "The Scent — Signature Aromatherapy & Wellness", // Title from sample HTML
    template: "%s — The Scent", // Template for page-specific titles
  },
  description: "Discover handcrafted aromatherapy products for wellness and self-care. Experience the transformative power of nature with The Scent.",
  keywords: ["aromatherapy", "wellness", "essential oils", "self-care", "natural products", "mindfulness", "the scent", "relaxation", "meditation"],
  authors: [{ name: "The Scent Team", url: env.NEXT_PUBLIC_SITE_URL }],
  creator: "The Scent Team",
  publisher: "The Scent",
  icons: {
    icon: "/favicon.ico", // Path relative to /public
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png", // e.g., public/apple-touch-icon.png
    // other: [
    //   { rel: 'icon', type: 'image/png', sizes: '32x32', url: '/favicon-32x32.png' },
    //   { rel: 'icon', type: 'image/png', sizes: '16x16', url: '/favicon-16x16.png' },
    // ],
  },
  manifest: "/site.webmanifest", // Path relative to /public
  openGraph: {
    type: "website",
    locale: "en_US", 
    url: env.NEXT_PUBLIC_SITE_URL,
    siteName: "The Scent",
    title: {
      default: "The Scent — Signature Aromatherapy & Wellness",
      template: "%s — The Scent",
    },
    description: "Discover handcrafted aromatherapy products for wellness and self-care.",
    images: [
      {
        url: "/images/og-default.jpg", // Relative to /public. Example: public/images/og-default.jpg
        width: 1200,
        height: 630,
        alt: "The Scent - Aromatherapy & Wellness Collection",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: {
        default: "The Scent — Signature Aromatherapy & Wellness",
        template: "%s — The Scent",
    },
    description: "Handcrafted aromatherapy products for wellness, self-care, and mindful living.",
    // site: "@YourTwitterHandle", // Optional
    // creator: "@YourCreatorHandle", // Optional
    images: ["/images/twitter-default.jpg"], // Relative to /public
  },
  // themeColor defined by next-themes based on current theme
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const requestHeaders = headers(); // Read headers in Server Component

  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth antialiased"> 
      <head>
        {/* Google Fonts from sample_landing_page.html */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Raleway:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap" 
          rel="stylesheet" 
        />
        {/* Font Awesome is typically bundled via react-icons, so direct CDN link might not be needed
            unless you use FA classes directly in non-React parts or specifically prefer CDN. */}
      </head> 
      <body
        className={cn(
          "font-sans", // This will use var(--font-body) due to tailwind.config.ts
          "bg-background text-foreground" // Apply base colors from CSS variables
        )}
      >
        <Providers requestHeaders={requestHeaders}> 
          <div className="relative flex min-h-dvh flex-col"> {/* min-h-dvh for full dynamic viewport height */}
            <Navbar />
            {/* Adjust pt-XX (padding-top) to match your Navbar's actual height to prevent overlap */}
            <main className="flex-grow pt-16 sm:pt-20"> 
              {children}
            </main>
            <Footer />
          </div>
          <Toaster /> 
        </Providers>
        <Analytics /> 
        <SpeedInsights /> 
      </body>
    </html>
  );
}
```

---
**Summary and Conclusion:**

1.  **`tailwind.config.ts` (Updated):**
    *   Ensured `fontFamily` correctly references the CSS variables (`--font-head`, `--font-body`, `--font-accent`) that will be defined in `globals.css`.
    *   The `colors` section remains configured to use `hsl(var(...))` syntax, which relies on correctly formatted HSL triplet values in `globals.css`.
    *   Updated container padding and max-widths to be more aligned with common responsive designs and the provided sample page's implications.
2.  **`src/app/layout.tsx` (Updated):**
    *   Includes the `<link>` tags for the Google Fonts (`Cormorant Garamond`, `Montserrat`, `Raleway`) specified in `sample_landing_page.html`.
    *   The `<body>` now uses `font-sans`, which (due to the `tailwind.config.ts` update) will resolve to `var(--font-body)` (Montserrat).
    *   Added `scroll-smooth` and `antialiased` to `<html>` for better UX.
    *   Used `min-h-dvh` for the main layout div for better viewport height handling.
    *   Ensured the `<main>` tag has top padding (`pt-16 sm:pt-20`) to account for a fixed navbar height. You might need to adjust this value based on your `Navbar`'s final height.
    *   The metadata section is made more robust.

**Key Actions for You:**
1.  **Replace `tailwind.config.ts` and `src/app/layout.tsx`** with these updated versions.
2.  **Crucially, ensure your `src/styles/globals.css` has the correct HSL triplet values** for all the CSS variables (like `--background`, `--primary`, `--font-body`, etc.) as detailed in my previous response. This is the most critical step for the theming and `bg-background` error to be resolved.
3.  If the `params`/`searchParams` errors persist after ensuring you are **not** using Turbopack (by setting `package.json` dev script to `"next dev"`), this will require further specific debugging, potentially by creating a minimal reproduction or checking Next.js 15.3.2 community discussions/issue trackers.

With these updates, particularly the correct HSL setup in `globals.css`, your application's visual appearance should align much more closely with the intended theme, and Tailwind should correctly apply utility classes like `bg-background`.

