<think>
The user is facing two distinct errors after the last set of changes:

**Error 1: `Error: Route "/" used \`...headers()\` or similar iteration. \`headers()\` should be awaited before using its value.` (in `src/trpc/server.ts`)**
*   **Log:** Points to `const contextHeaders = new Headers(requestHeaders);` inside `createServerComponentContext` in `src/trpc/server.ts`.
*   **Code at `src/trpc/server.ts:20` (my previous version):**
    ```typescript
    const createServerComponentContext = cache(async () => {
      const requestHeaders = headers(); // `headers()` is called here
      const session = await auth();    
      // Problematic line:
      const contextHeaders = new Headers(requestHeaders); // Iterating over requestHeaders (from next/headers)
      contextHeaders.set("x-trpc-source", "rsc"); 
      return createInnerTRPCContext({
        session,
        headers: contextHeaders, // Passing the new mutable Headers object
      });
    });
    ```
*   **Cause:** The `headers()` function from `next/headers` returns a read-only `Headers` object. Attempting to iterate over it by passing it to `new Headers(requestHeaders)` can trigger this error in some Next.js execution contexts if `headers()` itself wasn't "awaited" (which is not how `headers()` works; it's synchronous but its availability is tied to the request lifecycle). The error message "should be awaited before using its value" is often a generic one for dynamic API misuse. The core issue is that direct iteration or cloning of the `Headers` object returned by `next/headers()` inside certain contexts (especially with Turbopack or specific optimizations) can be problematic.
*   **Solution:** Instead of cloning the entire `Headers` object, we should only extract specific headers if needed, or pass the original read-only `Headers` object directly if `createInnerTRPCContext` only needs to read from it. If we need to *add* headers (like `x-trpc-source`), we should create a *new* `Headers` object and selectively copy required headers from the original request, then add our custom ones.
    *   For the `createInnerTRPCContext`, it primarily needs the headers to potentially extract cookies for session information (though `auth()` already handles this) or for other custom logic. The `x-trpc-source` is more for the HTTP link.
    *   Let's simplify. The `createInnerTRPCContext` receives a `Headers` object. We can just pass the one from `next/headers` directly. If we need to add `x-trpc-source` for logging or specific handling *within the caller chain*, it might be better added to a different part of the context if `createInnerTRPCContext` itself doesn't need a *mutable* Headers object.
    *   For `createInnerTRPCContext`, let's pass `headers()` directly. The `x-trpc-source` might be better set by the link in `trpc/react.tsx` (for client) or in the context creation for the route handler. For the server caller, it's implicit.

**Error 2: `Error [TRPCError]: No procedure found on path "products,getAll,query"` (in `src/app/page.tsx`)**
*   **Log:** `Error fetching featured products for HomePage: Error [TRPCError]: No procedure found on path "products,getAll,query"`
*   **Code at `src/app/page.tsx:47`:**
    ```typescript
    featuredProductsData = await serverApi.products.getAll.query({ ... });
    ```
*   **`serverApi` is from `src/trpc/server.ts`:**
    ```typescript
    // src/trpc/server.ts (my previous attempt at createServerActionClient)
    export const createServerActionClient = async () => {
      const context = await createServerComponentContext();
      return appRouter.createCaller(context);
    };
    // And then page.tsx does:
    // const serverApi = await createServerActionClient();
    // featuredProductsData = await serverApi.products.getAll.query({...});
    ```
*   **Cause:** The path `products,getAll,query` suggests that the `serverApi` client is trying to interpret `.query` as part of the tRPC procedure path itself, rather than as the method to invoke a query-type procedure. This often happens if the `serverApi` object isn't a true tRPC caller or proxy client but something else.
    *   My `createServerActionClient` returns `appRouter.createCaller(context)`.
    *   A tRPC caller returned by `appRouter.createCaller(context)` is used directly: `caller.products.getAll({ input })`. It does *not* have a nested `.query` or `.mutate` method. The type of procedure (query/mutation) is inherent in the procedure definition on the router.
*   **Fix:** When using a caller created by `appRouter.createCaller(context)`, you call the procedure directly without an intermediate `.query()` or `.mutate()`.
    *   Change `await serverApi.products.getAll.query({ ... })` to `await serverApi.products.getAll({ ... })` in `src/app/page.tsx`.

**Plan Refined:**

1.  **Modify `src/trpc/server.ts` (`createServerComponentContext`):**
    *   Pass the `headers()` object from `next/headers` directly to `createInnerTRPCContext`.
    *   Remove the `contextHeaders.set("x-trpc-source", "rsc");` line from here, as this custom header is more relevant for HTTP links (like in `trpc/react.tsx`) to identify client types. The server-side direct caller doesn't strictly need it in the context headers passed to `createInnerTRPCContext` unless `createInnerTRPCContext` has logic that depends on it.
