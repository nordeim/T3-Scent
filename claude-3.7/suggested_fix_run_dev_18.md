<think>
The user is encountering new "Module not found" errors for UI components (`Progress`, `RadioGroup`, `Checkbox`) within `src/app/quiz/AdvancedScentQuizClient.tsx`. This is expected as these components were used in the more complete `AdvancedScentQuizClient` I provided, but stubs for them were not created in the last round where I focused on `Card`, `Label`, `Textarea`, etc.

The `searchParams`/`params` errors are also still present. The user has confirmed (by providing the `package.json`) that the `dev` script is now `next dev`, so Turbopack should not be the primary cause if these persist. This makes the "access props first" strategy in Server Components even more critical, or it might indicate a deeper issue with Next.js 15's handling of these dynamic props in the dev server.

Additionally, the user has requested an update to the visual aesthetics by borrowing the color scheme, icons, and fonts from the attached `sample_landing_page.html`.

**Plan:**

**Part 1: Fix "Module not found" Errors**
1.  **Create Stub UI Components:**
    *   `src/components/ui/Progress.tsx`
    *   `src/components/ui/RadioGroup.tsx` (exporting `RadioGroup` and `RadioGroupItem`)
    *   `src/components/ui/Checkbox.tsx`
    *   These will be based on Shadcn/ui patterns, using Radix UI primitives for accessibility and functionality where appropriate, and styled with TailwindCSS.

**Part 2: Implement Visual Aesthetics Update**

