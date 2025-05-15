// src/app/HomePageClientInteractions.tsx
"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { AudioToggle } from "~/components/ui/AudioToggle";
import type { RouterOutputs } from "~/utils/api"; // For product type

interface HomePageClientInteractionsProps {
  children: ReactNode; // For static content from server component
  featuredProducts: RouterOutputs["products"]["getAll"]["items"]; // Type for featured products
}

export default function HomePageClientInteractions({ children, featuredProducts }: HomePageClientInteractionsProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null); // If About section parallax is client-side
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const heroOpacity = Math.max(0, Math.min(1, 1 - scrollY / 700));
  const heroTransform = `translateY(${scrollY * 0.5}px)`;

  // Calculate parallax for about section images (if this logic is kept client-side)
  // This requires the about section to be part of this client component or its ref passed down.
  // For simplicity, I'm assuming the static About section is rendered by the Server Component,
  // and more complex parallax on its images might need a separate Client Component wrapper for them.

  return (
    <>
      {/* Hero Section with Video Background */}
      <div ref={heroRef} className="relative h-screen overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            opacity: heroOpacity,
            transform: heroTransform,
          }}
        >
          <video
            autoPlay
            loop
            muted
            playsInline // Important for mobile
            className="h-full w-full object-cover"
            poster="/images/hero-poster.jpg" // Add a poster image
          >
            <source src="/videos/hero-bg.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="absolute inset-0 bg-black/30 dark:bg-black/50" /> {/* Adjusted overlay */}
        </div>
        
        <div className="absolute right-4 top-4 z-50 md:right-6 md:top-6">
          <AudioToggle />
        </div>
        
        {/* Render children passed from Server Component (e.g., static text content for hero) */}
        {children}
      </div>

      {/* About Section Parallax Images (If controlled client-side) */}
      {/* If the About section itself is static, but images within it need parallax,
          those image containers would need to be client components or have refs managed here.
          This demonstrates complexity of mixing server/client rendering with scroll effects.
          A simpler approach is CSS-driven parallax if possible, or dedicated client components
          for elements that need JavaScript-driven scroll effects.
      */}
      {/* Example if 'aboutRef' was for a client-side rendered About section:
      <section id="about-client" ref={aboutRef} className="py-20"> ... </section>
      */}
    </>
  );
}