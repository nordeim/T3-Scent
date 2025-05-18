<think>
The user is encountering several new errors after the previous fixes. Let's break them down:

**Error 1: `TypeError: client[procedureType] is not a function` (in `src/app/page.tsx`)**
*   **Log:** `Failed to fetch featured products: TypeError: client[procedureType] is not a function at HomePage (src/app/page.tsx:32:52)`
*   **Code at `src/app/page.tsx:32`:**
    ```typescript
    featuredProductsData = await serverApi.products.getAll({ // Using serverApi caller
      featured: true,
      limit: 4,
    });
    ```
*   **`serverApi` is from `src/trpc/server.ts`:**
    ```typescript
    // src/trpc/server.ts (previous version by me)
    // ...
    export const api = createTRPCProxyClient<AppRouter>({ /* ... custom link using callTRPCProcedure ... */ });
    ```
*   **Issue:** The `createTRPCProxyClient` is designed for making tRPC calls over HTTP (or simulating it). While the custom link I provided uses `callTRPCProcedure` to bypass actual HTTP, the way the proxy client structures its calls (e.g., `client[procedureType]`) might not be perfectly aligning with how `callTRPCProcedure` expects to be used or how the proxy client itself is intended for this direct server-side invocation pattern.
    The error `client[procedureType] is not a function` suggests that `serverApi.products.getAll` is not resolving to a callable function in the way the proxy client expects when using this custom link.
