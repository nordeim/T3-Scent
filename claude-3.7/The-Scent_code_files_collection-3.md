# src/components/products/ProductGrid.tsx
```tsx
// src/components/products/ProductGrid.tsx
import React from 'react';
import { ProductCard } from '~/components/common/ProductCard'; 
import type { RouterOutputs } from '~/utils/api';

// Using the specific product type from the getAll procedure's output items
type ProductInGrid = RouterOutputs["products"]["getAll"]["items"][number];

interface ProductGridProps {
  products?: ProductInGrid[]; // Make products optional for loading/empty states
  isLoading?: boolean;
  skeletonsCount?: number; // How many skeletons to show
  className?: string;
  emptyStateMessage?: string;
}

export const ProductGrid = ({ 
  products, 
  isLoading = false, 
  skeletonsCount = 4, 
  className,
  emptyStateMessage = "No products found matching your criteria." 
}: ProductGridProps) => {
  
  const gridClasses = "grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8";

  if (isLoading) {
    return (
      <div className={cn(gridClasses, className)}>
        {Array.from({ length: skeletonsCount }).map((_, index) => (
          // Basic Skeleton for ProductCard
          <div key={`skeleton-${index}`} className="group animate-pulse">
            <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted"></div>
            <div className="mt-4 h-4 w-3/4 rounded bg-muted"></div>
            <div className="mt-2 h-6 w-1/2 rounded bg-muted"></div>
            <div className="mt-2 h-4 w-1/4 rounded bg-muted"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-muted-foreground">{emptyStateMessage}</p>
        {/* Optional: Add a CTA like "Browse all products" */}
      </div>
    );
  }

  return (
    <div className={cn(gridClasses, className)}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

// cn utility if not globally available for this component (usually from lib/utils)
function cn(...inputs: (string | undefined | null | boolean)[]) {
  return inputs.filter(Boolean).join(' ');
}
```

# src/components/common/ProductCard.tsx
```tsx
// src/components/common/ProductCard.tsx
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '~/components/ui/Button';
import { Rating } from '~/components/ui/Rating';
import { formatCurrency } from '~/utils/format';
import type { RouterOutputs } from '~/utils/api'; // For specific product type from router
import { FaShoppingCart, FaHeart, FaRegHeart, FaSpinner } from 'react-icons/fa';
import { useCart } from '~/contexts/CartContext';
import { useWishlist } from '~/contexts/WishlistContext';
import { toast } from 'react-hot-toast';
import { cn } from '~/lib/utils'; // For classnames
import { useState } from 'react';

// Use the specific item type from your products.getAll tRPC output
type Product = RouterOutputs["products"]["getAll"]["items"][number];

interface ProductCardProps {
  product: Product;
  className?: string;
}

export const ProductCard = ({ product, className }: ProductCardProps) => {
  const { addItem: addItemToCart, getItem: getCartItem } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist, isLoading: isWishlistLoading } = useWishlist();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);


  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.inStock || (product.stockQuantity !== null && product.stockQuantity <=0 )) {
        toast.error("This product is currently out of stock.");
        return;
    }
    setIsAddingToCart(true);
    // Simulate async operation for UX, or if addItemToCart becomes async
    await new Promise(resolve => setTimeout(resolve, 300)); 
    addItemToCart({
      id: product.id,
      name: product.name,
      price: product.price, 
      imageUrl: product.images?.[0]?.url ?? "/images/placeholder.png", // Fallback image
      slug: product.slug,
      quantity: 1,
      // variantId: undefined, // If this card is for base product only
    });
    setIsAddingToCart(false);
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsTogglingWishlist(true);
    const wishlistItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.images?.[0]?.url ?? "/images/placeholder.png",
        slug: product.slug,
    };

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 300));
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      // Toast is handled in context, or can be here: toast.success(`${product.name} removed from wishlist!`);
    } else {
      addToWishlist(wishlistItem);
      // toast.success(`${product.name} added to wishlist!`);
    }
    setIsTogglingWishlist(false);
  };
  
  const cartItem = getCartItem(product.id); 
  const productInWishlist = isInWishlist(product.id);

  const effectivePrice = product.price;
  const effectiveCompareAtPrice = product.compareAtPrice;

  return (
    <div className={cn("group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all hover:shadow-lg dark:border-border/20", className)}>
      <Link href={`/products/${product.slug}`} className="contents"> {/* Make link wrap content for better semantics */}
        <div className="relative aspect-[3/4] w-full bg-muted overflow-hidden">
          {product.images?.[0]?.url ? (
            <Image
              src={product.images[0].url}
              alt={product.images[0].altText || product.name}
              fill
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, (max-width: 1280px) 30vw, 23vw"
              className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
              priority={false} // Set to true for LCP images if applicable
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
              No Image
            </div>
          )}
          {product.onSale && effectiveCompareAtPrice && effectiveCompareAtPrice > effectivePrice && (
            <div className="absolute top-3 left-3 rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold text-white shadow">
              SALE
            </div>
          )}
          {/* Wishlist button positioned absolutely */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-card/70 p-0 text-muted-foreground backdrop-blur-sm hover:bg-card hover:text-primary disabled:opacity-50"
            onClick={handleToggleWishlist}
            disabled={isWishlistLoading || isTogglingWishlist}
            aria-label={productInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            {isTogglingWishlist ? <FaSpinner className="h-4 w-4 animate-spin" /> : 
                (productInWishlist ? <FaHeart className="h-4 w-4 text-red-500" /> : <FaRegHeart className="h-4 w-4" />)
            }
          </Button>
        </div>

        <div className="flex flex-1 flex-col p-4">
          {product.categories?.[0]?.name && (
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-primary">
                {product.categories[0].name}
              </p>
          )}
          <h3 className="flex-grow text-base font-semibold leading-tight text-foreground group-hover:text-primary">
            <span aria-hidden="true" className="absolute inset-0" /> {/* For clickable card area */}
            {product.name}
          </h3>
          
          {product.avgRating !== undefined && product.reviewCount !== undefined && product.reviewCount > 0 && (
            <div className="mt-1.5 flex items-center">
              <Rating value={product.avgRating} size="sm" readOnly />
              <span className="ml-1.5 text-xs text-muted-foreground">({product.reviewCount})</span>
            </div>
          )}

          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-lg font-bold text-foreground">{formatCurrency(effectivePrice)}</p>
            {effectiveCompareAtPrice && effectiveCompareAtPrice > effectivePrice && (
              <p className="text-sm text-muted-foreground line-through">
                {formatCurrency(effectiveCompareAtPrice)}
              </p>
            )}
          </div>
        </div>
      </Link> {/* End of Link wrapper */}
      
      {/* Add to Cart Button - outside of Link to prevent nested interactive elements if Link handles click */}
      <div className="mt-auto p-4 pt-0"> {/* Ensures button is at the bottom */}
        <Button 
            variant={cartItem ? "secondary" : "default"}
            size="sm" 
            className="w-full" 
            onClick={handleAddToCart} // This click is separate from the link navigation
            disabled={!product.inStock || (product.stockQuantity !== null && product.stockQuantity <=0 ) || isAddingToCart}
            aria-label={`Add ${product.name} to cart`}
        >
            {isAddingToCart ? <FaSpinner className="mr-1.5 h-4 w-4 animate-spin"/> : <FaShoppingCart className="mr-1.5 h-4 w-4" />}
            {product.inStock && (product.stockQuantity === null || product.stockQuantity > 0) ? (cartItem ? "Added to Cart" : "Add to Cart") : "Out of Stock"}
        </Button>
      </div>
    </div>
  );
};
```

# src/components/common/TestimonialCarousel.tsx
```tsx
// src/components/common/TestimonialCarousel.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaQuoteLeft } from 'react-icons/fa';
import { Button } from '~/components/ui/Button';
import { cn } from '~/lib/utils';

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role?: string;
  avatarUrl?: string;
}

// Sample data - in a real app, this would come from props or API
const sampleTestimonials: Testimonial[] = [
  {
    id: '1',
    quote: "The lavender essential oil transformed my sleep! I've never felt more rested. The quality is exceptional.",
    author: "Sarah M.",
    role: "Wellness Enthusiast",
    avatarUrl: "/images/avatars/avatar-1.jpg", // Placeholder path
  },
  {
    id: '2',
    quote: "I love the scent quiz! It helped me find the perfect diffuser blend for my home office. So uplifting!",
    author: "John B.",
    role: "Remote Worker",
    avatarUrl: "/images/avatars/avatar-2.jpg",
  },
  {
    id: '3',
    quote: "Customer service was amazing when I had a question about my order. The products arrived quickly and beautifully packaged.",
    author: "Lisa P.",
    role: "Loyal Customer",
    avatarUrl: "/images/avatars/avatar-3.jpg",
  },
];

interface TestimonialCarouselProps {
  testimonials?: Testimonial[];
  autoPlayInterval?: number; // in milliseconds, 0 to disable
}

export const TestimonialCarousel = ({ 
    testimonials = sampleTestimonials,
    autoPlayInterval = 5000 
}: TestimonialCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    );
  };

  const goToNext = React.useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
    );
  }, [testimonials.length]);

  useEffect(() => {
    if (autoPlayInterval && autoPlayInterval > 0 && testimonials.length > 1) {
      const timer = setTimeout(goToNext, autoPlayInterval);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, autoPlayInterval, goToNext, testimonials.length]);

  if (!testimonials || testimonials.length === 0) {
    return null; // Or a placeholder message
  }

  const currentTestimonial = testimonials[currentIndex];

  return (
    <div className="relative w-full max-w-3xl mx-auto overflow-hidden rounded-lg bg-card p-8 shadow-lg md:p-12">
      <FaQuoteLeft className="absolute top-6 left-6 h-8 w-8 text-primary/30 md:h-12 md:w-12" />
      
      <div className="relative min-h-[200px] flex flex-col items-center justify-center text-center transition-opacity duration-500 ease-in-out">
        {/* This is a simple fade transition. For slide, you'd need a more complex setup or a library. */}
        {currentTestimonial && (
          <div key={currentTestimonial.id} className="animate-fadeIn">
            {currentTestimonial.avatarUrl && (
              <img 
                src={currentTestimonial.avatarUrl} 
                alt={currentTestimonial.author} 
                className="w-20 h-20 md:w-24 md:h-24 rounded-full mx-auto mb-6 border-4 border-primary/20 shadow-md"
              />
            )}
            <p className="text-lg md:text-xl font-medium italic text-foreground mb-6">
              "{currentTestimonial.quote}"
            </p>
            <div className="font-semibold text-primary">{currentTestimonial.author}</div>
            {currentTestimonial.role && (
              <div className="text-sm text-muted-foreground">{currentTestimonial.role}</div>
            )}
          </div>
        )}
      </div>

      {testimonials.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-card/50 hover:bg-card/80 md:left-4"
            aria-label="Previous testimonial"
          >
            <FaChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-card/50 hover:bg-card/80 md:right-4"
            aria-label="Next testimonial"
          >
            <FaChevronRight className="h-5 w-5" />
          </Button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to testimonial ${index + 1}`}
                className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                  currentIndex === index ? "bg-primary" : "bg-muted-foreground/50 hover:bg-muted-foreground"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
