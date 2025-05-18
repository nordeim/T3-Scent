// src/app/HomePageClientInteractions.tsx
"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";
// import Image from "next/image"; // Not directly used here for rendering, but parent might.
import { AudioToggle } from "~/components/ui/AudioToggle"; // Import AudioToggle
import type { RouterOutputs } from "~/utils/api";

interface HomePageClientInteractionsProps {
  children: ReactNode; // Static hero content passed from Server Component
  // featuredProducts are fetched by parent, passed if this component needs them, but not used in this version.
  // featuredProducts: RouterOutputs["products"]["getAll"]["items"]; 
}

export default function HomePageClientInteractions({ children }: HomePageClientInteractionsProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [isMounted, setIsMounted] = useState(false); // For AudioToggle or other client-only elements

  useEffect(() => {
    setIsMounted(true); // Component has mounted on client
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const heroOpacity = isMounted ? Math.max(0.2, Math.min(1, 1 - scrollY / 700)) : 1; // Ensure some visibility initially
  const heroTransform = `translateY(${isMounted ? scrollY * 0.4 : 0}px)`; // Reduced parallax factor

  return (
    <>
      <div ref={heroRef} className="relative h-screen overflow-hidden bg-gray-900"> {/* Added bg for video load fallback */}
        <div
          className="absolute inset-0 z-0 transition-opacity duration-300" // Added transition
          style={{
            opacity: heroOpacity,
            transform: heroTransform,
          }}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover"
            poster="/images/hero-poster.jpg" // Ensure this poster image exists in /public/images
          >
            <source src="/videos/hero-bg.mp4" type="video/mp4" /> {/* Ensure this video exists */}
            Your browser does not support the video tag.
          </video>
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60" /> {/* Darker overlay */}
        </div>
        
        {/* AudioToggle positioned within the hero */}
        {isMounted && ( // Only render AudioToggle on the client after mount
          <div className="absolute right-4 top-4 z-50 md:right-6 md:top-6">
            <AudioToggle audioSrc="/sounds/ambient-nature.mp3" /> {/* Ensure sound file exists */}
          </div>
        )}
        
        {/* Render children (static hero text content) passed from Server Component */}
        {/* The children (text content) will also appear to have parallax due to parent transform */}
        <div className="relative z-10 flex h-full items-center justify-center text-center md:justify-start md:text-left">
            {children}
        </div>
      </div>
    </>
  );
}