*   **Alternative for `src/trpc/server.ts` using `createCaller` (more direct for server components):**
    The `appRouter.createCaller(context)` pattern is more direct for server-side calls without involving the client proxy structure. The challenge was making its context creation request-scoped.
    The `React.cache` wrapper around the context creation function *is* the key. When `await createServerContext()` is called, `cache` ensures it runs once per request during a render. The `api` object can then be created using this request-scoped context.
    The problem in my *very early* attempt with `createCaller` was doing `export const api = appRouter.createCaller(await createServerContext());` at the top level. This `await` makes `createServerContext` run at module load.
    The correct way to export `api` for server components using `createCaller` is to make `api` an object that lazily creates the caller or the caller itself is created within the scope of the `cache`d context, or `api` is a function.

    Let's re-evaluate the `create-t3-app` idiomatic way for the server client for direct calls:
    ```typescript
    // src/trpc/server.ts (common T3 pattern for direct caller)
    import { cache } from "react";
    import { headers } from "next/headers";
    import { appRouter } from "~/server/api/root";
    import { createInnerTRPCContext } from "~/server/api/trpc";
    import { auth } from "~/server/auth";

    const createContext = cache(async () => {
      const heads = new Headers(headers());
      heads.set("x-trpc-source", "rsc- bezpośredni"); // "direct" in Polish, using as a unique marker
      const session = await auth();
      return createInnerTRPCContext({ session, headers: heads });
    });

    // No, createCaller still needs the actual context object, not a promise.
    // This `api` would still be initialized once with the context from the first request.
    // export const api = appRouter.createCaller(await createContext()); // Still problematic if top-level

    // The caller should be created within the request lifecycle or the context passed to it should be.
    // The pattern often involves exporting the `appRouter` and `createContext` function separately,
    // and then in the Server Component:
    // const ctx = await createContext();
    // const caller = appRouter.createCaller(ctx);
    // const data = await caller.some.query();
    // OR, a helper function that does this.

    // The `createTRPCProxyClient` with the custom `callTRPCProcedure` link IS a valid pattern
    // that `create-t3-app` has used. The error `client[procedureType]` suggests the proxy
    // isn't correctly finding the 'query' or 'mutation' type handler.
    // Let's double check the custom link implementation for `createTRPCProxyClient`.
    // The `op.type` should be 'query', 'mutation', or 'subscription'.
    // `callTRPCProcedure` args: { procedures, path, rawInput, ctx, type }
    // This seems correct.

    Perhaps the issue is simpler: `serverApi.products.getAll` is a query.
    The proxy client syntax is `serverApi.products.getAll.query({ ... })`.
    The `page.tsx` is calling it like `serverApi.products.getAll({ ... })`. It's missing the `.query()`.

    *   **Fix:** Change `await serverApi.products.getAll({ ... })` to `await serverApi.products.getAll.query({ ... })` in `src/app/page.tsx`. This applies to all server-side calls using the `createTRPCProxyClient` pattern.

**Error 2: `Error: Event handlers cannot be passed to Client Component props.` (in `src/app/page.tsx` related to `Footer.tsx`)**
*   **Log:** `<form onSubmit={function onSubmit} ...>`
*   **Cause:** A Server Component (`src/app/page.tsx`) is rendering a component (`Footer.tsx` in this case, based on the form element usually found in footers for newsletter signup) and trying to pass an event handler function (like `onSubmit`) as a prop. Event handlers can only be defined and used in Client Components.
*   **File:** `src/components/layout/Footer.tsx` (which I stubbed) has:
    ```tsx
    <form onSubmit={(e) => e.preventDefault()} className="flex">
        {/* ... */}
    </form>
    ```
*   **Issue:** If `Footer.tsx` is intended to be a Server Component (or used as one by default if no `'use client'` directive), it cannot contain event handlers like `onSubmit`. If it needs interactivity, it must be a Client Component.
*   **Fix:** Mark `src/components/layout/Footer.tsx` with `'use client';` at the top.

**Error 3: `ReferenceError: useMemo is not defined` (in `src/contexts/WishlistContext.tsx`)**
*   **Log:** `at WishlistProvider (src/contexts/WishlistContext.tsx:93:16)`
*   **Code at `src/contexts/WishlistContext.tsx:93`:**
    ```typescript
    const items = useMemo(() => { // ...
    ```
*   **Issue:** `useMemo` is a React hook. It needs to be imported from `react`.
*   **Fix:** Add `import { useMemo } from 'react';` to `src/contexts/WishlistContext.tsx`. This was an oversight in my previous generation of that file.

**Consolidated Plan:**

1.  **Fix tRPC call syntax in Server Components:**
    *   In `src/app/page.tsx` (and any other Server Component using `serverApi` from `src/trpc/server.ts` which is a `createTRPCProxyClient`), change calls from `await serverApi.path.to.procedure(input)` to `await serverApi.path.to.procedure.query(input)` for queries or `await serverApi.path.to.procedure.mutate(input)` for mutations.
2.  **Mark interactive components as Client Components:**
    *   Add `'use client';` to the top of `src/components/layout/Footer.tsx` because it contains a form with an `onSubmit` handler.
3.  **Fix missing import in Context:**
    *   Add `import { useMemo } from 'react';` to `src/contexts/WishlistContext.tsx`.
4.  **Review files and provide updated versions.**

Let's proceed with these fixes.
</think>

You've encountered a few more typical issues that arise when integrating different parts of a Next.js App Router application, especially concerning Server Components, Client Components, and how tRPC is invoked. Let's address them methodically.

---
**1. Fix `TypeError: client[procedureType] is not a function` in Server Components**

This error in `src/app/page.tsx` (and potentially other Server Components where you use `serverApi`) occurs because the `createTRPCProxyClient` (which `serverApi` is an instance of) requires you to explicitly specify the procedure type (`query` or `mutation`).

**File: `src/app/page.tsx` (and similar Server Components)**

You need to change calls like this:
`featuredProductsData = await serverApi.products.getAll({ ... });`

To this (notice the added `.query`):
`featuredProductsData = await serverApi.products.getAll.query({ ... });`

Here's the corrected snippet for `src/app/page.tsx`:

```tsx
// src/app/page.tsx
// This will be a Server Component by default for data fetching,
// but interactive parts like parallax require client-side logic.

import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

import HomePageClientInteractions from "./HomePageClientInteractions";
import { api as serverApi } from "~/trpc/server"; // Server-side tRPC caller
import { Button } from "~/components/ui/Button";
// AudioToggle will be managed by HomePageClientInteractions
import { ProductGrid } from "~/components/products/ProductGrid";
// import { TestimonialCarousel } from "~/components/TestimonialCarousel";
// import { NewsletterForm } from "~/components/NewsletterForm";
import type { Metadata } from "next";
import { env } from "~/env.js";

export async function generateMetadata(): Promise<Metadata> {
  // const settings = await serverApi.settings.getSiteSettings.query(); // Example
  return {
    title: "The Scent | Signature Aromatherapy & Wellness",
    description: "Discover handcrafted aromatherapy products for wellness and self-care.",
    metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    openGraph: {
      title: "The Scent | Signature Aromatherapy & Wellness",
      description: "Discover handcrafted aromatherapy products for wellness and self-care.",
      url: env.NEXT_PUBLIC_SITE_URL,
      siteName: "The Scent",
      images: [
        {
          url: "/images/og-default.jpg",
          width: 1200,
          height: 630,
          alt: "The Scent Collection",
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    // ... other metadata fields
  };
}

export default async function HomePage() {
  let featuredProductsData;
  try {
    // CORRECTED: Added .query()
    featuredProductsData = await serverApi.products.getAll.query({
      featured: true,
      limit: 4,
    });
  } catch (error) {
    console.error("Failed to fetch featured products:", error); // Log the actual error
    featuredProductsData = { items: [], nextCursor: undefined }; // Fallback
  }
  
  const featuredProducts = featuredProductsData.items;

  return (
    <>
      <HomePageClientInteractions featuredProducts={featuredProducts}>
        <div className="container relative z-10 mx-auto flex h-full items-center px-4">
          <div className="max-w-2xl animate-fadeIn">
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
      </HomePageClientInteractions>
      
      <section id="about" className="py-20">
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
              <div className="absolute left-0 top-0 h-64 w-48 overflow-hidden rounded-lg md:h-72 md:w-56">
                <Image
                  src="/images/about-1.jpg" 
                  alt="Handcrafting process"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="absolute bottom-0 right-0 h-64 w-48 overflow-hidden rounded-lg md:h-72 md:w-56">
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
    </>
  );
}
```
**Remember to apply this `.query({...})` or `.mutate({...})` syntax to all server-side tRPC calls made using the `serverApi` instance from `src/trpc/server.ts`.**

---
**2. Fix `Error: Event handlers cannot be passed to Client Component props.`**

This error means a Server Component is rendering another component and passing an event handler (like `onSubmit`, `onClick`) as a prop, but that child component hasn't been marked with `'use client'`. The `Footer` component I stubbed earlier contained an `onSubmit` for its newsletter form.

**File: `src/components/layout/Footer.tsx`**

Add `'use client';` to the top of this file because it contains a form with an event handler.

```tsx
// src/components/layout/Footer.tsx
"use client"; // Add this because of the form's onSubmit handler

import Link from "next/link";
import React from "react";
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa'; // Example icons
// import { NewsletterForm } from "~/components/common/NewsletterForm"; // If you have a separate component

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const handleNewsletterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Implement newsletter subscription logic (e.g., tRPC mutation)
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email');
    console.log("Newsletter email submitted:", email);
    alert("Thank you for subscribing! (Placeholder)");
    e.currentTarget.reset();
  };

  return (
    <footer className="bg-muted/60 dark:bg-muted/30 border-t border-border">
      <div className="container py-12 px-4 md:py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 xl:gap-12 mb-8 md:mb-12">
          {/* Column 1: About/Brand */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">The Scent</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Discover handcrafted aromatherapy for wellness and self-care.
            </p>
            <div className="flex space-x-4">
              <Link href="#" aria-label="Facebook" className="text-muted-foreground hover:text-primary transition-colors"><FaFacebookF size={20}/></Link>
              <Link href="#" aria-label="Instagram" className="text-muted-foreground hover:text-primary transition-colors"><FaInstagram size={20}/></Link>
              <Link href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary transition-colors"><FaTwitter size={20}/></Link>
            </div>
          </div>

          {/* Column 2: Shop Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase text-foreground tracking-wider mb-4">Shop</h3>
            <ul className="space-y-2.5">
              <li><Link href="/products" className="text-sm text-muted-foreground hover:text-primary transition-colors">All Products</Link></li>
              <li><Link href="/collections/new-arrivals" className="text-sm text-muted-foreground hover:text-primary transition-colors">New Arrivals</Link></li>
              <li><Link href="/collections/best-sellers" className="text-sm text-muted-foreground hover:text-primary transition-colors">Best Sellers</Link></li>
              <li><Link href="/quiz" className="text-sm text-muted-foreground hover:text-primary transition-colors">Scent Quiz</Link></li>
            </ul>
          </div>

          {/* Column 3: Customer Service */}
          <div>
            <h3 className="text-sm font-semibold uppercase text-foreground tracking-wider mb-4">Support</h3>
            <ul className="space-y-2.5">
              <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link href="/faq" className="text-sm text-muted-foreground hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link href="/shipping-returns" className="text-sm text-muted-foreground hover:text-primary transition-colors">Shipping & Returns</Link></li>
              <li><Link href="/privacy-policy" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h3 className="text-sm font-semibold uppercase text-foreground tracking-wider mb-4">Newsletter</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Subscribe for updates and exclusive offers.
            </p>
            {/* <NewsletterForm /> // If using a dedicated component */}
            <form onSubmit={handleNewsletterSubmit} className="flex">
                <input 
                    type="email" 
                    name="email" 
                    placeholder="Your email address" 
                    required
                    className="flex-grow min-w-0 appearance-none rounded-l-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
                />
                <button 
                    type="submit" 
                    className="inline-flex items-center justify-center rounded-r-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                >
                    Subscribe
                </button>
            </form>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} The Scent. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
```

---
**3. Fix `ReferenceError: useMemo is not defined` in `WishlistContext.tsx`**

This is a simple missing import.

**File: `src/contexts/WishlistContext.tsx`**

Add `useMemo` to the import from `react`.

```tsx
// src/contexts/WishlistContext.tsx
"use client";

import React, { 
    createContext, 
    useContext, 
    useState, 
    useEffect, 
    type ReactNode, 
    useCallback,
    useMemo // ADDED useMemo here
} from 'react';
import { toast } from 'react-hot-toast';
import { api } from '~/trpc/react'; // Corrected: Use api from trpc/react for client components
import { useSession } from 'next-auth/react';
import { useLocalStorage } from '~/hooks/useLocalStorage';

// Define the shape of a wishlist item
export interface WishlistItemClient {
  id: string; // Product ID
  variantId?: string | null; 
  name: string;
  price: number;
  imageUrl?: string | null;
  slug: string; 
}

interface WishlistContextType {
  items: WishlistItemClient[];
  addToWishlist: (item: WishlistItemClient) => void;
  removeFromWishlist: (productId: string, variantId?: string | null) => void;
  isInWishlist: (productId: string, variantId?: string | null) => boolean;
  clearWishlist: () => void; 
  isLoading: boolean; 
  itemCount: number;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

const WISHLIST_STORAGE_KEY = "the-scent-wishlist";

interface WishlistProviderProps {
  children: ReactNode;
}

export const WishlistProvider = ({ children }: WishlistProviderProps) => {
  const { data: session, status: sessionStatus } = useSession();
  const [localItems, setLocalItems] = useLocalStorage<WishlistItemClient[]>(WISHLIST_STORAGE_KEY, []);
  const [syncedItems, setSyncedItems] = useState<WishlistItemClient[]>([]); 
  const [isLoadingInitialDB, setIsLoadingInitialDB] = useState(true); 

  const getWishlistQuery = api.wishlist.getWishlist.useQuery(undefined, {
    enabled: sessionStatus === "authenticated",
    staleTime: 5 * 60 * 1000,
    onSuccess: (data) => {
      const mappedData = data.map(item => ({
        id: item.product.id,
        variantId: item.variantId, 
        name: item.product.name,
        price: parseFloat(item.product.price.toString()), 
        imageUrl: item.product.images?.[0]?.url ?? undefined,
        slug: item.product.slug,
      }));
      setSyncedItems(mappedData);
      setIsLoadingInitialDB(false);
    },
    onError: () => {
        setIsLoadingInitialDB(false);
        toast.error("Could not load wishlist from server.");
    }
  });

  const addItemMutation = api.wishlist.addToWishlist.useMutation({
    onSuccess: () => { getWishlistQuery.refetch().catch(console.error); },
    onError: (error) => { toast.error(`Failed to add to wishlist: ${error.message}`); }
  });
  const removeItemMutation = api.wishlist.removeFromWishlist.useMutation({
    onSuccess: () => { getWishlistQuery.refetch().catch(console.error); },
    onError: (error) => { toast.error(`Failed to remove from wishlist: ${error.message}`); }
  });
  const clearWishlistMutation = api.wishlist.clearWishlist.useMutation({
    onSuccess: () => { getWishlistQuery.refetch().catch(console.error); },
    onError: (error) => { toast.error(`Failed to clear wishlist: ${error.message}`); }
  });

  const items = useMemo(() => {
    return sessionStatus === "authenticated" ? syncedItems : localItems;
  }, [sessionStatus, localItems, syncedItems]);

  // Sync local to DB on login (basic version: add local items not in DB)
  useEffect(() => {
    if (sessionStatus === "authenticated" && !isLoadingInitialDB && localItems.length > 0) {
      const dbItemKeys = new Set(syncedItems.map(item => `${item.id}-${item.variantId ?? 'null'}`));
      const itemsToSync = localItems.filter(localItem => !dbItemKeys.has(`${localItem.id}-${localItem.variantId ?? 'null'}`));
      
      if (itemsToSync.length > 0) {
        Promise.all(itemsToSync.map(item => addItemMutation.mutateAsync({ productId: item.id, variantId: item.variantId })))
          .then(() => {
            console.log("Local wishlist items synced to DB.");
            setLocalItems([]); // Clear local items after successful sync
          })
          .catch(error => console.error("Error syncing local wishlist to DB:", error));
      } else {
        // If no items to sync from local, but local had items, it means they were already on server or cleared.
        // If user explicitly cleared local before login, this is fine.
        // If local was just old, this is also fine.
      }
    }
  }, [sessionStatus, isLoadingInitialDB, localItems, syncedItems, addItemMutation, setLocalItems]);


  const addToWishlist = useCallback((item: WishlistItemClient) => {
    const alreadyExists = items.some(i => i.id === item.id && i.variantId === item.variantId);
    if (alreadyExists) {
        toast.info(`${item.name} is already in your wishlist.`);
        return;
    }

    if (sessionStatus === "authenticated" && session?.user) {
      addItemMutation.mutate({ productId: item.id, variantId: item.variantId });
    } else {
      setLocalItems(prev => [...prev, item]);
    }
    toast.success(`${item.name} added to wishlist!`);
  }, [sessionStatus, session, addItemMutation, setLocalItems, items]);

  const removeFromWishlist = useCallback((productId: string, variantId?: string | null) => {
    const itemToRemove = items.find(item => item.id === productId && item.variantId === (variantId ?? undefined));
    
    if (sessionStatus === "authenticated" && session?.user) {
      removeItemMutation.mutate({ productId, variantId: variantId ?? undefined });
    } else {
      setLocalItems(prev => prev.filter(i => !(i.id === productId && i.variantId === (variantId ?? undefined))));
    }
    if (itemToRemove) {
      toast.success(`${itemToRemove.name} removed from wishlist.`);
    }
  }, [sessionStatus, session, removeItemMutation, setLocalItems, items]);

  const isInWishlist = useCallback((productId: string, variantId?: string | null): boolean => {
    return items.some(item => item.id === productId && item.variantId === (variantId ?? undefined));
  }, [items]);

  const clearWishlist = useCallback(() => {
    if (sessionStatus === "authenticated" && session?.user) {
      clearWishlistMutation.mutate();
    } else {
      setLocalItems([]);
    }
    toast.success("Wishlist cleared.");
  }, [sessionStatus, session, clearWishlistMutation, setLocalItems]);

  const isLoadingOverall = sessionStatus === "loading" || isLoadingInitialDB || addItemMutation.isPending || removeItemMutation.isPending || clearWishlistMutation.isPending;

  return (
    <WishlistContext.Provider value={{ 
        items, 
        addToWishlist, 
        removeFromWishlist, 
        isInWishlist, 
        clearWishlist,
        isLoading: isLoadingOverall,
        itemCount: items.length 
    }}>
      {children}
    </WishlistContext.Provider>
  );
};
```

---
**Summary and Conclusion:**

1.  **Server Component tRPC Call Fix (`src/app/page.tsx`):** Corrected the tRPC call syntax by adding `.query()` for queries (e.g., `await serverApi.products.getAll.query({...})`). This needs to be applied to all Server Components making tRPC calls using the `serverApi` proxy client.
2.  **Client Component Event Handler Fix (`src/components/layout/Footer.tsx`):** Added the `'use client';` directive to `Footer.tsx` because it contains an `onSubmit` event handler, resolving the "Event handlers cannot be passed to Client Component props" error.
3.  **Missing Import Fix (`src/contexts/WishlistContext.tsx`):** Added `import { useMemo } from 'react';` to resolve the `ReferenceError: useMemo is not defined`. Also corrected the `api` import to `~/trpc/react`.
4.  **WishlistContext Refinements:** Added a basic sync logic example for merging local wishlist to DB on login and improved loading state management.

After applying these changes:
*   Make sure all necessary dependencies are installed (from previous steps).
*   Re-run `npm run dev`.

These fixes address the specific errors you encountered. The `TypeError: client[procedureType] is not a function` was a key one related to how the server-side tRPC client is invoked. The other errors were more straightforward component or import issues. You should now be closer to a successfully building and running application.