1.  **Analyze `sample_landing_page.html`:**
    *   **Fonts:**
        *   `Cormorant Garamond` (600, 700) for headings (`--font-head`).
        *   `Montserrat` (400, 500) for body text (`--font-body`).
        *   `Raleway` (500, 600) for accent text (`--font-accent`).
    *   **Colors (CSS Variables):**
        *   Light Mode: `--clr-bg`, `--clr-bg-alt`, `--clr-text`, `--clr-primary`, `--clr-accent`, `--clr-soap`, `--clr-cta`, `--clr-cta-hover`, `--clr-overlay`, `--clr-shadow`.
        *   Dark Mode: Corresponding `--clr-*-dark` variables.
    *   **Icons:** Uses Font Awesome 6.x via CDN. My current components use `react-icons/fa` (which includes Font Awesome). I should ensure consistency or make a note if a switch to direct Font Awesome classes is preferred (less likely in a React component world unless specifically for the static HTML parts, which we don't have). The key is to use similar *types* of icons (e.g., `fa-solid fa-leaf` can be `FaLeaf` from `react-icons/fa`).

2.  **Update `src/styles/globals.css`:**
    *   **Font Imports:** Remove existing `@theme --font-sans` and instead import Google Fonts (`Cormorant Garamond`, `Montserrat`, `Raleway`) using `@import` or `<link>` tags in `src/app/layout.tsx`.
    *   **CSS Variables:** Define the new color palette from `sample_landing_page.html` within the `:root` and `.dark` selectors. These will map to the HSL variables used by Shadcn/ui components if we want to keep that system, or override them. For simplicity and directness, I'll define them as they are in the HTML and update `tailwind.config.ts` to use these CSS variables.
    *   Update base body styles (`font-family`, `background`, `color`, `line-height`).
    *   Update heading styles (`h1`-`h6`).
    *   Update link styles.

3.  **Update `tailwind.config.ts`:**
    *   **Fonts:** Configure `fontFamily` to use the new CSS variables (`--font-head`, `--font-body`, `--font-accent`).
    *   **Colors:** Update the Tailwind color palette (`primary`, `secondary`, `accent`, `background`, `foreground`, `card`, `border`, `input`, `ring`, `muted`, `destructive`) to use the new CSS variables defined in `globals.css`. This allows Tailwind utility classes to pick up the new theme. For example:
        ```javascript
        colors: {
          primary: 'hsl(var(--primary))', // This assumes --primary is defined as HSL values
          // OR directly if the sample HTML used hex/rgb and we don't want to convert to HSL for Tailwind's system:
          primary: {
            DEFAULT: 'var(--clr-primary)', // Directly use the CSS variable
            // foreground: 'var(--clr-primary-foreground)', // if defined
          },
          // ... and so on for other colors.
        }
        ```
        The sample HTML defines `--clr-primary: #2a7c8a;`. Tailwind's `hsl(var(--primary))` expects `--primary` to be HSL values (e.g., `204 70% 50%`). I'll need to either convert the hex/rgb from `sample_landing_page.html` to HSL for `globals.css` or make Tailwind use the direct CSS variable values. The latter is simpler: `primary: 'var(--clr-primary)'`.

4.  **Update `src/app/layout.tsx`:**
    *   Remove `next/font` import for `Inter`.
    *   Add `<link>` tags in the `<head>` for the Google Fonts from `sample_landing_page.html`.
    *   Adjust the `fontSans.variable` if a new primary sans-serif font variable is defined. The sample uses Montserrat as body, Raleway as accent. Cormorant Garamond for headings. So, `--font-sans` in `tailwind.config.ts` should map to Montserrat. Headings will use `--font-head`.

5.  **Icon Usage:** The sample HTML uses Font Awesome classes directly (e.g., `fa-solid fa-leaf`). My components use `react-icons` (e.g., `<FaLeaf />`). This is fine; `react-icons` bundles Font Awesome. The key is to ensure the *semantic meaning* of icons is preserved and that they visually fit the new aesthetic. I will not change the `react-icons` usage but ensure component stubs use icons that match the *intent* of the sample page where applicable.

**Part 3: Address Persistent `params`/`searchParams` Errors**

*   Since the user confirmed `package.json`'s `dev` script is now `next dev` (implying Webpack is used for dev server, not Turbopack), and the "params/searchParams should be awaited" error still occurs, this is more puzzling.
*   The pattern of accessing props like `const slug = params.slug;` at the top of an `async function Page({ params })` is standard.
*   **Next Action:** I will not change this access pattern yet. The priority is to fix the "Module not found" errors. Once the page renders without module errors, if the `params`/`searchParams` issue persists even with Webpack, it might be:
    1.  A bug in Next.js 15.3.2.
    2.  A very subtle interaction with how `createServerActionClient` (and its internal calls to `auth()` and `headers()`) sets up or interacts with the request's dynamic context *before* `params`/`searchParams` are accessed by the page component's main logic.
    3.  The error message being misleading, and the root cause is elsewhere but manifests this way.
*   For now, I will ensure my page stubs *continue* to use the standard documented way of accessing `params` and `searchParams`.

**Order of Operations:**
1.  Create missing UI component stubs (`Progress`, `RadioGroup`, `Checkbox`).
2.  Update `globals.css` with new fonts and color variables.
3.  Update `tailwind.config.ts` to use these new CSS variables.
4.  Update `src/app/layout.tsx` for new font links.
5.  Briefly re-check relevant page components (`signin`, `products`, `collections/[slug]`) to ensure their `params`/`searchParams` access remains standard, and add comments about the ongoing issue.

This will be a substantial update.
</think>

Okay, it looks like we're primarily dealing with "Module not found" errors for some UI components used in `AdvancedScentQuizClient.tsx`, and the persistent issue with `params`/`searchParams` in Server Components.

Let's first create the missing UI component stubs. Then, we'll tackle the visual refresh by updating fonts and colors.

---
**Part 1: Create Missing UI Component Stubs**

You'll need to install the Radix UI primitives for these components if you want full accessibility and functionality similar to Shadcn/ui.
`npm install @radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-checkbox`

**1. `src/components/ui/Progress.tsx`**

```tsx
// src/components/ui/Progress.tsx
"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "~/lib/utils";

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, indicatorClassName, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary/20 dark:bg-secondary/30", // Adjusted background for visibility
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 bg-primary transition-all duration-300 ease-out",
        indicatorClassName
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
```

---
**2. `src/components/ui/RadioGroup.tsx`**

```tsx
// src/components/ui/RadioGroup.tsx
"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { FaCircle } from "react-icons/fa"; // Using react-icons for the indicator

import { cn } from "~/lib/utils";

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, children, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <FaCircle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
```

---
**3. `src/components/ui/Checkbox.tsx`**

```tsx
// src/components/ui/Checkbox.tsx
"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { FaCheck } from "react-icons/fa"; // Using react-icons for the checkmark

import { cn } from "~/lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <FaCheck className="h-3 w-3" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
```
**Note:** These components (`Progress`, `RadioGroup`, `Checkbox`) rely on Radix UI primitives. Ensure you have them installed:
`npm install @radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-checkbox`

---
**Part 2: Implement Visual Aesthetics Update**

This involves updating fonts and colors based on `sample_landing_page.html`.

**1. Update `src/app/layout.tsx` (for Font Imports)**

```tsx
// src/app/layout.tsx
import "~/styles/globals.css"; 

import { type ReactNode } from "react";
// Removed: import { Inter as FontSans } from "next/font/google"; 
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { headers } from "next/headers";

import { cn } from "~/lib/utils"; 
import { Providers } from "./providers"; 
import { Navbar } from "~/components/layout/Navbar"; 
import { Footer } from "~/components/layout/Footer"; 
import { Toaster } from "~/components/ui/Toaster";   
import { env } from "~/env.js"; 

// Font setup will now be primarily handled in globals.css via @import or direct <link> tags here
// Define CSS variables for fonts in globals.css and reference them in tailwind.config.ts

export const metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "The Scent — Signature Aromatherapy & Wellness", // From sample HTML title
    template: "%s — The Scent",
  },
  description: "Discover handcrafted aromatherapy products for wellness and self-care. Experience the transformative power of nature with The Scent.",
  // ... (keep other metadata fields like openGraph, twitter, icons, manifest from previous version) ...
  icons: {
    icon: "/favicon.ico", 
    shortcut: "/favicon.ico", // Typically same as icon
    apple: "/apple-touch-icon.png", 
  },
  manifest: "/site.webmanifest",
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
    images: [ { url: "/images/og-default.jpg", width: 1200, height: 630, alt: "The Scent Collection" } ],
  },
  twitter: {
    card: "summary_large_image",
    title: {
        default: "The Scent — Signature Aromatherapy & Wellness",
        template: "%s — The Scent",
    },
    description: "Handcrafted aromatherapy products for wellness, self-care, and mindful living.",
    images: ["/images/twitter-default.jpg"], 
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const requestHeaders = headers(); 

  return (
    <html lang="en" suppressHydrationWarning> 
      <head>
        {/* Import Google Fonts from sample_landing_page.html */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Raleway:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet" />
        {/* Font Awesome is loaded via react-icons, so direct CDN link is not strictly needed if icons are consistent */}
        {/* <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A==" crossOrigin="anonymous" referrerPolicy="no-referrer" /> */}
      </head> 
      <body
        className={cn(
          "min-h-screen bg-background font-body text-foreground antialiased" 
          // font-sans variable from next/font is removed, font-body will be set in globals.css via CSS var
        )}
      >
        <Providers requestHeaders={requestHeaders}> 
          <div className="relative flex min-h-dvh flex-col"> 
            <Navbar />
            <main className="flex-1 pt-16">  {/* Adjust pt-16 based on actual Navbar height */}
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
**2. Update `src/styles/globals.css`**
*Define new fonts and color CSS variables from `sample_landing_page.html`, and map them to Tailwind's theme variables (like `--primary`, `--background`, etc.) for Shadcn/ui compatibility.*

```css
/* src/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/*
  Imported Google Fonts via <link> in layout.tsx:
  - Cormorant Garamond: For headings
  - Montserrat: For body text
  - Raleway: For accent text (e.g., navigation links, special buttons)
*/

@layer base {
  :root {
    /* Fonts from sample_landing_page.html */
    --font-head: 'Cormorant Garamond', serif;
    --font-body: 'Montserrat', sans-serif;
    --font-accent: 'Raleway', sans-serif;

    /* Base Colors from sample_landing_page.html (Light Mode) */
    --clr-bg-html: #f8f7f4;         /* Page background */
    --clr-bg-alt-html: #ffffff;     /* Card/contrast background */
    --clr-text-html: #333d41;       /* Base text color */
    --clr-primary-html: #2a7c8a;    /* Primary interactive elements */
    --clr-accent-html: #e0a86f;     /* Secondary interactive/highlight */
    --clr-cta-html: #ff7b4f;        /* Call to action buttons */
    
    /* Mapping to Shadcn/ui style CSS variables (using HSL values) */
    /* You'll need to convert your hex/rgb colors to HSL for this system */
    /* Or, modify tailwind.config.ts to use var(--clr-...) directly */

    /* Example HSL mappings (CONVERT YOUR HEX TO HSL - e.g., using an online tool) */
    /* --clr-bg-html: #f8f7f4 -> approx HSL: 40 33% 97% */
    --background: 40 33% 97%;
    /* --clr-bg-alt-html: #ffffff -> HSL: 0 0% 100% */
    --card: 0 0% 100%; /* For card backgrounds */
    --popover: 0 0% 100%;
    /* --clr-text-html: #333d41 -> approx HSL: 200 11% 23% */
    --foreground: 200 11% 23%;
    
    /* --clr-primary-html: #2a7c8a -> approx HSL: 190 53% 35% */
    --primary: 190 53% 35%;
    --primary-foreground: 40 33% 97%; /* Text on primary (e.g. white) */
    
    /* --clr-accent-html: #e0a86f -> approx HSL: 32 60% 66% */
    --secondary: 32 60% 66%; /* Using sample's accent as secondary */
    --secondary-foreground: 200 11% 23%; /* Text on secondary (e.g. dark) */

    /* --clr-cta-html: #ff7b4f -> approx HSL: 14 100% 65% */
    --accent: 14 100% 65%; /* Using sample's CTA as accent for Shadcn */
    --accent-foreground: 0 0% 100%; /* Text on accent (e.g. white) */

    --muted: 210 40% 96.1%; /* Default Shadcn light muted */
    --muted-foreground: 215.4 16.3% 46.9%; /* Default Shadcn light muted-foreground */
    
    --destructive: 0 84.2% 60.2%; /* Default Shadcn destructive */
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%; /* Default Shadcn light border */
    --input: 214.3 31.8% 91.4%;  /* Default Shadcn light input */
    --ring: 190 53% 35%;         /* Default Shadcn light ring (primary color) */

    --radius: 0.5rem; /* Consistent border radius */
  }

  .dark {
    /* Dark Mode Colors from sample_landing_page.html */
    --clr-bg-dark-html: #1a202c;
    --clr-bg-alt-dark-html: #2d3748;
    --clr-text-dark-html: #e2e8f0;
    --clr-primary-dark-html: #4fd1c5;
    --clr-accent-dark-html: #f6ad55;
    --clr-cta-dark-html: #ff8c69;

    /* Mapping to Shadcn/ui style CSS variables for dark mode */
    /* --clr-bg-dark-html: #1a202c -> approx HSL: 215 28% 14% */
    --background: 215 28% 14%;
    /* --clr-bg-alt-dark-html: #2d3748 -> HSL: 215 25% 23% */
    --card: 215 25% 23%;
    --popover: 215 25% 23%;
    /* --clr-text-dark-html: #e2e8f0 -> HSL: 215 28% 90% */
    --foreground: 215 28% 90%;
    
    /* --clr-primary-dark-html: #4fd1c5 -> HSL: 175 56% 57% */
    --primary: 175 56% 57%;
    --primary-foreground: 215 28% 14%; /* Text on primary (e.g. dark) */
    
    /* --clr-accent-dark-html: #f6ad55 -> HSL: 36 90% 65% */
    --secondary: 36 90% 65%;
    --secondary-foreground: 215 28% 14%; /* Text on secondary (e.g. dark) */

    /* --clr-cta-dark-html: #ff8c69 -> HSL: 15 100% 71% */
    --accent: 15 100% 71%;
    --accent-foreground: 215 28% 14%; /* Text on accent (e.g. dark) */

    --muted: 217.2 32.6% 17.5%; /* Default Shadcn dark muted */
    --muted-foreground: 215 20.2% 65.1%; /* Default Shadcn dark muted-foreground */
    
    --destructive: 0 62.8% 30.6%; /* Default Shadcn dark destructive */
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%; /* Default Shadcn dark border */
    --input: 217.2 32.6% 17.5%;  /* Default Shadcn dark input */
    --ring: 175 56% 57%;         /* Default Shadcn dark ring (primary color) */
  }
}

@layer base {
  body {
    @apply bg-background text-foreground;
    font-family: var(--font-body); /* Use Montserrat for body */
    line-height: 1.7;
    min-height: 100vh;
    transition-property: background-color, color;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 300ms; /* Smoother transition from sample */
    overflow-x: hidden;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-head); /* Use Cormorant Garamond */
    @apply font-bold tracking-wide text-primary; /* Tailwind classes for color */
    line-height: 1.2;
    margin-bottom: 0.75em;
  }
  .dark h1, .dark h2, .dark h3, .dark h4, .dark h5, .dark h6 {
     @apply text-primary; /* Primary color in dark mode from vars should be lighter */
     /* Or use a specific dark heading color: color: var(--clr-primary-dark-html); */
  }
  /* Specific heading sizes if needed beyond Tailwind's defaults */
  h1 { @apply text-4xl md:text-5xl; }
  h2 { @apply text-3xl md:text-4xl; }
  h3 { @apply text-2xl md:text-3xl; }


  a {
    @apply text-primary transition-colors duration-300;
    text-decoration: none;
  }
  a:hover {
    @apply text-accent; /* Using accent for link hover as per sample */
    opacity: 0.9;
  }
  a:focus-visible {
    @apply outline-none ring-2 ring-ring ring-offset-2 rounded-sm;
  }
  /* Dark mode link colors will be handled by text-primary and text-accent variables */
}
```
**Important for `globals.css`:**
*   I've mapped the HEX colors from `sample_landing_page.html` to HSL values for the Shadcn/ui-style CSS variables (`--background`, `--primary`, etc.). You **must** convert your desired hex codes to HSL format (e.g., `195.0 72.2% 34.1%` for primary `#2a7c8a`). Many online tools can do this.
*   The base `body` and heading styles now use the font CSS variables.