```

# src/components/common/NewsletterForm.tsx
```tsx
// src/components/common/NewsletterForm.tsx
"use client";

import React, { useState } from 'react';
import { Input } from '~/components/ui/Input';
import { Button } from '~/components/ui/Button';
import { api as clientApi } from '~/trpc/react'; // Using clientApi for client-side mutations
import { toast } from 'react-hot-toast';
import { FaEnvelope, FaSpinner } from 'react-icons/fa';

interface NewsletterFormProps {
  className?: string;
  compact?: boolean; // For a more compact version if needed
}

export const NewsletterForm = ({ className, compact = false }: NewsletterFormProps) => {
  const [email, setEmail] = useState('');

  const subscribeMutation = clientApi.newsletter.subscribe.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "Successfully subscribed to the newsletter!");
      setEmail(''); // Clear input on success
    },
    onError: (error) => {
      toast.error(error.message || "Subscription failed. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    subscribeMutation.mutate({ email });
  };

  if (compact) {
    return (
        <form onSubmit={handleSubmit} className={cn("flex w-full max-w-sm items-center space-x-2", className)}>
            <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={subscribeMutation.isPending}
            className="h-10 flex-1"
            aria-label="Email for newsletter"
            />
            <Button type="submit" disabled={subscribeMutation.isPending} size="icon" className="h-10 w-10" aria-label="Subscribe">
            {subscribeMutation.isPending ? <FaSpinner className="animate-spin h-4 w-4" /> : <FaEnvelope className="h-4 w-4" />}
            </Button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={cn("w-full max-w-lg mx-auto", className)}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="email"
          name="email"
          id="newsletter-email"
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={subscribeMutation.isPending}
          className="h-12 flex-1 px-4 text-base"
          aria-label="Email address for newsletter subscription"
        />
        <Button 
            type="submit" 
            disabled={subscribeMutation.isPending} 
            className="h-12 px-6 text-base"
            loadingText="Subscribing..."
            isLoading={subscribeMutation.isPending}
        >
          Subscribe
        </Button>
      </div>
      <p className="mt-3 text-xs text-center text-muted-foreground">
        By subscribing, you agree to our Privacy Policy. Unsubscribe at any time.
      </p>
    </form>
  );
};

// You'll need a tRPC router for newsletter:
// src/server/api/routers/newsletter.ts
// import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
// import { z } from "zod";
//
// export const newsletterRouter = createTRPCRouter({
//   subscribe: publicProcedure
//     .input(z.object({ email: z.string().email() }))
//     .mutation(async ({ ctx, input }) => {
//       // Check if email already exists
//       const existingSubscriber = await ctx.db.newsletterSubscriber.findUnique({
//         where: { email: input.email },
//       });
//       if (existingSubscriber) {
//         if (existingSubscriber.active) {
//            return { success: true, message: "You are already subscribed!" };
//         } else {
//            // Reactivate existing inactive subscriber
//            await ctx.db.newsletterSubscriber.update({
//                where: { email: input.email },
//                data: { active: true }
//            });
//            return { success: true, message: "Welcome back! You've been resubscribed." };
//         }
//       }
//       await ctx.db.newsletterSubscriber.create({
//         data: { email: input.email, active: true },
//       });
//       return { success: true, message: "Successfully subscribed!" };
//     }),
// });
//
// Remember to add newsletterRouter to your root.ts
```

# src/hooks/useLocalStorage.ts
```ts
// src/hooks/useLocalStorage.ts
"use client"; 

import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';

type UseLocalStorageReturn<T> = [T, Dispatch<SetStateAction<T>>, () => void];

export function useLocalStorage<T>(key: string, initialValue: T): UseLocalStorageReturn<T> {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      if (storedValue === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue); 
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setStoredValue, removeValue];
}
```

# src/utils/api.ts
```ts
// src/utils/api.ts

import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "~/server/api/root";

/**
 * A client-side tRPC API client instance.
 * This is an instance of `createTRPCReact<AppRouter>()`.
 *
 * This object is primarily used in **Client Components** to call tRPC procedures.
 * For **Server Components**, you should use the server-side tRPC caller
 * typically defined in `~/trpc/server.ts` (e.g., `import { api as serverApi } from '~/trpc/server';`).
 * 
 * This file re-exports the client `api` object from `~/trpc/react.tsx` for convenience
 * or if existing code relies on this path. New Client Components should ideally import
 * directly from `~/trpc/react`.
 */
export { api } from "~/trpc/react";

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;

// You can also export other tRPC related utilities or types from here if needed.
// For example, if you had specific error handling helpers for tRPC errors
// that are used across multiple client components.

```

# src/utils/format.ts
```ts
// src/utils/format.ts

/**
 * Formats a number as currency.
 * @param amount The number to format.
 * @param currencyCode The ISO currency code (e.g., "USD", "EUR"). Defaults to "USD".
 * @param locale The locale string (e.g., "en-US", "de-DE"). Defaults to "en-US".
 * @returns A string representing the formatted currency.
 */
export const formatCurrency = (
  amount: number | null | undefined,
  currencyCode = "USD",
  locale = "en-US"
): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    // Return a sensible default or placeholder for invalid input
    // For example, if 0 is a valid display, use it. Otherwise, consider "-".
    const zeroAmount = 0;
     return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(zeroAmount);
  }
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Formats a number with grouped thousands.
 * @param num The number to format.
 * @param locale The locale string (e.g., "en-US", "de-DE"). Defaults to "en-US".
 * @returns A string representing the formatted number.
 */
export const formatNumber = (
  num: number | null | undefined,
  locale = "en-US"
): string => {
  if (num === null || num === undefined || isNaN(num)) {
    return "0"; // Or some other placeholder like "-"
  }
  return new Intl.NumberFormat(locale).format(num);
};

/**
 * Formats a date object or string into a more readable format.
 * @param date The date to format (Date object, ISO string, or timestamp number).
 * @param options Intl.DateTimeFormatOptions to customize the output.
 * @param locale The locale string. Defaults to "en-US".
 * @returns A string representing the formatted date, or an empty string if date is invalid.
 */
export const formatDate = (
  date: Date | string | number | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  locale = "en-US"
): string => {
  if (!date) {
    return "";
  }
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) { // Check if date is valid
        return "Invalid Date";
    }
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      ...options,
    };
    return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
  } catch (error) {
    console.error("Error formatting date:", error);
    return String(date); // Fallback to original string if formatting fails
  }
};
```

# src/env.mjs
```mjs
// src/env.mjs
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url("Invalid DATABASE_URL format"),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    
    // NextAuth.js v5 variables
    AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string().min(32, "AUTH_SECRET must be at least 32 characters long in production")
        : z.string().min(1, "AUTH_SECRET is required for development too"),
    AUTH_URL: z.preprocess(
      (str) => process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : str,
      process.env.VERCEL ? z.string().min(1) : z.string().url().optional()
    ),
    AUTH_TRUST_HOST: z.preprocess(
        (str) => str === "true" || str === "1", 
        z.boolean().optional().default(process.env.NODE_ENV !== "production") // Default true in dev, false in prod unless set
    ),

    // OAuth Providers
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    
    // Discord Provider - Made optional
    AUTH_DISCORD_ID: z.string().optional(),
    AUTH_DISCORD_SECRET: z.string().optional(),

    // Stripe
    STRIPE_SECRET_KEY: z.string().startsWith("sk_").min(1, "Stripe secret key is required"),
    STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),

    // Optional: Email Service
    // RESEND_API_KEY: z.string().optional(),
    // EMAIL_FROM: z.string().email().optional(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_").min(1, "Stripe publishable key is required"),
    NEXT_PUBLIC_SITE_URL: z.string().url("Invalid NEXT_PUBLIC_SITE_URL format"),
    // NEXT_PUBLIC_VERCEL_ANALYTICS_ID: z.string().optional(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    AUTH_DISCORD_ID: process.env.AUTH_DISCORD_ID, 
    AUTH_DISCORD_SECRET: process.env.AUTH_DISCORD_SECRET, 
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    // RESEND_API_KEY: process.env.RESEND_API_KEY,
    // EMAIL_FROM: process.env.EMAIL_FROM,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION || process.env.CI === "true",
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error unless the schema item is `.optional()`.
   */
  emptyStringAsUndefined: true,
});
```

# src/server/db.ts
```ts
// src/server/db.ts
import { PrismaClient } from "@prisma/client";
import { env } from "~/env.mjs";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
```

# src/server/api/trpc.ts
```ts
// src/server/api/trpc.ts
// (Content from previous response - already updated to use `auth()`)
import { initTRPC, TRPCError } from "@trpc/server";
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { type Session } from "next-auth";
import superjson from "superjson";
import { ZodError } from "zod";

import { auth } from "~/server/auth"; 
import { db } from "~/server/db";
import type { Role as PrismaAppRole } from "@prisma/client";
import type { NextRequest } from "next/server";

type CreateInnerContextOptions = {
  session: Session | null;
  headers: Headers; 
};

export const createInnerTRPCContext = (opts: CreateInnerContextOptions) => {
  return {
    session: opts.session,
    db,
    headers: opts.headers,
  };
};

// Context for tRPC Route Handler (e.g., /api/trpc/[trpc]/route.ts)
export const createTRPCContext = async (opts: {
  req: NextRequest; // From Route Handler
  // resHeaders?: Headers; // For setting response headers from context if needed
}) => {
  const session = await auth(); // Uses cookies from NextRequest implicitly
  return createInnerTRPCContext({
    session,
    headers: opts.req.headers,
  });
};

