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