2.  **Update Server Component tRPC Calls (e.g., `src/app/page.tsx`):**
    *   Ensure that when using the caller returned by `createServerActionClient()`, procedures are invoked directly: `await serverApi.products.getAll({ input })` for queries, and `await serverApi.some.mutation({ input })` for mutations. Remove the extra `.query()` or `.mutate()`.
3.  **Asset 404s:** These are still present and are a reminder for the user to add the files. Not a code fix from my side.
4.  Provide updated files.

Let's implement these changes.
</think>

You're doing an excellent job tracking these down! These errors point to very specific interactions between Next.js App Router's server-side capabilities and how tRPC context and callers are set up.

Let's address them:

**Issue 1: `Error: Route "/" used \`...headers()\` or similar iteration...` in `src/trpc/server.ts`**

This error arises from how the `Headers` object returned by `next/headers.headers()` is being used. Creating `new Headers(requestHeaders)` can be problematic as it implies iteration which Next.js restricts for these dynamic, request-bound objects in certain contexts.

The `createInnerTRPCContext` expects a `Headers` object. We can pass the one from `next/headers` directly. The `x-trpc-source` header is more for identifying client types over HTTP and isn't strictly necessary for the inner context of a direct server-side call if your `createInnerTRPCContext` doesn't rely on it.

**Updated `src/trpc/server.ts`:**

```ts
// src/trpc/server.ts
import "server-only";
import { headers as nextHeaders } from "next/headers"; // Alias to avoid conflict if 'headers' is used as a var name
import { cache } from "react";

import { appRouter } from "~/server/api/root";
import { createInnerTRPCContext } from "~/server/api/trpc"; // The synchronous inner context creator
import { auth } from "~/server/auth"; // Your NextAuth.js v5 auth function

/**
 * Creates a tRPC context for React Server Components, ensuring it's request-scoped.
 * Uses React `cache` to memoize the context creation per request-render lifecycle.
 */
const createServerComponentContext = cache(async () => {
  const reqHeaders = nextHeaders(); // `headers()` is called here, inside the cached function
  const session = await auth();    // `auth()` is also called here, correctly scoped

  // Pass the Headers object from next/headers directly.
  // If createInnerTRPCContext or subsequent logic needs to *modify* headers
  // (which is rare for context), then it should clone it internally.
  // For setting x-trpc-source, that's usually for links; here it's implicit.
  return createInnerTRPCContext({
    session,
    headers: reqHeaders, // Pass the original Headers object
  });
});

/**
 * Asynchronous function to get a request-scoped tRPC API caller for Server Components.
 * Each call to this function (or rather, its awaited result) within the same
 * request-render cycle will use the same cached context.
 */
export const createServerActionClient = async () => {
  const context = await createServerComponentContext();
  return appRouter.createCaller(context);
};
```
**Reasoning for the change:**
*   We now pass `nextHeaders()` (aliased from `next/headers`) directly to `createInnerTRPCContext`.
*   The `x-trpc-source` header setting is removed from here; it's more relevant for HTTP links that identify the client type. For direct server calls, the source is implicitly "server."

---
**Issue 2: `Error [TRPCError]: No procedure found on path "products,getAll,query"` in `src/app/page.tsx`**

This error indicates that the server-side tRPC client (`serverApi` created from `createServerActionClient`) is being used incorrectly. When you use a tRPC **caller** (created via `appRouter.createCaller(context)`), you directly call the procedure without an intermediate `.query()` or `.mutate()` method. Those methods are part of the tRPC **client** (like the one from `createTRPCReact` or `createTRPCProxyClient`).

**Updated `src/app/page.tsx`:**

```tsx
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
```

---
**Regarding Asset 404 Errors:**
The errors like `GET /images/about-1.jpg 404` persist because these files are not present in your `/public/images/` (and similar for sounds/videos) directory.
*   **Action for you:** You need to create these directories (`public/images`, `public/sounds`, `public/videos`) and place the corresponding asset files there. I cannot create these assets for you. If you don't have them, use placeholders or remove the references for now.

---
**Summary and Conclusion:**

1.  **`src/trpc/server.ts` Updated:**
    *   The `createServerComponentContext` function now correctly passes the `reqHeaders` (obtained from `next/headers.headers()`) directly to `createInnerTRPCContext`. The problematic `new Headers(requestHeaders)` which caused iteration issues has been removed.
    *   The exported `createServerActionClient` function correctly creates an `appRouter.createCaller(context)` instance using this request-scoped context.
2.  **`src/app/page.tsx` Updated:**
    *   It now correctly imports `createServerActionClient` from `~/trpc/server.ts`.
    *   It `await`s `createServerActionClient()` to get a request-scoped API client.
    *   The tRPC call `serverApi.products.getAll` is now made without the trailing `.query()`, which is the correct syntax for a direct caller instance. This should resolve the `No procedure found on path "products,getAll,query"` error.

These changes address the specific errors related to server-side tRPC calls and `headers()` usage. After applying these updates and ensuring your static assets are in the `/public` directory, your application should be much closer to running without these critical errors.