const t = initTRPC.context<Awaited<ReturnType<typeof createTRPCContext>>>().create({ // Ensure context type matches
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// ... rest of the file (createTRPCRouter, procedures) remains the same
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated." });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

const enforceUserIsAdminOrManager = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
     throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated." });
  }
  const userRole = ctx.session.user.role;
  if (userRole !== PrismaAppRole.ADMIN && userRole !== PrismaAppRole.MANAGER) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not have sufficient permissions for this action." });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const adminProcedure = t.procedure.use(enforceUserIsAdminOrManager);

export const roleProtectedProcedure = (allowedRoles: PrismaAppRole[]) =>
  t.procedure.use(
    t.middleware(async ({ ctx, next }) => {
      if (!ctx.session?.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: "Not authenticated." });
      }
      if (!allowedRoles.includes(ctx.session.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: "You do not have the required role for this action." });
      }
      return next({
        ctx: {
          session: { ...ctx.session, user: ctx.session.user },
        },
      });
    })
  );
```

# src/server/api/root.ts
```ts
// src/server/api/root.ts
import { createTRPCRouter } from "~/server/api/trpc";
import { productsRouter } from "~/server/api/routers/products";
import { ordersRouter } from "~/server/api/routers/orders";
import { quizRouter } from "~/server/api/routers/quiz"; 
import { recommendationsRouter } from "~/server/api/routers/recommendations";
import { usersRouter } from "~/server/api/routers/users"; 
import { wishlistRouter } from "~/server/api/routers/wishlist"; 
import { reviewsRouter } from "~/server/api/routers/reviews"; 
import { subscriptionsRouter } from "~/server/api/routers/subscriptions"; 
import { loyaltyRouter } from "~/server/api/routers/loyalty"; 
import { smartHomeRouter } from "~/server/api/routers/smartHome"; 
import { notificationsRouter } from "~/server/api/routers/notifications"; 
import { newsletterRouter } from "~/server/api/routers/newsletter";
import { postRouter } from "~/server/api/routers/post"; // Added postRouter

import { adminProductsRouter } from "~/server/api/routers/admin/products";
import { adminOrdersRouter } from "~/server/api/routers/admin/orders";
import { adminUsersRouter } from "~/server/api/routers/admin/users";
import { adminRolesRouter } from "~/server/api/routers/admin/roles";
import { adminAnalyticsRouter } from "~/server/api/routers/admin/analytics";
import { adminInventoryRouter } from "~/server/api/routers/admin/inventory";
import { adminSettingsRouter } from "~/server/api/routers/admin/settings";

export const appRouter = createTRPCRouter({
  // Public/User-facing routers
  products: productsRouter,
  orders: ordersRouter,
  quiz: quizRouter,
  recommendations: recommendationsRouter,
  users: usersRouter,
  wishlist: wishlistRouter,
  reviews: reviewsRouter,
  subscriptions: subscriptionsRouter,
  loyalty: loyaltyRouter,
  smartHome: smartHomeRouter,
  notifications: notificationsRouter,
  newsletter: newsletterRouter,
  post: postRouter, // Ensured postRouter is included

  // Admin-specific routers nested under 'admin'
  admin: createTRPCRouter({
    products: adminProductsRouter,
    orders: adminOrdersRouter,
    users: adminUsersRouter,
    roles: adminRolesRouter,
    analytics: adminAnalyticsRouter,
    inventory: adminInventoryRouter,
    settings: adminSettingsRouter,
  }),
});

export type AppRouter = typeof appRouter;
```

# src/server/api/routers/newsletter.ts
```ts
// src/server/api/routers/newsletter.ts
import { createTRPCRouter, publicProcedure, adminProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { type Prisma } from "@prisma/client";

export const newsletterRouter = createTRPCRouter({
  subscribe: publicProcedure
    .input(z.object({
      email: z.string().email({ message: "Invalid email address." }),
      name: z.string().optional(),
      source: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { email, name, source } = input;

      const existingSubscriber = await ctx.db.newsletterSubscriber.findUnique({
        where: { email },
      });

      if (existingSubscriber) {
        if (existingSubscriber.active) {
          return { success: true, status: "already_subscribed", message: "You are already subscribed to our newsletter!" };
        } else {
          const updatedSubscriber = await ctx.db.newsletterSubscriber.update({
            where: { email },
            data: { 
              active: true, 
              name: name ?? existingSubscriber.name, 
              source: source ?? existingSubscriber.source,
            },
          });
          return { success: true, status: "reactivated", message: "Welcome back! You've been resubscribed.", subscriber: updatedSubscriber };
        }
      } else {
        const newSubscriber = await ctx.db.newsletterSubscriber.create({
          data: {
            email,
            name,
            active: true,
            source: source ?? "website_form",
          },
        });
        return { success: true, status: "subscribed", message: "Thank you for subscribing to our newsletter!", subscriber: newSubscriber };
      }
    }),

  getAllSubscribers: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).optional().default(20),
      cursor: z.string().optional(),
      search: z.string().optional(),
      active: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { limit, cursor, search, active } = input;
      const where: Prisma.NewsletterSubscriberWhereInput = {};

      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (typeof active === 'boolean') {
        where.active = active;
      }

      const subscribers = await ctx.db.newsletterSubscriber.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where,
        orderBy: { createdAt: 'desc' },
      });

      let nextCursor: string | undefined = undefined;
      if (subscribers.length > limit) {
        const nextItem = subscribers.pop();
        nextCursor = nextItem?.id;
      }
      return { items: subscribers, nextCursor };
    }),
  
  updateSubscriber: adminProcedure
    .input(z.object({
        id: z.string(),
        email: z.string().email().optional(),
        name: z.string().nullable().optional(),
        active: z.boolean().optional(),
        interests: z.array(z.string()).optional(),
    }))
    .mutation(async ({ctx, input}) => {
        const { id, ...updateData } = input;
        try {
            const updatedSubscriber = await ctx.db.newsletterSubscriber.update({
                where: {id},
                data: updateData,
            });
            return updatedSubscriber;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                 const targetFields = error.meta?.target as string[] | undefined;
                 if (targetFields?.includes('email')) { // More robust check
                    throw new TRPCError({ code: "BAD_REQUEST", message: "This email address is already in use by another subscriber." });
                 }
            }
            console.error("Failed to update subscriber:", error); // Generic log for other errors
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update subscriber." });
        }
    }),
  
  unsubscribe: publicProcedure
    .input(z.object({ email: z.string().email(), token: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      // For a public unsubscribe link from an email, a token system is crucial for security.
      // This simple version is suitable if, for example, a user unsubscribes from their account settings page.
      // if (input.token) { /* validate token */ }
      const updatedSubscriber = await ctx.db.newsletterSubscriber.updateMany({
        where: { email: input.email, active: true },
        data: { active: false },
      });
      if (updatedSubscriber.count > 0) {
        return { success: true, message: "You have been unsubscribed." };
      }
      return { success: false, message: "Email not found or already unsubscribed." };
    }),
});
```

# src/server/api/routers/quiz.ts
```ts
// src/server/api/routers/quiz.ts
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { 
    type QuizQuestion as PrismaQuizQuestion, 
    QuizQuestionType as PrismaQuizQuestionType,
    type Prisma 
} from "@prisma/client";
import { TRPCError } from "@trpc/server";

const ZodQuizOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  tags: z.array(z.string()), 
  value: z.string().optional(), 
});
type AdvancedQuizQuestionOption = z.infer<typeof ZodQuizOptionSchema>;

export interface AdvancedQuizQuestionClient extends Omit<PrismaQuizQuestion, 'options' | 'type' | 'createdAt' | 'updatedAt'> {
  type: "single" | "multiple"; 
  options: AdvancedQuizQuestionOption[];
}

function mapPrismaQuestionTypeToClientType(prismaType: PrismaQuizQuestionType): "single" | "multiple" {
  switch (prismaType) {
    case PrismaQuizQuestionType.SINGLE_CHOICE_TEXT:
    case PrismaQuizQuestionType.SINGLE_CHOICE_IMAGE:
    case PrismaQuizQuestionType.SCALE: 
      return "single";
    case PrismaQuizQuestionType.MULTIPLE_CHOICE_TEXT:
    case PrismaQuizQuestionType.MULTIPLE_CHOICE_IMAGE:
      return "multiple";
    case PrismaQuizQuestionType.TEXT_INPUT:
      console.warn(`QuizQuestionType.TEXT_INPUT ('${prismaType}') mapped to 'single'. Client needs specific handling.`);
      return "single"; 
    default:
      // const exhaustiveCheck: never = prismaType; // This causes type error if not all enum values are handled
      console.warn(`Unknown PrismaQuizQuestionType: ${prismaType as string} mapped to 'single'.`);
      return "single"; 
  }
}

export const quizRouter = createTRPCRouter({
  getAdvancedQuizQuestions: publicProcedure
    .query(async ({ ctx }): Promise<AdvancedQuizQuestionClient[]> => {
      try {
        const questionsFromDb = await ctx.db.quizQuestion.findMany({
          orderBy: { order: 'asc' },
        });

        if (questionsFromDb.length === 0) {
            return [];
        }
        
        return questionsFromDb.map((q, index) => {
          let parsedOptions: AdvancedQuizQuestionOption[] = [];
          try {
            if (q.options && Array.isArray(q.options)) {
              const optionsValidation = z.array(ZodQuizOptionSchema).safeParse(q.options);
              if (optionsValidation.success) {
                parsedOptions = optionsValidation.data;
              } else {
                console.error(`[QuizRouter] Invalid options JSON structure for QuizQuestion ID ${q.id} (DB index ${index}):`, optionsValidation.error.flatten().fieldErrors, "Raw options:", JSON.stringify(q.options).substring(0, 200));
              }
            } else if (q.options) { // Not an array but exists
                 console.error(`[QuizRouter] Options for QuizQuestion ID ${q.id} (DB index ${index}) is not an array:`, typeof q.options, JSON.stringify(q.options).substring(0,200));
            }
            // If q.options is null/undefined, parsedOptions remains [] which is acceptable.
          } catch (parseError) {
             console.error(`[QuizRouter] Critical error parsing options for QuizQuestion ID ${q.id} (DB index ${index}):`, parseError, "Raw options:", JSON.stringify(q.options).substring(0, 200));
          }
          
          return {
            id: q.id,
            question: q.question,
            description: q.description,
            order: q.order,
            imageUrl: q.imageUrl,
            tooltipText: q.tooltipText,
            options: parsedOptions,
            type: mapPrismaQuestionTypeToClientType(q.type),
          };
        });
      } catch (error) {
        console.error("[QuizRouter] Failed to fetch or transform advanced quiz questions:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not load quiz questions.",
          cause: error,
        });
      }
    }),

  submitQuizResponses: publicProcedure
    .input(z.object({
      responses: z.array(
        z.object({
          questionId: z.string(), // Changed from .cuid()
          answer: z.array(z.string()), 
        })
      ).min(1, "At least one response is required."),
      sessionId: z.string().optional(), 
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id; 

      if (!userId && !input.sessionId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Session ID is required for anonymous quiz submission.",
        });
      }

      try {
        const createdResponsesData = input.responses.map(response => ({
            questionId: response.questionId,
            answer: response.answer, 
            userId: userId, 
            sessionId: userId ? undefined : input.sessionId, 
        }));

        await ctx.db.quizResponse.createMany({
          data: createdResponsesData,
        });
        
        return { 
          success: true, 
          message: "Your quiz responses have been saved.",
          responseCount: input.responses.length 
        };

      } catch (error) {
        console.error("Failed to submit quiz responses:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2003') { 
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid question ID provided in responses. Please ensure questions exist.",
              cause: error,
            });
          }
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not save your quiz responses.",
          cause: error,
        });
      }
    }),
});
```

# src/server/api/routers/loyalty.ts
```ts
// src/server/api/routers/loyalty.ts
import { protectedProcedure, createTRPCRouter } from "~/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

