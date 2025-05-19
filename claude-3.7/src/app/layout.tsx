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