---
**3. Update `tailwind.config.ts`**
*Configure Tailwind to use the new fonts and CSS variable-based colors.*

```ts
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
```

---
**Summary and Conclusion:**

1.  **Missing UI Components Created:**
    *   `src/components/ui/Progress.tsx`
    *   `src/components/ui/RadioGroup.tsx` (with `RadioGroupItem`)
    *   `src/components/ui/Checkbox.tsx`
    *   These use Radix UI primitives for accessibility and are styled with Tailwind. You'll need to `npm install @radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-checkbox`.
    *   `src/components/ui/Label.tsx`, `Textarea.tsx`, `Badge.tsx`, `Breadcrumbs.tsx`, `Select.tsx`, `Switch.tsx`, `DatePicker.tsx`, `DateRangePicker.tsx` were provided in the previous step and should also be in place.

2.  **Visual Aesthetics Update (Fonts & Colors):**
    *   **`src/app/layout.tsx`:** Updated to include `<link>` tags for Google Fonts (`Cormorant Garamond`, `Montserrat`, `Raleway`) as specified in `sample_landing_page.html`. The `next/font` setup for `Inter` was removed. The body class now relies on `--font-body` being set in CSS.
    *   **`src/styles/globals.css`:**
        *   Defined CSS variables for the new fonts: `--font-head`, `--font-body`, `--font-accent`.
        *   Defined CSS variables for the new color palette from `sample_landing_page.html` (e.g., `--clr-bg-html`, `--clr-primary-html`).
        *   **Crucially, it maps these new color variables to the HSL-based CSS variables expected by Shadcn/ui and Tailwind config** (e.g., `--background`, `--primary`). **You MUST convert the hex/rgb values from `sample_landing_page.html` into HSL format (e.g., `190 53% 35%`) and put those HSL values into the `:root` and `.dark` sections of `globals.css` for the Shadcn theme variables.** I've put placeholder HSL values based on your hex codes.
        *   Updated base `body`, `h1-h6`, and `a` tag styles to use the new font and color variables.
    *   **`tailwind.config.ts`:**
        *   Updated `theme.extend.fontFamily` to reference the new CSS font variables (e.g., `sans: ["var(--font-body)", ...]`).
        *   The `theme.extend.colors` section continues to reference the HSL-based CSS variables (e.g., `primary: "hsl(var(--primary))"`), which will now pick up the new HSL values defined in `globals.css`.