// Placeholder types, align with Prisma schema
type LoyaltyData = {
  points: number;
  lifetimePoints: number;
  tier: string; // Tier name
  benefits: string[];
  nextTierName?: string;
  pointsToNextTier?: number;
  nextTierBenefits?: string[];
};
type AvailableReward = { id: string; name: string; description?: string | null; pointsCost: number; type: string; value: any; requiredTierId?: string | null; imageUrl?: string | null, expiresAt?: Date | null, tier?: {name: string} | null };
type PointHistoryEntry = { id: string; createdAt: Date; description: string; points: number; type: string; };
type RedemptionHistoryEntry = { id: string; createdAt: Date; reward: { name: string, pointsCost: number, type: string }; status: string; couponCode?: string | null, expiresAt?: Date | null };


export const loyaltyRouter = createTRPCRouter({
  getUserLoyalty: protectedProcedure
    .query(async ({ ctx }): Promise<LoyaltyData> => {
      const userId = ctx.session.user.id;
      console.log("User: Fetching loyalty data for user:", userId);
      // Placeholder: Implement logic to calculate points, determine tier, and fetch benefits
      // This involves querying LoyaltyPointLog, LoyaltyTier, etc.
      // Example structure:
      const currentPoints = await ctx.db.loyaltyPointLog.aggregate({
        _sum: { points: true },
        where: { userId, OR: [{expiresAt: null}, {expiresAt: {gte: new Date()}}] }, // Sum only non-expired points
      });
      const lifetimePoints = await ctx.db.loyaltyPointLog.aggregate({
        _sum: { points: true },
        where: { userId, type: {notIn: ['ADJUST_ADMIN_DEBIT', 'EXPIRE_POINTS', 'REFUND_POINTS', 'REDEEM_REWARD']} }, // Sum only earned points
      });
      
      const tiers = await ctx.db.loyaltyTier.findMany({ orderBy: { minPoints: 'asc' }});
      let currentTier = tiers[0] || { name: "Basic", benefits: [], minPoints: 0 }; // Fallback
      for (const tier of tiers) {
          if ((lifetimePoints._sum.points || 0) >= tier.minPoints) {
              currentTier = tier;
          } else break;
      }
      
      // This is a simplified placeholder:
      return {
        points: currentPoints._sum.points || 0,
        lifetimePoints: lifetimePoints._sum.points || 0,
        tier: currentTier.name,
        benefits: currentTier.benefits as string[] || ["Standard Rewards"],
        nextTierName: "Gold", // Example
        pointsToNextTier: 500, // Example
        nextTierBenefits: ["10% off next purchase"], // Example
      };
    }),

  getAvailableRewards: protectedProcedure
    .query(async ({ ctx }): Promise<AvailableReward[]> => {
      const userId = ctx.session.user.id;
      console.log("User: Fetching available rewards for user:", userId);
      // Placeholder: Fetch rewards, filter by user's tier and points balance
      const rewards = await ctx.db.reward.findMany({
        where: { 
            isActive: true, 
            OR: [ {validUntil: null}, {validUntil: {gte: new Date()}} ],
            // Add tier check based on user's current tier
        },
        include: { tier: { select: { name: true }}},
        orderBy: { pointsCost: 'asc' },
      });
      return rewards.map(r => ({...r, value: r.value as any, description: r.description}));
    }),

  getPointHistory: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(20), cursor: z.string().optional()}))
    .query(async ({ ctx, input }): Promise<{items: PointHistoryEntry[], nextCursor?: string}> => {
      const userId = ctx.session.user.id;
      console.log("User: Fetching point history for user:", userId);
      const logs = await ctx.db.loyaltyPointLog.findMany({
        where: { userId },
        take: input.limit + 1,
        cursor: input.cursor ? {id: input.cursor} : undefined,
        orderBy: { createdAt: 'desc' },
      });
      // ... (implement pagination and return structure)
      return { items: logs.map(l => ({...l, type: l.type.toString()})), nextCursor: undefined };
    }),

  getRedemptionHistory: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(20), cursor: z.string().optional()}))
    .query(async ({ ctx, input }): Promise<{items: RedemptionHistoryEntry[], nextCursor?: string}> => {
      const userId = ctx.session.user.id;
      console.log("User: Fetching redemption history for user:", userId);
      const redemptions = await ctx.db.userReward.findMany({
        where: { userId },
        take: input.limit + 1,
        cursor: input.cursor ? {id: input.cursor} : undefined,
        orderBy: { redeemedAt: 'desc' },
        include: { reward: {select: { name: true, pointsCost: true, type: true }} },
      });
      // ... (implement pagination and return structure)
      return { items: redemptions.map(r => ({...r, status: r.status.toString(), reward: {...r.reward, type: r.reward.type.toString()}})), nextCursor: undefined };
    }),

  redeemReward: protectedProcedure
    .input(z.object({ rewardId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      console.log("User: Redeeming reward:", input.rewardId, "for user:", userId);
      // Placeholder:
      // 1. Fetch reward details (pointsCost, availability, tier requirement)
      // 2. Fetch user's current points and tier
      // 3. Validate if user can redeem (enough points, correct tier, reward active, redemption limits)
      // 4. Start a transaction:
      //    a. Deduct points (create LoyaltyPointLog with negative points)
      //    b. Create UserReward entry
      //    c. If reward type is VOUCHER_CODE, generate and store unique code.
      // 5. Commit transaction
      const reward = await ctx.db.reward.findUnique({ where: {id: input.rewardId }});
      if (!reward) throw new TRPCError({ code: "NOT_FOUND", message: "Reward not found." });
      // ... (add full validation logic)
      
      // This is highly simplified:
      await ctx.db.loyaltyPointLog.create({
        data: { userId, points: -reward.pointsCost, type: "REDEEM_REWARD", description: `Redeemed: ${reward.name}`, userRewardId: "dummy_user_reward_id_link_later" }
      });
      const userReward = await ctx.db.userReward.create({
          data: { userId, rewardId: reward.id, status: "AVAILABLE" /* ... other fields */ }
      });
      // Link back if possible (userRewardId in LoyaltyPointLog)
      return { success: true, message: "Reward redeemed successfully!", redeemedReward: userReward };
    }),
});
```

# src/server/api/routers/subscriptions.ts
```ts
// src/server/api/routers/subscriptions.ts
import { protectedProcedure, createTRPCRouter } from "~/server/api/trpc";
import { z } from "zod";
import { SubscriptionFrequency, SubscriptionStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export const subscriptionsRouter = createTRPCRouter({
  getUserSubscriptions: protectedProcedure // Active and Paused subscriptions
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      console.log("User: Fetching active subscriptions for user:", userId);
      return ctx.db.productSubscription.findMany({
        where: { userId, status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAUSED] } },
        include: { 
            product: { include: { images: {take: 1, orderBy: {position: 'asc'}} } } 
            // variant: true, // If supporting variant subscriptions
        },
        orderBy: { createdAt: 'desc' },
      });
    }),

  getSubscriptionHistory: protectedProcedure // Cancelled or Expired subscriptions
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      console.log("User: Fetching subscription history for user:", userId);
      return ctx.db.productSubscription.findMany({
        where: { userId, status: { in: [SubscriptionStatus.CANCELLED, SubscriptionStatus.EXPIRED] } },
        include: { product: { include: { images: {take: 1, orderBy: {position: 'asc'}} } } },
        orderBy: { cancelledAt: 'desc' }, // Or updatedAt
      });
    }),
    
  getRecommendedProducts: protectedProcedure // Products suitable for subscription
    .query(async ({ctx}) => {
        console.log("User: Fetching recommended products for subscription");
        // Placeholder: Logic to find products good for subscription
        // e.g., consumables, frequently bought items, items with a "subscribable" flag
        return ctx.db.product.findMany({
            where: { inStock: true, publishedAt: {not: null, lte: new Date()} /* Add more filters */},
            take: 4,
            include: { images: {take: 1, orderBy: {position: 'asc'}} }
        });
    }),

  createSubscription: protectedProcedure
    .input(z.object({
      productId: z.string(),
      variantId: z.string().optional().nullable(),
      frequency: z.nativeEnum(SubscriptionFrequency),
      // startDate: z.date().optional(), // If user can choose start date
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      console.log("User: Creating subscription for user:", userId, "Product:", input.productId);
      // Placeholder:
      // 1. Check product/variant eligibility for subscription
      // 2. Potentially create a Stripe Subscription and store stripeSubscriptionId
      // 3. Calculate nextBillingDate and nextShipDate
      const nextBillingDate = new Date(); // Simplification
      // Add logic based on frequency:
      if (input.frequency === "MONTHLY") nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      // ... other frequencies ...

      return ctx.db.productSubscription.create({
        data: {
          userId,
          productId: input.productId,
          variantId: input.variantId,
          frequency: input.frequency,
          status: SubscriptionStatus.ACTIVE,
          nextBillingDate: nextBillingDate,
          nextShipDate: nextBillingDate, // Assuming ship immediately after billing
          // stripeSubscriptionId: "stripe_sub_id_placeholder",
        },
      });
    }),

  updateSubscription: protectedProcedure
    .input(z.object({
      id: z.string(), // Subscription ID
      frequency: z.nativeEnum(SubscriptionFrequency).optional(),
      nextBillingDate: z.string().datetime().optional(), // Allow changing next billing date
      // variantId: z.string().optional(), // Allow changing variant
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      console.log("User: Updating subscription:", input.id);
      const { id, ...updateData } = input;
      // Placeholder: Update Stripe subscription if frequency/plan changes
      // Recalculate nextShipDate if nextBillingDate changes
      return ctx.db.productSubscription.updateMany({ // updateMany to ensure ownership
        where: { id, userId },
        data: {
            ...updateData,
            nextBillingDate: input.nextBillingDate ? new Date(input.nextBillingDate) : undefined,
            // If nextBillingDate changed, nextShipDate should probably also change
            nextShipDate: input.nextBillingDate ? new Date(input.nextBillingDate) : undefined,
        },
      });
    }),

  pauseSubscription: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      console.log("User: Pausing subscription:", input.id);
      // Placeholder: Pause Stripe subscription if applicable
      return ctx.db.productSubscription.updateMany({
        where: { id: input.id, userId, status: SubscriptionStatus.ACTIVE },
        data: { status: SubscriptionStatus.PAUSED },
      });
    }),

  resumeSubscription: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      console.log("User: Resuming subscription:", input.id);
      // Placeholder: Resume Stripe subscription, recalculate next billing/ship date
      return ctx.db.productSubscription.updateMany({
        where: { id: input.id, userId, status: SubscriptionStatus.PAUSED },
        data: { status: SubscriptionStatus.ACTIVE /*, nextBillingDate: ... */ },
      });
    }),

  cancelSubscription: protectedProcedure
    .input(z.object({ id: z.string(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      console.log("User: Cancelling subscription:", input.id);
      // Placeholder: Cancel Stripe subscription
      return ctx.db.productSubscription.updateMany({
        where: { id: input.id, userId, status: { notIn: [SubscriptionStatus.CANCELLED, SubscriptionStatus.EXPIRED] } },
        data: { status: SubscriptionStatus.CANCELLED, cancelledAt: new Date() },
      });
    }),
    
  skipNextDelivery: protectedProcedure
    .input(z.object({id: z.string()}))
    .mutation(async ({ctx, input}) => {
        const userId = ctx.session.user.id;
        console.log("User: Skipping next delivery for subscription:", input.id);
        // Placeholder:
        // 1. Find current subscription
        // 2. Calculate the *new* nextBillingDate and nextShipDate by advancing one cycle
        // 3. Update Stripe subscription if needed (e.g. if it's usage-based or to skip one invoice)
        // 4. Update local DB record
        // This is complex; for now, just log.
        return {success: true, message: "Next delivery skipped (placeholder)."};
    }),
});
```

# src/server/api/routers/admin/settings.ts
```ts
// src/server/api/routers/admin/settings.ts
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

