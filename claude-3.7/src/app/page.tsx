// src/app/page.tsx
import Link from "next/link";
import Image from "next/image";
import { type Metadata } from "next";

import { createServerActionClient } from "~/trpc/server"; // Correct import
import { env } from "~/env.js";

import HomePageClientInteractions from "./HomePageClientInteractions";
import { Button } from "~/components/ui/Button"; 
import { ProductGrid } from "~/components/products/ProductGrid"; 

export async function generateMetadata(): Promise<Metadata> {
  const siteName = "The Scent"; 
  const defaultTitle = `${siteName} | Signature Aromatherapy & Wellness`;
  const defaultDescription = "Discover handcrafted aromatherapy products for wellness and self-care. Experience the transformative power of nature with The Scent.";
  const siteUrl = env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return {
    title: defaultTitle,
    description: defaultDescription,
    keywords: ["aromatherapy", "wellness", "essential oils", "self-care", "natural products", "mindfulness", "the scent"],
    metadataBase: new URL(siteUrl),
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteUrl,
      siteName: siteName,
      title: defaultTitle,
      description: defaultDescription,
      images: [ { url: "/images/og-default.jpg", width: 1200, height: 630, alt: `${siteName} Collection` } ],
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description: defaultDescription,
      images: ["/images/twitter-default.jpg"],
    },
  };
}

export default async function HomePage() {
  const serverApi = await createServerActionClient(); // Get request-scoped API client

  let featuredProductsData;
  try {
    // CORRECTED: Removed .query() when using a direct caller
    featuredProductsData = await serverApi.products.getAll({ 
      featured: true,
      limit: 4,
      sortBy: "createdAt_desc",
    });
  } catch (error) {
    console.error("Error fetching featured products for HomePage:", error);
    if (error instanceof Error && 'shape' in error) { 
        console.error("TRPC Error Shape:", (error as any).shape);
    }
    featuredProductsData = { items: [], nextCursor: undefined };
  }
  
  const featuredProducts = featuredProductsData.items;

  return (
    <>
      <HomePageClientInteractions featuredProducts={featuredProducts}>
        <div className="container relative z-10 mx-auto flex h-full items-center px-4">
          <div className="max-w-2xl">
            <h1 className="mb-4 text-4xl font-bold text-white drop-shadow-lg md:text-5xl lg:text-6xl">
              Discover Your Perfect Scent
            </h1>
            <p className="mb-8 text-lg text-white drop-shadow-md md:text-xl">
              Handcrafted aromatherapy products for wellness and self-care.
              Experience the transformative power of nature.
            </p>
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
              <Button asChild size="lg" className="shadow-lg">
                <Link href="/products">Shop Collection</Link>
              </Button>
              <Button asChild variant="secondary" size="lg" className="shadow-lg">
                <Link href="/quiz">Take Scent Quiz</Link>
              </Button>
            </div>
          </div>
        </div>
      </HomePageClientInteractions>
      
      <section id="about" className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
            <div className="order-2 md:order-1">
              <span className="mb-2 block text-sm font-semibold uppercase tracking-wide text-primary">Our Philosophy</span>
              <h2 className="mb-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Crafted with Nature, For Your Well-being
              </h2>
              <p className="mb-4 text-muted-foreground">
                The Scent was born from a deep passion for aromatherapy and
                natural wellness. Our founder, after years of exploring holistic practices, 
                discovered the transformative power of pure essential oils.
              </p>
              <p className="mb-6 text-muted-foreground">
                We believe in the power of scent to transform mood, enhance
                well-being, and create moments of tranquility in our busy lives. Each product
                is thoughtfully formulated with the finest natural ingredients.
              </p>
              <Button asChild variant="outline">
                <Link href="/about">Learn More About Us</Link>
              </Button>
            </div>
            
            <div className="relative order-1 h-[400px] md:order-2 md:h-[500px]">
              <div className="absolute left-0 top-0 h-64 w-48 transform overflow-hidden rounded-lg shadow-xl md:h-72 md:w-56 lg:h-80 lg:w-64">
                <Image
                  src="/images/about-1.jpg" 
                  alt="Handcrafting aromatherapy products"
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="absolute bottom-0 right-0 h-56 w-44 transform overflow-hidden rounded-lg shadow-xl md:bottom-4 md:right-4 md:h-64 md:w-52 lg:h-72 lg:w-60">
                <Image
                  src="/images/about-2.jpg"
                  alt="Natural ingredients like lavender and herbs"
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Featured Products
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              Discover our most loved aromatherapy creations, perfect for enhancing your daily rituals.
            </p>
          </div>
          
          {featuredProducts && featuredProducts.length > 0 ? (
            <ProductGrid products={featuredProducts} />
          ) : (
            <p className="text-center text-muted-foreground">
              Our featured products are currently being curated. Check back soon!
            </p>
          )}
          
          <div className="mt-12 text-center">
            <Button asChild size="lg">
                <Link href="/products">View All Products</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}