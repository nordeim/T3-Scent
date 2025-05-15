// src/app/page.tsx
// This will be a Server Component by default for data fetching,
// but interactive parts like parallax require client-side logic.

import Head from "next/head"; // Still usable for basic title/meta if not using generateMetadata fully
import Link from "next/link";
import Image from "next/image"; // Use next/image

// For interactive parts, we'll create a client component
import HomePageClientInteractions from "./HomePageClientInteractions";
import { api as serverApi } from "~/trpc/server"; // Assuming server-side tRPC caller
import { Button } from "~/components/ui/Button"; // Placeholder
import { AudioToggle } from "~/components/ui/AudioToggle"; // Needs 'use client'
import { ProductGrid } from "~/components/products/ProductGrid"; // Placeholder
// import { TestimonialCarousel } from "~/components/TestimonialCarousel"; // Placeholder, likely client
// import { NewsletterForm } from "~/components/NewsletterForm"; // Placeholder, likely client

// Metadata for App Router
export async function generateMetadata() {
  // const settings = await serverApi.settings.getSiteSettings(); // Example fetch
  return {
    title: "The Scent | Signature Aromatherapy & Wellness", // Default title if not overridden
    description: "Discover handcrafted aromatherapy products for wellness and self-care.",
    // Add more metadata as needed
  };
}

export default async function HomePage() {
  // Data fetching directly in Server Component
  let featuredProductsData;
  try {
    featuredProductsData = await serverApi.products.getAll({ // Using serverApi caller
      featured: true,
      limit: 4,
    });
  } catch (error) {
    console.error("Failed to fetch featured products:", error);
    featuredProductsData = { items: [], nextCursor: undefined }; // Fallback
  }
  
  const featuredProducts = featuredProductsData.items;

  return (
    <>
      {/* Head component can still be used for simple overrides if generateMetadata isn't sufficient or for dynamic client updates */}
      <Head> 
        <title>The Scent | Signature Aromatherapy & Wellness</title>
        <meta
          name="description"
          content="Discover handcrafted aromatherapy products for wellness and self-care."
        />
      </Head>
      
      {/* Client component for interactive parts like parallax */}
      <HomePageClientInteractions featuredProducts={featuredProducts}>
        {/* Server-rendered static parts or children passed to client component */}
        
        {/* Hero Section Content (can be passed as children or props to HomePageClientInteractions) */}
        <div className="container relative z-10 mx-auto flex h-full items-center px-4">
          <div className="max-w-2xl animate-fadeIn"> {/* Animation needs to be client-side or CSS only */}
            <h1 className="mb-4 text-4xl font-bold text-white drop-shadow-lg md:text-6xl">
              Discover Your Perfect Scent
            </h1>
            <p className="mb-8 text-lg text-white drop-shadow-md md:text-xl">
              Handcrafted aromatherapy products for wellness and self-care.
              Experience the transformative power of nature.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link href="/products">Shop Collection</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/quiz">Take Scent Quiz</Link>
              </Button>
            </div>
          </div>
        </div>
        {/* AudioToggle will be rendered within HomePageClientInteractions because it needs 'use client' */}
      </HomePageClientInteractions>
      
      {/* About Section (Static part, can be in Server Component) */}
      <section id="about" className="py-20"> {/* Removed ref from server component */}
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <div className="order-2 md:order-1">
              <h2 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
                Our Story
              </h2>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                The Scent was born from a deep passion for aromatherapy and
                natural wellness...
              </p>
              <p className="mb-6 text-gray-700 dark:text-gray-300">
                We believe in the power of scent to transform mood...
              </p>
              <Button asChild>
                <Link href="/about">Learn More About Us</Link>
              </Button>
            </div>
            <div className="relative order-1 h-[500px] md:order-2">
              {/* Parallax images would need to be handled by HomePageClientInteractions or a dedicated client component */}
              <div
                className="absolute left-0 top-0 h-64 w-48 overflow-hidden rounded-lg md:h-72 md:w-56"
                // style={{ transform: aboutImageTransform1 }} // This needs client-side JS
              >
                <Image
                  src="/images/about-1.jpg" // Ensure these images are in public/images
                  alt="Handcrafting process"
                  fill
                  className="object-cover"
                  priority // Prioritize LCP images if above the fold
                />
              </div>
              <div
                className="absolute bottom-0 right-0 h-64 w-48 overflow-hidden rounded-lg md:h-72 md:w-56"
                // style={{ transform: aboutImageTransform2 }} // This needs client-side JS
              >
                <Image
                  src="/images/about-2.jpg"
                  alt="Natural ingredients"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Featured Products Section (Data passed from server component) */}
      <section className="bg-gradient-to-r from-primary/5 to-secondary/5 py-20 dark:from-primary-dark/10 dark:to-secondary-dark/10">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Featured Products
            </h2>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Our most popular aromatherapy creations
            </p>
          </div>
          
          {featuredProducts && featuredProducts.length > 0 ? (
            <ProductGrid products={featuredProducts} />
          ) : (
            <p className="text-center text-gray-500">No featured products available at the moment.</p>
          )}
          
          <div className="mt-12 text-center">
            <Button asChild>
                <Link href="/products">View All Products</Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Placeholder for other sections like Testimonials, Newsletter */}
      {/* <TestimonialCarousel /> */}
      {/* <NewsletterForm /> */}
    </>
  );
}