// Zod schema for SiteSettings (matching Prisma model structure for Json fields)
const SocialLinksSchema = z.record(z.string().url()).optional().nullable(); // { platform: url }
const ShippingMethodSchema = z.object({
  id: z.string(),
  name: z.string(),
  cost: z.number(),
  estimatedDelivery: z.string(),
  regions: z.array(z.string()).optional(), // e.g., array of country codes or state codes
});
const TaxRateSchema = z.object({
  region: z.string(), // e.g., "CA", "NY", or "*" for default
  rate: z.number().min(0).max(1), // e.g., 0.08 for 8%
  name: z.string().optional(), // e.g., "Sales Tax"
  inclusive: z.boolean().optional().default(false), // Is tax included in price
});
const StoreAddressSchema = z.object({
    line1: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
}).optional().nullable();

const SiteSettingsInputSchema = z.object({
  siteName: z.string().min(1).optional(),
  logoUrl: z.string().url().nullable().optional(),
  faviconUrl: z.string().url().nullable().optional(),
  primaryColor: z.string().regex(/^#([0-9a-f]{3}){1,2}$/i, "Invalid hex color").optional(),
  secondaryColor: z.string().regex(/^#([0-9a-f]{3}){1,2}$/i, "Invalid hex color").optional(),
  accentColor: z.string().regex(/^#([0-9a-f]{3}){1,2}$/i, "Invalid hex color").optional(),
  defaultCurrency: z.string().length(3).toUpperCase().optional(), // ISO 4217
  defaultLanguage: z.string().length(2).toLowerCase().optional(), // ISO 639-1
  contactEmail: z.string().email().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  socialLinks: SocialLinksSchema,
  shippingMethods: z.array(ShippingMethodSchema).nullable().optional(),
  taxRates: z.array(TaxRateSchema).nullable().optional(),
  defaultMetaTitle: z.string().nullable().optional(),
  defaultMetaDescription: z.string().nullable().optional(),
  maintenanceMode: z.boolean().optional(),
  storeAddress: StoreAddressSchema,
});


export const adminSettingsRouter = createTRPCRouter({
  getSiteSettings: adminProcedure
    .query(async ({ ctx }) => {
      console.log("Admin: Fetching site settings");
      const settings = await ctx.db.siteSettings.findUnique({
        where: { id: "global_settings" },
      });
      if (!settings) { // Should ideally be seeded
        // Create default settings if they don't exist
        return ctx.db.siteSettings.create({ data: { id: "global_settings" }});
      }
      return settings;
    }),

  updateSiteSettings: adminProcedure
    .input(SiteSettingsInputSchema)
    .mutation(async ({ ctx, input }) => {
      console.log("Admin: Updating site settings with input:", input);
      // Ensure fields that should be JSON are correctly structured if not null
      const dataToUpdate = {
        ...input,
        socialLinks: input.socialLinks === undefined ? undefined : (input.socialLinks ?? Prisma.JsonNull),
        shippingMethods: input.shippingMethods === undefined ? undefined : (input.shippingMethods ?? Prisma.JsonNull),
        taxRates: input.taxRates === undefined ? undefined : (input.taxRates ?? Prisma.JsonNull),
        storeAddress: input.storeAddress === undefined ? undefined : (input.storeAddress ?? Prisma.JsonNull),
      };
      
      return ctx.db.siteSettings.update({
        where: { id: "global_settings" },
        data: dataToUpdate,
      });
    }),
});
```

# src/server/api/routers/admin/orders.ts
```ts
// src/server/api/routers/admin/orders.ts
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { z } from "zod";
import { OrderStatus, type Prisma } from "@prisma/client"; // Import OrderStatus enum
import { TRPCError } from "@trpc/server";

export const adminOrdersRouter = createTRPCRouter({
  getAllOrders: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).optional().default(20),
      cursor: z.string().optional(), // Order ID for cursor
      status: z.nativeEnum(OrderStatus).optional(),
      searchQuery: z.string().optional(), // Search by order number, customer name/email
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { limit, cursor, status, searchQuery, dateFrom, dateTo } = input;
      console.log("Admin: Fetching all orders with input:", input);
      
      const where: Prisma.OrderWhereInput = {};
      if (status) where.status = status;
      if (searchQuery) {
        where.OR = [
          { orderNumber: { contains: searchQuery, mode: 'insensitive' } },
          { user: { name: { contains: searchQuery, mode: 'insensitive' } } },
          { user: { email: { contains: searchQuery, mode: 'insensitive' } } },
        ];
      }
      if (dateFrom) where.createdAt = { ...where.createdAt, gte: new Date(dateFrom) };
      if (dateTo) where.createdAt = { ...where.createdAt, lte: new Date(dateTo) };

      const orders = await ctx.db.order.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where,
        orderBy: { createdAt: 'desc' },
        include: { 
            user: { select: { id: true, name: true, email: true } },
            orderItems: { take: 1, select: { name: true, quantity: true }} // Minimal include for list view
        },
      });

      let nextCursor: string | undefined = undefined;
      if (orders.length > limit) {
        const nextItem = orders.pop();
        nextCursor = nextItem?.id;
      }
      
      return { 
        items: orders.map(o => ({ // Convert Decimals
            ...o,
            subtotal: parseFloat(o.subtotal.toString()),
            shippingCost: parseFloat(o.shippingCost.toString()),
            tax: parseFloat(o.tax.toString()),
            discountAmount: parseFloat(o.discountAmount.toString()),
            total: parseFloat(o.total.toString()),
        })), 
        nextCursor 
      };
    }),

  getOrderDetails: adminProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      console.log("Admin: Fetching order details for ID:", input.orderId);
      const order = await ctx.db.order.findUnique({
        where: { id: input.orderId },
        include: {
          user: true,
          orderItems: { include: { product: {select: {name: true, slug: true}}, variant: {select: {name: true}} } },
          history: { orderBy: { createdAt: 'desc' } },
        },
      });
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
      
      return { // Convert Decimals
        ...order,
        subtotal: parseFloat(order.subtotal.toString()),
        shippingCost: parseFloat(order.shippingCost.toString()),
        tax: parseFloat(order.tax.toString()),
        discountAmount: parseFloat(order.discountAmount.toString()),
        total: parseFloat(order.total.toString()),
        orderItems: order.orderItems.map(item => ({
            ...item,
            price: parseFloat(item.price.toString()),
            subtotal: parseFloat(item.subtotal.toString()),
        }))
      };
    }),

  updateOrderStatus: adminProcedure
    .input(z.object({
      orderId: z.string(),
      status: z.nativeEnum(OrderStatus),
      trackingNumber: z.string().optional().nullable(),
      notes: z.string().optional().nullable(), // Admin notes for this status update
      notifyCustomer: z.boolean().optional().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("Admin: Updating order status:", input);
      const { orderId, status, trackingNumber, notes, notifyCustomer } = input;

      const updatedOrder = await ctx.db.order.update({
        where: { id: orderId },
        data: {
          status,
          trackingNumber: trackingNumber, // Only update if provided
          history: {
            create: {
              status,
              comment: `Status updated to ${status} by admin. ${notes || ''}`,
              createdBy: ctx.session.user.id,
            },
          },
        },
      });

      if (notifyCustomer) {
        // TODO: Implement actual notification logic (email, in-app)
        console.log(`Notification to customer for order ${orderId}: status changed to ${status}`);
        await ctx.db.notification.create({
            data: {
                userId: updatedOrder.userId,
                type: "ORDER_STATUS_UPDATE",
                title: `Your Order #${updatedOrder.orderNumber} Updated`,
                message: `Your order status is now: ${status}.${trackingNumber ? ` Tracking: ${trackingNumber}` : ''}`,
                link: `/account/orders/${orderId}`,
                data: { orderId, newStatus: status }
            }
        })
      }
      return updatedOrder;
    }),
    
  processRefund: adminProcedure
    .input(z.object({
        orderId: z.string(),
        amount: z.number().positive("Refund amount must be positive."),
        reason: z.string().optional(),
        // itemsToRefund: z.array(z.object({ orderItemId: z.string(), quantity: z.number().int().positive() })).optional(), // For partial refunds
    }))
    .mutation(async ({ctx, input}) => {
        console.log("Admin: Processing refund for order:", input.orderId);
        // Placeholder: Implement Stripe refund logic and update order/inventory
        // const order = await ctx.db.order.findUnique(...);
        // if (!order || !order.paymentIntentId) throw new TRPCError...
        // await stripe.refunds.create({ payment_intent: order.paymentIntentId, amount: input.amount * 100 });
        // await ctx.db.order.update(... status: REFUNDED/PARTIALLY_REFUNDED, refundAmount ...);
        return { success: true, message: "Refund processed (placeholder)." };
    })
});
```

# src/server/api/routers/admin/inventory.ts
```ts
// src/server/api/routers/admin/inventory.ts
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { z } from "zod";
import { type Prisma } from "@prisma/client"; // For types if needed

const PurchaseOrderInputSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1),
  expectedDelivery: z.string().datetime(), // Or z.date()
  supplierId: z.string(),
  unitCost: z.number().min(0),
});

export const adminInventoryRouter = createTRPCRouter({
  getInventoryForecasts: adminProcedure
    .input(z.object({
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional(),
      productId: z.string().optional(),
      categoryId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      console.log("Admin: Fetching inventory forecasts with input:", input);
      // Placeholder: Implement actual forecast logic
      // This would query sales data, current stock, lead times, etc.
      return {
        products: [/* array of products with forecast data */],
        demandByCategory: [/* { name: string, value: number } */],
        demandTrend: [/* { date: string, historical: number, forecasted: number } */],
        topProducts: [/* { name: string, forecast: number, stock: number } */],
        purchaseOrders: [/* array of existing purchase orders */],
      };
    }),

  getSuppliers: adminProcedure
    .query(async ({ ctx }) => {
      console.log("Admin: Fetching suppliers");
      return ctx.db.supplier.findMany();
    }),

  createPurchaseOrder: adminProcedure
    .input(PurchaseOrderInputSchema)
    .mutation(async ({ ctx, input }) => {
      console.log("Admin: Creating purchase order with input:", input);
      // Placeholder: Implement PO creation
      // const newPO = await ctx.db.purchaseOrder.create({ data: { ... } });
      // return newPO;
      return { id: "po_dummy_" + Date.now(), ...input, status: "PENDING", totalCost: input.quantity * input.unitCost };
    }),
  
  generatePurchaseOrders: adminProcedure
    .input(z.object({
      daysToForecast: z.number().int().min(1).default(30),
      lowStockThresholdMultiplier: z.number().min(0).default(1.5),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("Admin: Generating automatic purchase orders with input:", input);
      // Placeholder: Implement complex logic to analyze stock, forecast, and create POs
      return { count: 0, message: "Automatic PO generation not yet implemented." };
    }),
});
```

# src/server/api/routers/admin/products.ts
```ts
// src/server/api/routers/admin/products.ts
import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { type Prisma } from "@prisma/client";

const ProductInputSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0.01, "Price must be positive"),
  compareAtPrice: z.number().min(0).nullable().optional(),
  costPrice: z.number().min(0).nullable().optional(),
  sku: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  weight: z.number().min(0).nullable().optional(),
  dimensions: z.object({
    length: z.number().min(0).optional(),
    width: z.number().min(0).optional(),
    height: z.number().min(0).optional(),
  }).nullable().optional(),
  stockQuantity: z.number().int().min(0).nullable().optional(),
  lowStockThreshold: z.number().int().min(0).optional().default(5),
  categoryIds: z.array(z.string()).optional().default([]),
  tagIds: z.array(z.string()).optional().default([]),
  collectionIds: z.array(z.string()).optional().default([]),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  inStock: z.boolean().optional().default(true),
  featured: z.boolean().optional().default(false),
  bestSeller: z.boolean().optional().default(false),
  isNew: z.boolean().optional().default(false),
  onSale: z.boolean().optional().default(false),
  saleEndDate: z.date().nullable().optional(),
  publishedAt: z.date().nullable().optional(),
  modelUrl: z.string().url().nullable().optional(),
});

export const adminProductsRouter = createTRPCRouter({
  getAll: adminProcedure
    .input(z.object({
        limit: z.number().optional().default(20),
        cursor: z.string().optional(),
        search: z.string().optional(),
        categoryId: z.string().optional(),
        tagId: z.string().optional(),
        collectionId: z.string().optional(),
        stockStatus: z.enum(["in_stock", "low_stock", "out_of_stock"]).optional(),
        publishStatus: z.enum(["published", "draft", "scheduled"]).optional(),
        sortBy: z.string().optional().default("createdAt_desc"),
    }))
    .query(async ({ ctx, input }) => {
        const { limit, cursor, search, categoryId, tagId, collectionId, stockStatus, publishStatus, sortBy } = input;
        
        const where: Prisma.ProductWhereInput = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
            ];
        }
        if (categoryId) where.categories = { some: { id: categoryId } };
        if (tagId) where.tags = { some: { id: tagId }};
        if (collectionId) where.collections = { some: { id: collectionId }};

        // Corrected stockStatus logic
        if (stockStatus === "out_of_stock") {
            where.stockQuantity = { lte: 0 };
        } else if (stockStatus === "low_stock") {
            // This assumes 'low stock' means stock is positive but at or below a certain threshold.
            // Prisma cannot directly compare product.stockQuantity with product.lowStockThreshold in a WHERE clause.
            // A common simplification is to use a fixed value for "low" or filter in application code after fetching.
            // Here, we use a fixed threshold (e.g., 10) as an example.
            where.AND = [
                { stockQuantity: { gt: 0 } }, 
                { stockQuantity: { lte: 10 } } // Example fixed low stock threshold
            ];
        } else if (stockStatus === "in_stock") {
             where.stockQuantity = { gt: 10 }; // Example: stock greater than the fixed low stock threshold
        }

        if (publishStatus === "published") where.publishedAt = { not: null, lte: new Date() };
        else if (publishStatus === "draft") where.publishedAt = null;
        else if (publishStatus === "scheduled") where.publishedAt = { gt: new Date() };
        
        const orderBy: Prisma.ProductOrderByWithRelationInput = {};
        if (sortBy === 'name_asc') orderBy.name = 'asc';
        else if (sortBy === 'name_desc') orderBy.name = 'desc';
        else if (sortBy === 'price_asc') orderBy.price = 'asc';
        else if (sortBy === 'price_desc') orderBy.price = 'desc';
        else if (sortBy === 'stockQuantity_asc') orderBy.stockQuantity = 'asc';
        else if (sortBy === 'stockQuantity_desc') orderBy.stockQuantity = 'desc';
        else orderBy.createdAt = 'desc';

        const products = await ctx.db.product.findMany({
            take: limit + 1,
            cursor: cursor ? { id: cursor } : undefined,
            where,
            orderBy,
            include: {
                categories: { select: { id: true, name: true } },
                images: { take: 1, orderBy: { position: 'asc'}, select: { url: true, altText: true } },
                variants: { select: { id: true, name: true, sku: true, stockQuantity: true, price: true } },
            },
        });

        let nextCursor: typeof cursor | undefined = undefined;
        if (products.length > limit) {
            const nextItem = products.pop();
            nextCursor = nextItem?.id;
        }
        
        return {
            items: products.map(p => ({
                ...p,
                price: parseFloat(p.price.toString()),
                compareAtPrice: p.compareAtPrice ? parseFloat(p.compareAtPrice.toString()) : null,
                costPrice: p.costPrice ? parseFloat(p.costPrice.toString()) : null,
                variants: p.variants.map(v => ({...v, price: v.price ? parseFloat(v.price.toString()): null}))
            })),
            nextCursor,
        };
    }),
  
  getById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUnique({
        where: { id: input.id },
        include: {
          images: { orderBy: { position: 'asc' } },
          categories: { select: { id: true } }, 
          tags: { select: { id: true } },       
          collections: { select: { id: true } }, 
          variants: { orderBy: [{ isDefault: 'desc' }, { name: 'asc' }] },
        },
      });
      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }
      return {
        ...product,
        price: parseFloat(product.price.toString()),
        compareAtPrice: product.compareAtPrice ? parseFloat(product.compareAtPrice.toString()) : null,
        costPrice: product.costPrice ? parseFloat(product.costPrice.toString()) : null,
        variants: product.variants.map(v => ({...v, price: v.price ? parseFloat(v.price.toString()): null, stockQuantity: v.stockQuantity ?? 0}))
      };
    }),

  createProduct: adminProcedure
    .input(ProductInputSchema) 
    .mutation(async ({ ctx, input }) => {
      const { categoryIds, tagIds, collectionIds, ...productData } = input;
      
      const existingSlug = await ctx.db.product.findUnique({ where: { slug: productData.slug } });
      if (existingSlug) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Slug already exists. Please choose a unique slug.' });
      }

      const product = await ctx.db.product.create({
        data: {
          ...productData,
          categories: { connect: categoryIds.map(id => ({ id })) },
          tags: { connect: tagIds.map(id => ({ id })) },
          collections: { connect: collectionIds?.map(id => ({ id })) },
        },
      });
      return product;
    }),

  updateProduct: adminProcedure
    .input(ProductInputSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, categoryIds, tagIds, collectionIds, ...productData } = input;

      if (productData.slug) {
          const existingSlug = await ctx.db.product.findFirst({ where: { slug: productData.slug, NOT: { id } } });
          if (existingSlug) {
              throw new TRPCError({ code: 'BAD_REQUEST', message: 'Slug already exists. Please choose a unique slug.' });
          }
      }

      const product = await ctx.db.product.update({
        where: { id },
        data: {
          ...productData,
          categories: { set: categoryIds.map(id => ({ id })) },
          tags: { set: tagIds.map(id => ({ id })) },
          collections: { set: collectionIds?.map(id => ({ id })) },
        },
      });
      return product;
    }),

  deleteProduct: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db.product.delete({ where: { id: input.id } });
        return { success: true, message: "Product deleted successfully." };
      } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2003') { 
              throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot delete product. It is referenced in orders or other essential records.'});
            }
            if (error.code === 'P2025') {
              throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found for deletion.' });
            }
          }
          console.error("Error deleting product:", error);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete product.' });
      }
    }),
    
    getAllCategories: adminProcedure.query(async ({ctx}) => {
        return ctx.db.category.findMany({orderBy: {name: 'asc'}});
    }),
    getAllTags: adminProcedure.query(async ({ctx}) => {
        return ctx.db.tag.findMany({orderBy: {name: 'asc'}});
    }),
    getAllCollections: adminProcedure.query(async ({ctx}) => {
        return ctx.db.collection.findMany({orderBy: {name: 'asc'}});
    }),
});
```

# src/server/api/routers/admin/users.ts
```ts
// src/server/api/routers/admin/users.ts
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { z } from "zod";
import { Role as PrismaRole, type Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
// import { hash } from "bcryptjs"; // If allowing admin to set/reset passwords

export const adminUsersRouter = createTRPCRouter({
  getAdminUsers: adminProcedure // Or a more specific role check if MANAGERS can't see all admins
    .input(z.object({
        limit: z.number().optional().default(20),
        cursor: z.string().optional(),
        search: z.string().optional(),
        roleId: z.string().optional(), // Filter by RoleDefinition ID
    }))
    .query(async ({ ctx, input }) => {
      console.log("Admin: Fetching admin users with input:", input);
      const { limit, cursor, search, roleId } = input;
      const where: Prisma.UserWhereInput = {
        // Filter for users who are ADMIN or MANAGER or have a roleDefinitionId
        OR: [
            { role: { in: [PrismaRole.ADMIN, PrismaRole.MANAGER] } },
            { roleDefinitionId: { not: null } }
        ]
      };
      if (search) {
        where.AND = [
            ...(where.AND as Prisma.UserWhereInput[] || []), // Keep existing AND conditions
            { OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ]}
        ];
      }
      if (roleId) {
        where.AND = [
            ...(where.AND as Prisma.UserWhereInput[] || []),
            { roleDefinitionId: roleId }
        ];
      }

      const users = await ctx.db.user.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where,
        orderBy: { createdAt: 'desc' },
        include: { definedRole: { select: { id: true, name: true } } },
      });
      
      let nextCursor: string | undefined = undefined;
      if (users.length > limit) {
        const nextItem = users.pop();
        nextCursor = nextItem?.id;
      }
      return { items: users, nextCursor };
    }),

  createAdminUser: adminProcedure // Only super ADMIN should do this typically
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
      role: z.nativeEnum(PrismaRole).optional(), // Simple role
      roleDefinitionId: z.string().optional(), // Advanced role
      // password: z.string().min(8).optional(), // If admin sets initial password
      sendInvite: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("Admin: Creating admin user:", input.email);
      const existingUser = await ctx.db.user.findUnique({ where: { email: input.email }});
      if (existingUser) throw new TRPCError({ code: "BAD_REQUEST", message: "User with this email already exists."});

      // const hashedPassword = input.password ? await hash(input.password, 12) : undefined;

      const newUser = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          emailVerified: input.sendInvite ? null : new Date(), // Mark as verified if not sending invite
          // password: hashedPassword,
          role: input.roleDefinitionId ? PrismaRole.MANAGER : (input.role || PrismaRole.MANAGER), // Assign default if using simple roles
          roleDefinitionId: input.roleDefinitionId,
        },
      });
      if (input.sendInvite) {
        // TODO: Implement email invitation logic (e.g., send verification token or temporary password)
        console.log(`Placeholder: Send invite to ${newUser.email}`);
      }
      return newUser;
    }),

  updateUserRoleOrDetails: adminProcedure
    .input(z.object({
      userId: z.string(),
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      role: z.nativeEnum(PrismaRole).optional(),
      roleDefinitionId: z.string().nullable().optional(), // Allow unsetting advanced role
      // isActive: z.boolean().optional(), // For activate/deactivate - handle via toggleUserStatus
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId, ...updateData } = input;
      console.log("Admin: Updating user details/role for:", userId);
      
      // Prevent self-role modification to avoid lockout, or demoting last admin
      if (userId === ctx.session.user.id && (updateData.role || updateData.roleDefinitionId !== undefined)) {
          // Add more checks if this is the only admin user
          // throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot modify your own role." });
      }

      return ctx.db.user.update({
        where: { id: userId },
        data: {
            ...updateData,
            roleDefinitionId: updateData.roleDefinitionId // Handles null to unset
        },
      });
    }),
    
  toggleUserStatus: adminProcedure // Placeholder for activate/deactivate (needs an 'isActive' field on User model)
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ctx, input}) => {
        console.log("Admin: Toggling user status for:", input.userId);
        // const user = await ctx.db.user.findUnique({where: {id: input.userId}});
        // if (!user) throw new TRPCError({code: 'NOT_FOUND'});
        // return ctx.db.user.update({ where: {id: input.userId}, data: { isActive: !user.isActive }});
        return { success: true, message: "User status toggled (placeholder - needs isActive field)." };
    }),

  getAllCustomers: adminProcedure // For general customer listing if needed
    .input(z.object({
        limit: z.number().optional().default(20),
        cursor: z.string().optional(),
        search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
        // Similar to getAdminUsers but filters for CUSTOMER role
        // ... implementation ...
        return { items: [], nextCursor: undefined, message: "Customer listing not fully implemented." };
    })
});
```

# src/server/api/routers/admin/analytics.ts
```ts
// src/server/api/routers/admin/analytics.ts
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { z } from "zod";
import { formatCurrency, formatNumber } from "~/utils/format"; // Assuming format utils

