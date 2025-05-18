// src/app/layout.tsx
import "~/styles/globals.css"; 

import { type ReactNode } from "react";
import { Inter as FontSans } from "next/font/google"; 
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { headers } from "next/headers"; // Import server-only headers function

import { cn } from "~/lib/utils"; 
import { Providers } from "./providers"; 
import { Navbar } from "~/components/layout/Navbar"; 
import { Footer } from "~/components/layout/Footer"; 
import { Toaster } from "~/components/ui/Toaster";   
import { env } from "~/env.js"; 

const fontSans = FontSans({
  subsets: ["latin"],
  display: 'swap', 
  variable: "--font-sans", 
});

export const metadata = { // Using simplified metadata for this example, keep your full one
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "The Scent | Signature Aromatherapy & Wellness",
    template: "%s | The Scent",
  },
  description: "Discover handcrafted aromatherapy products for wellness and self-care.",
  // ... your other metadata fields ...
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const requestHeaders = headers(); // Read headers in Server Component

  return (
    <html lang="en" suppressHydrationWarning> 
      <head /> 
      <body
        className={cn(
          "min-h-screen bg-background font-sans text-foreground antialiased",
          fontSans.variable
        )}
      >
        <Providers requestHeaders={requestHeaders}> {/* Pass headers as a prop */}
          <div className="relative flex min-h-dvh flex-col"> 
            <Navbar />
            <main className="flex-1 pt-16"> 
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