3.  **Persistent `params`/`searchParams` Error:**
    *   The most important step for this error is to **ensure Turbopack is truly disabled** by editing your `package.json`'s `dev` script to just `"dev": "next dev"`. If the error still occurs with the Webpack dev server, it points to a more complex issue possibly related to Next.js v15.3.2. The way `params` and `searchParams` are accessed in the Server Component pages I provided (`const slug = params.slug;`) is the standard documented method and should generally work.

**After these changes:**
1.  Install the new Radix UI dependencies: `npm install @radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-checkbox`.
2.  Update/create the specified files.
3.  **CRITICALLY: Convert the hex/rgb color values from `sample_landing_page.html` into HSL format and update the `--background`, `--foreground`, `--primary`, etc., variables in `src/styles/globals.css` with these HSL values.**
4.  Ensure your `package.json` `dev` script is `next dev` (no `--turbo`).
5.  Run `npm run dev`.

This should resolve the "Module not found" errors for the UI components and apply the new visual theme. Pay close attention to the server/browser console for any remaining issues, especially regarding the `params`/`searchParams` if it persists after disabling Turbopack.

---
https://drive.google.com/file/d/10qxhCB7k2c3G73SUaEIfKVKSqgWSjkQo/view?usp=sharing, https://drive.google.com/file/d/19R6AOLUeAYzo73Zkt5WTqLrdQLvjfEq9/view?usp=sharing, https://drive.google.com/file/d/1CStMFip4olEr25G2Dnf2qi6In2rG10uE/view?usp=sharing, https://drive.google.com/file/d/1M29mvmeDZQQ5X72Yfx2_0-vycXBG5pF8/view?usp=sharing, https://drive.google.com/file/d/1NC4s3DVR1LDzX-LCZlMMd5NrShFBidnd/view?usp=sharing, https://aistudio.google.com/app/prompts?state=%7B%22ids%22:%5B%221QNYodene0vrlxMvFDFKJ0CSSeS2lX2t2%22%5D,%22action%22:%22open%22,%22userId%22:%22103961307342447084491%22,%22resourceKeys%22:%7B%7D%7D&usp=sharing, https://drive.google.com/file/d/1Rfnkyd51fGIlr8kLimIX1qmx96dt8sAE/view?usp=sharing, https://drive.google.com/file/d/1Zv_KnI1EBLaEZu6y_UeCJY0ChB6wst7j/view?usp=sharing, https://drive.google.com/file/d/1bBoDvYW3h0V7U0Qa5Q49Yhsfa5VxC7E_/view?usp=sharing, https://drive.google.com/file/d/1qxPDWhlmzq9-R3H1YDAVwCyPjpwQ4ZJO/view?usp=sharing, https://drive.google.com/file/d/1ygJBpjxQV2uG9MM784epU5zfih3Cnjz3/view?usp=sharing

