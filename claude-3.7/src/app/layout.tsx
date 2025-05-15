// src/app/layout.tsx
import "~/styles/globals.css"; // Ensure Tailwind base styles are imported

import { type ReactNode } from "react";
import { Inter as FontSans } from "next/font/google"; // Example font, adjust as needed
import { Analytics } from "@vercel/analytics/react"; // For Vercel Analytics
import { SpeedInsights } from "@vercel/speed-insights/next" // For Vercel Speed Insights


import { cn } from "~/lib/utils"; // Shadcn utility for class names
import { Providers } from "./providers"; // Client component to wrap context providers
import { Navbar } from "~/components/layout/Navbar"; // Assuming Navbar is a server/client component
import { Footer } from "~/components/layout/Footer"; // Assuming Footer is a server/client component
import { Toaster } from "~/components/ui/Toaster"; // Assuming react-hot-toast or similar

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

// Root metadata (can be overridden by child pages/layouts)
export const metadata = {
  title: {
    default: "The Scent | Signature Aromatherapy & Wellness",
    template: "%s | The Scent",
  },
  description: "Discover handcrafted aromatherapy products for wellness and self-care. Explore our collection of essential oils, soaps, and more.",
  keywords: ["aromatherapy", "wellness", "essential oils", "self-care", "natural products"],
  icons: [ // Replaces next-seo additionalLinkTags for favicons
    { rel: "icon", url: "/favicon.ico" },
    { rel: "apple-touch-icon", url: "/apple-touch-icon.png", sizes: "180x180" },
  ],
  manifest: "/site.webmanifest", // PWA manifest
  // OpenGraph and Twitter metadata can also be defined here or in specific pages
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://the-scent.example.com",
    siteName: "The Scent",
    title: "The Scent | Signature Aromatherapy & Wellness",
    description: "Discover handcrafted aromatherapy products for wellness and self-care.",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://the-scent.example.com"}/images/og-image.jpg`, // Update with actual OG image path
        width: 1200,
        height: 630,
        alt: "The Scent - Aromatherapy & Wellness",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    // site: "@thescent_handle", // Your Twitter handle
    // creator: "@creator_handle", // Creator's handle if different
    title: "The Scent | Signature Aromatherapy & Wellness",
    description: "Handcrafted aromatherapy products for wellness and self-care.",
    // images: [`${process.env.NEXT_PUBLIC_SITE_URL}/images/twitter-og.jpg`], // Twitter specific image
  },
  // viewport: "width=device-width, initial-scale=1", // Default with Next.js 13+ App Router
  // themeColor: "#2a7c8a", // Handled by theme provider or CSS
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning> {/* suppressHydrationWarning often needed with next-themes */}
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <Providers> {/* Client component wrapping all context providers */}
          <div className="relative flex min-h-screen flex-col">
            <Navbar /> {/* Navbar component */}
            <main className="flex-1">{children}</main>
            <Footer /> {/* Footer component */}
          </div>
          <Toaster /> {/* For react-hot-toast notifications */}
        </Providers>
        <Analytics /> {/* Vercel Analytics */}
        <SpeedInsights /> {/* Vercel Speed Insights */}
      </body>
    </html>
  );
}