// Types for dashboard stats (mirroring what AdminDashboard.tsx might expect)
interface DashboardStat {
  totalSales: number;
  salesGrowth: number; // percentage
  newOrders: number;
  orderGrowth: number; // percentage
  newCustomers: number;
  customerGrowth: number; // percentage
  conversionRate: number; // percentage
  conversionGrowth: number; // percentage
  salesChart: { date: string; revenue: number; orders?: number }[]; // Example structure for chart
}

export const adminAnalyticsRouter = createTRPCRouter({
  getDashboardStats: adminProcedure
    .input(z.object({
      dateRange: z.enum(["today", "week", "month", "year"]).optional().default("month"),
    }))
    .query(async ({ ctx, input }): Promise<DashboardStat> => {
      // Placeholder: Fetch and calculate dashboard statistics based on dateRange
      // This would involve complex DB queries and aggregations.
      console.log("Fetching admin dashboard stats for range:", input.dateRange);
      // Simulate data
      return {
        totalSales: Math.random() * 100000,
        salesGrowth: (Math.random() - 0.5) * 20, // Random +/- 10%
        newOrders: Math.floor(Math.random() * 1000),
        orderGrowth: (Math.random() - 0.5) * 15,
        newCustomers: Math.floor(Math.random() * 500),
        customerGrowth: (Math.random() - 0.5) * 10,
        conversionRate: Math.random() * 5,
        conversionGrowth: (Math.random() - 0.5) * 5,
        salesChart: [
          { date: "Jan", revenue: 12000, orders: 50 },
          { date: "Feb", revenue: 18000, orders: 70 },
          { date: "Mar", revenue: 15000, orders: 60 },
        ],
      };
    }),

  getAdvancedMetrics: adminProcedure
    .input(z.object({
        from: z.string(), // ISO date string
        to: z.string(),   // ISO date string
        metrics: z.array(z.enum(["revenue", "orders", "customers", "aov", "conversion", "retention"])),
        dimension: z.enum(["day", "week", "month", "quarter", "year", "category", "product", "channel"]),
    }))
    .query(async ({ctx, input}) => {
        // Placeholder for complex advanced analytics query
        console.log("Fetching advanced metrics:", input);
        // This would require significant backend logic to query and aggregate data
        return {
            totals: { revenue: 123456.78, orders: 1234, customers: 345, conversion: 2.5 },
            changes: { revenue: 10.5, orders: 5.2, customers: 8.1, conversion: 0.5 },
            timeSeries: [
                { date: "2023-01-01", revenue: 5000, orders: 50 },
                { date: "2023-01-02", revenue: 6000, orders: 60 },
            ],
            // other data based on dimension
        };
    }),
    
  // Add other analytics procedures (getCustomerSegments, getProductPerformance, etc.)
  // These will be complex queries.
});
```

# src/server/api/routers/admin/roles.ts
```ts
// src/server/api/routers/admin/roles.ts
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

const RoleInputSchema = z.object({
  name: z.string().min(2, "Role name must be at least 2 characters"),
  description: z.string().optional(),
  permissionIds: z.array(z.string()), // Array of Permission IDs
});

export const adminRolesRouter = createTRPCRouter({
  getAllRoles: adminProcedure
    .query(async ({ ctx }) => {
      console.log("Admin: Fetching all role definitions");
      return ctx.db.roleDefinition.findMany({
        include: {
          _count: { select: { users: true, permissions: true } },
        },
        orderBy: { name: 'asc' },
      });
    }),

  getAllPermissions: adminProcedure
    .query(async ({ ctx }) => {
      console.log("Admin: Fetching all permissions");
      return ctx.db.permission.findMany({
        orderBy: [{ category: 'asc' }, { subject: 'asc' }, { action: 'asc' }],
      });
    }),

  createRole: adminProcedure
    .input(RoleInputSchema)
    .mutation(async ({ ctx, input }) => {
      console.log("Admin: Creating role:", input.name);
      const existingRole = await ctx.db.roleDefinition.findUnique({ where: { name: input.name }});
      if (existingRole) throw new TRPCError({ code: "BAD_REQUEST", message: "Role name already exists."});

      return ctx.db.roleDefinition.create({
        data: {
          name: input.name,
          description: input.description,
          permissions: {
            create: input.permissionIds.map(pid => ({ permissionId: pid })),
          },
        },
      });
    }),

  updateRole: adminProcedure
    .input(RoleInputSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, name, description, permissionIds } = input;
      console.log("Admin: Updating role:", id);

      const role = await ctx.db.roleDefinition.findUnique({ where: {id} });
      if (!role) throw new TRPCError({ code: "NOT_FOUND", message: "Role not found." });
      if (role.isSystemRole) throw new TRPCError({ code: "BAD_REQUEST", message: "System roles cannot be modified." });

      // Handle permissions: disconnect all old, connect all new.
      // More sophisticated would be to diff and only connect/disconnect changed ones.
      return ctx.db.roleDefinition.update({
        where: { id },
        data: {
          name,
          description,
          permissions: {
            deleteMany: {}, // Delete all existing permission assignments for this role
            create: permissionIds.map(pid => ({ permissionId: pid })), // Create new ones
          },
        },
      });
    }),

  deleteRole: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      console.log("Admin: Deleting role:", input.id);
      const role = await ctx.db.roleDefinition.findUnique({ where: {id}, include: {_count: {select: {users: true}}}});
      if (!role) throw new TRPCError({ code: "NOT_FOUND", message: "Role not found." });
      if (role.isSystemRole) throw new TRPCError({ code: "BAD_REQUEST", message: "System roles cannot be deleted." });
      if (role._count.users > 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot delete role, users are still assigned to it." });

      // Permissions are cascade deleted due to relation if RoleDefinition is deleted
      return ctx.db.roleDefinition.delete({ where: { id: input.id } });
    }),
});
```

# src/server/api/routers/smartHome.ts
```ts
// src/server/api/routers/smartHome.ts
import { protectedProcedure, createTRPCRouter } from "~/server/api/trpc";
import { z } from "zod";
import { SmartHomeDeviceType, AutomationTriggerType } from "@prisma/client";

