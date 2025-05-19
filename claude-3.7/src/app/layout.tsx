// src/app/layout.tsx
import "~/styles/globals.css"; 

import { type ReactNode } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { headers } from "next/headers"; 

import { cn } from "~/lib/utils"; 
import { Providers } from "./providers"; 
import { Navbar } from "~/components/layout/Navbar"; 
import { Footer } from "~/components/layout/Footer"; 
import { Toaster } from "~/components/ui/Toaster";   
import { env } from "~/env.js"; 

export const metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "The Scent — Signature Aromatherapy & Wellness",
    template: "%s — The Scent",
  },
  description: "Discover handcrafted aromatherapy products for wellness and self-care. Experience the transformative power of nature with The Scent.",
  keywords: ["aromatherapy", "wellness", "essential oils", "self-care", "natural products", "mindfulness", "the scent", "relaxation", "meditation"],
  authors: [{ name: "The Scent Team", url: env.NEXT_PUBLIC_SITE_URL }],
  icons: { icon: "/favicon.ico", shortcut: "/favicon.ico", apple: "/apple-touch-icon.png" },
  manifest: "/site.webmanifest",
  openGraph: { type: "website", locale: "en_US", url: env.NEXT_PUBLIC_SITE_URL, siteName: "The Scent", title: { default: "The Scent — Signature Aromatherapy & Wellness", template: "%s — The Scent" }, description: "Discover handcrafted aromatherapy products for wellness and self-care.", images: [ { url: "/images/og-default.jpg", width: 1200, height: 630, alt: "The Scent Collection" } ]},
  twitter: { card: "summary_large_image", title: { default: "The Scent — Signature Aromatherapy & Wellness", template: "%s — The Scent" }, description: "Handcrafted aromatherapy products for wellness, self-care, and mindful living.", images: ["/images/twitter-default.jpg"]},
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const requestHeaders = headers(); 

  return (
    // The `font-body` class will be applied by `html` tag from globals.css
    <html lang="en" suppressHydrationWarning className="scroll-smooth antialiased"> 
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Raleway:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap" 
          rel="stylesheet" 
        />
      </head> 
      {/* Body directly uses styles from @layer base in globals.css, including font-family */}
      <body>
        <Providers requestHeaders={requestHeaders}> 
          <div className="relative flex min-h-dvh flex-col"> {/* This div gets bg-background from body */}
            <Navbar />
            {/* Navbar height (h-16 or h-20 from Navbar.tsx) should be accounted for here */}
            <main className="flex-grow pt-16 sm:pt-20"> {/* Updated padding top */}
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