// Placeholder types, should match Prisma schema for JSON fields if possible
const ScentScheduleEntrySchema = z.object({
    id: z.string().cuid(),
    scentProductId: z.string(),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format HH:mm"), // HH:mm
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format HH:mm"),
    daysOfWeek: z.array(z.number().int().min(0).max(6)), // 0=Sun, 6=Sat
    intensity: z.number().int().min(1).max(10).optional(),
});

export const smartHomeRouter = createTRPCRouter({
  getConnectedPlatforms: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      console.log("User: Fetching connected smart home platforms for:", userId);
      return ctx.db.smartHomePlatformConnection.findMany({ where: { userId } });
    }),

  connectPlatform: protectedProcedure // This would typically involve an OAuth flow start
    .input(z.object({ platformKey: z.string(), authCodeOrTokens: z.any() /* Depends on platform */ }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      console.log("User: Connecting smart home platform:", input.platformKey, "for user:", userId);
      // Placeholder: Implement OAuth token exchange and store connection
      // const platform = await ctx.db.smartHomePlatformConnection.create({ data: { ... } });
      return { success: true, message: `${input.platformKey} connected (placeholder).` };
    }),
  
  disconnectPlatform: protectedProcedure
    .input(z.object({ connectionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
        // Placeholder: Remove platform connection, revoke tokens if possible
        await ctx.db.smartHomePlatformConnection.deleteMany({where: {id: input.connectionId, userId: ctx.session.user.id}});
        return { success: true };
    }),

  getConnectedDevices: protectedProcedure
    .input(z.object({ platformConnectionId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      console.log("User: Fetching connected devices for user:", userId);
      return ctx.db.smartHomeDevice.findMany({
        where: { connection: { userId, id: input.platformConnectionId } },
        include: { currentScent: { select: {name: true, images: {take: 1, select: {url: true}}}}}
      });
    }),
    
  toggleDeviceState: protectedProcedure
    .input(z.object({ deviceId: z.string(), isActive: z.boolean() }))
    .mutation(async ({ctx, input}) => {
        console.log("User: Toggling device state for:", input.deviceId);
        // Placeholder: Call actual smart home API to toggle device, then update local DB
        const device = await ctx.db.smartHomeDevice.findFirst({where: {id: input.deviceId, connection: {userId: ctx.session.user.id}}});
        if(!device) throw new Error("Device not found or not owned by user");
        // Simulate API call
        return ctx.db.smartHomeDevice.update({where: {id: input.deviceId}, data: {isActive: input.isActive, lastActivityAt: new Date()}});
    }),

  getAutomations: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      console.log("User: Fetching automations for user:", userId);
      return ctx.db.automationRule.findMany({ 
          where: { userId },
          include: { actions: { include: { device: {select: {name: true}}}}}
      });
    }),

  addAutomation: protectedProcedure
    .input(z.object({
        name: z.string(),
        triggerType: z.nativeEnum(AutomationTriggerType),
        triggerConfig: z.record(z.any()), // JSON
        actions: z.array(z.object({
            deviceId: z.string(),
            actionType: z.string(),
            parameters: z.record(z.any()).optional()
        }))
    }))
    .mutation(async ({ctx, input}) => {
        console.log("User: Adding automation for user:", ctx.session.user.id);
        // Placeholder: Create automation rule and actions
        return ctx.db.automationRule.create({
            data: {
                userId: ctx.session.user.id,
                name: input.name,
                triggerType: input.triggerType,
                triggerConfig: input.triggerConfig,
                actions: { create: input.actions }
            }
        });
    }),
    
  toggleAutomation: protectedProcedure
    .input(z.object({ automationId: z.string(), enabled: z.boolean() }))
    .mutation(async ({ctx, input}) => {
        console.log("User: Toggling automation:", input.automationId);
        return ctx.db.automationRule.updateMany({
            where: {id: input.automationId, userId: ctx.session.user.id}, 
            data: {enabled: input.enabled}
        });
    }),

  removeAutomation: protectedProcedure
    .input(z.object({ automationId: z.string() }))
    .mutation(async ({ctx, input}) => {
        await ctx.db.automationRule.deleteMany({where: {id: input.automationId, userId: ctx.session.user.id}});
        return {success: true};
    }),

  getScentSchedules: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      console.log("User: Fetching scent schedules for user:", userId);
      return ctx.db.scentSchedule.findMany({ 
          where: { userId },
          include: { device: {select: {name: true}} } // Include device name for display
      });
    }),
    
  addScentSchedule: protectedProcedure
    .input(z.object({
        name: z.string(),
        deviceId: z.string(),
        entries: z.array(ScentScheduleEntrySchema),
        enabled: z.boolean().default(true)
    }))
    .mutation(async ({ctx, input}) => {
        console.log("User: Adding scent schedule for user:", ctx.session.user.id);
        return ctx.db.scentSchedule.create({
            data: {
                userId: ctx.session.user.id,
                name: input.name,
                deviceId: input.deviceId,
                entries: input.entries,
                enabled: input.enabled
            }
        });
    }),

  toggleScentSchedule: protectedProcedure
    .input(z.object({ scheduleId: z.string(), enabled: z.boolean() }))
    .mutation(async ({ctx, input}) => {
        console.log("User: Toggling scent schedule:", input.scheduleId);
        return ctx.db.scentSchedule.updateMany({
            where: {id: input.scheduleId, userId: ctx.session.user.id}, 
            data: {enabled: input.enabled}
        });
    }),
    
  removeScentSchedule: protectedProcedure
    .input(z.object({ scheduleId: z.string() }))
    .mutation(async ({ctx, input}) => {
        await ctx.db.scentSchedule.deleteMany({where: {id: input.scheduleId, userId: ctx.session.user.id}});
        return {success: true};
    }),
});
```

# src/server/api/routers/reviews.ts
```ts
// src/server/api/routers/reviews.ts
import { protectedProcedure, publicProcedure, createTRPCRouter } from "~/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

const ReviewInputSchema = z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(3).max(100).optional(),
  comment: z.string().min(10).max(1000).optional(),
  // orderItemId: z.string().optional(), // To link to a specific purchase for "verified" status
});

export const reviewsRouter = createTRPCRouter({
  getReviewsForProduct: publicProcedure
    .input(z.object({
      productId: z.string(),
      limit: z.number().min(1).max(50).optional().default(5),
      cursor: z.string().optional(), // Review ID for cursor
      sortBy: z.enum(["newest", "oldest", "rating_high", "rating_low", "helpful"]).optional().default("newest"),
    }))
    .query(async ({ ctx, input }) => {
      console.log("Fetching reviews for product:", input.productId);
      // Placeholder: Implement fetching reviews with pagination and sorting
      let orderBy: any = { createdAt: 'desc' };
      if (input.sortBy === "oldest") orderBy = { createdAt: 'asc' };
      else if (input.sortBy === "rating_high") orderBy = [{ rating: 'desc' }, { createdAt: 'desc' }];
      else if (input.sortBy === "rating_low") orderBy = [{ rating: 'asc' }, { createdAt: 'desc' }];
      else if (input.sortBy === "helpful") orderBy = [{ helpfulCount: 'desc' }, { createdAt: 'desc' }];
      
      const reviews = await ctx.db.review.findMany({
          where: { productId: input.productId, status: "APPROVED" }, // Only show approved reviews
          take: input.limit + 1,
          cursor: input.cursor ? {id: input.cursor} : undefined,
          orderBy,
          include: { user: {select: {name: true, image: true}} }
      });
      // ... pagination logic ...
      return { items: reviews, nextCursor: undefined, totalCount: 0, averageRating: 0 };
    }),

  createReview: protectedProcedure
    .input(ReviewInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      console.log("User: Creating review for product:", input.productId, "by user:", userId);

      // Check if user has purchased this product (optional, for verified reviews)
      // const hasPurchased = await ctx.db.orderItem.findFirst({
      //   where: { order: { userId }, productId: input.productId },
      // });
      // if (!hasPurchased && input.orderItemId) { /* Validate orderItemId belongs to user and product */ }

      // Check if user already reviewed this product (typically one review per product per user)
      const existingReview = await ctx.db.review.findFirst({
          where: { userId, productId: input.productId }
      });
      if (existingReview) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "You have already reviewed this product." });
      }

      const newReview = await ctx.db.review.create({
        data: {
          userId,
          productId: input.productId,
          rating: input.rating,
          title: input.title,
          comment: input.comment,
          // isVerifiedPurchase: !!hasPurchased, // Set based on purchase check
          status: "PENDING", // Default to pending for moderation
        },
      });
      return newReview;
    }),

  toggleHelpfulReview: protectedProcedure
    .input(z.object({ reviewId: z.string(), helpful: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
        console.log("User: Toggling helpful status for review:", input.reviewId);
        // Placeholder: This needs more complex logic to track who voted, prevent multiple votes by same user.
        // Usually involves a separate junction table like UserReviewVote (userId, reviewId, voteType).
        if (input.helpful) {
            await ctx.db.review.update({ where: {id: input.reviewId}, data: { helpfulCount: {increment: 1}}});
        } else {
            await ctx.db.review.update({ where: {id: input.reviewId}, data: { notHelpfulCount: {increment: 1}}});
        }
        return { success: true };
    }),
});
```

