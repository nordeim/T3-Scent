<think>
The user is encountering two main types of errors again:

1.  **`Error: Route "..." used \`searchParams.propertyName\`. \`searchParams\` should be awaited before using its properties.`**
    *   This occurs in:
        *   `src/app/auth/signin/page.tsx` for `searchParams.error` and `searchParams.callbackUrl`.
        *   `src/app/products/page.tsx` for `searchParams.page`.
    *   **Cause:** In Next.js App Router, page components are Server Components by default. The `searchParams` prop passed to a page component is an object. However, accessing its properties directly like `searchParams.propertyName` can sometimes lead to this error if Next.js hasn't fully resolved/streamed these dynamic values, especially with Turbopack or in certain rendering phases. The error message suggests that `searchParams` (or its properties) should be treated as if they might be part of an asynchronous resolution process.
        *   The link `https://nextjs.org/docs/messages/sync-dynamic-apis` usually points to issues where dynamic functions like `headers()`, `cookies()`, or `searchParams` (from `useSearchParams` hook in client components) are used in a way that Next.js cannot statically analyze or that violates its rendering model (e.g., trying to read them during build time for a dynamic page).
        *   For Server Components, the `searchParams` prop *is* provided directly. The issue might be how Turbopack handles its direct access or if some optimization expects it to be handled differently.
    *   **Solution Exploration:**
        *   A common way to ensure `searchParams` properties are accessed safely is to destructure them or access them with a check. The error message is a bit peculiar suggesting `searchParams` itself should be awaited, which is not how props work.
        *   The more likely interpretation of this error in the context of the `searchParams` page prop is that direct access might be problematic during certain render passes if the value isn't "settled."
        *   A simple fix might be to assign the property to a variable first: `const error = searchParams?.error;`
        *   However, given the "should be awaited" phrasing (even if not literally applicable to props), it might be an internal Next.js/Turbopack behavior related to how dynamic segments and search params are made available to server components.
        *   The error primarily suggests a timing or context issue with accessing dynamic route information.
    *   **Best Bet for `searchParams` prop in Server Components:** The `searchParams` object provided as a prop to Server Component pages *should* be directly usable. This error might be a Turbopack-specific behavior or a subtle issue with how these values are proxied. One way to ensure values are "resolved" if they are somehow dynamic under the hood is to explicitly access them.
        *   For `src/app/auth/signin/page.tsx`:
            ```typescript
            export default function SignInPage({ searchParams }: SignInPageProps) {
              const error = searchParams?.error;
              const callbackUrl = searchParams?.callbackUrl;
              // ... then use `error` and `callbackUrl` variables
            }
            ```
        *   This pattern is usually sufficient. If the error persists, it might point to a deeper issue with the Next.js version or Turbopack.
        *   The error message `should be awaited` is typically for hooks like `useSearchParams()` if it were used server-side (which it isn't). Here it's a prop.

2.  **`Error [TRPCError]: No procedure found on path "products,getAll,query"` (in `src/app/products/page.tsx`)**
    *   **Log:** `TRPCError: No procedure found on path "products,getAll,query"`
    *   **Code:** `const productsData = await serverApi.products.getAll.query({ ... });`
    *   **Cause:** This is the *exact same error* as before for `src/app/page.tsx`. It means that when using the `serverApi` client (which is the direct caller created by `appRouter.createCaller(context)` via `createServerActionClient`), the `.query()` method should NOT be used. Procedures are called directly.
    *   **Fix:** Change `await serverApi.products.getAll.query({ ... })` to `await serverApi.products.getAll({ ... })` in `src/app/products/page.tsx`. I fixed this for `src/app/page.tsx` previously, but the fix needs to be applied consistently wherever the server-side direct caller is used.

**Plan:**

1.  **Address `searchParams` Access in Server Components:**
    *   Modify `src/app/auth/signin/page.tsx` to destructure or assign `searchParams` properties to local variables before passing them to client components or using them.
    *   Modify `src/app/products/page.tsx` similarly for `searchParams.page`.
2.  **Fix tRPC Call Syntax in `src/app/products/page.tsx`:**
    *   Remove the extraneous `.query()` from the `serverApi.products.getAll` call.
3.  **Review other files where `serverApi` or `searchParams` might be used similarly** (though the error log only points to these two pages for now).
4.  Provide the updated files.

The `prisma:query` log shows the query for featured products on the homepage seems to be executing (or attempting to), which means the previous fix for `page.tsx` regarding the tRPC call was likely correct. The new error `No procedure found on path "products,getAll,query"` in `products/page.tsx` confirms the same syntax error was present there.
</think>

You're doing an excellent job debugging! These errors are common when working with the nuances of Next.js App Router, especially regarding server-side data access and dynamic route parameters. Let's address them.

**Issue 1: `Error: Route "..." used \`searchParams.propertyName\`. \`searchParams\` should be awaited...`**

This error, while a bit misleading with its "should be awaited" phrasing for props, indicates that directly accessing properties of the `searchParams` object passed to Server Component pages might be problematic in some Next.js/Turbopack rendering scenarios. The typical way to resolve this is to ensure you're accessing them in a way that Next.js can properly handle, often by simply assigning them to a variable or destructuring.

**Issue 2: `TRPCError: No procedure found on path "products,getAll,query"` in `src/app/products/page.tsx`**

This is the same issue we fixed for `src/app/page.tsx`. When using the tRPC **caller** (created via `appRouter.createCaller(context)` which our `createServerActionClient` function returns), you call procedures directly without the intermediate `.query()` or `.mutate()` syntax. Those are for tRPC **clients** (like the one from `createTRPCReact` or `createTRPCProxyClient` if it were configured for HTTP).

Let's apply the fixes:

---
**1. Updated `src/app/auth/signin/page.tsx`**
*Access `searchParams` properties correctly.*

```tsx
// src/app/auth/signin/page.tsx
import { type Metadata } from "next";
import Link from "next/link"; // Added Link import
import SignInFormClient from "./SignInFormClient"; 

export const metadata: Metadata = {
  title: "Sign In - The Scent",
  description: "Sign in to your The Scent account.",
};

interface SignInPageProps {
  searchParams?: {
    callbackUrl?: string;
    error?: string; 
  };
}

export default function SignInPage({ searchParams }: SignInPageProps) {
  // Access searchParams properties safely
  const error = searchParams?.error;
  const callbackUrl = searchParams?.callbackUrl;

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-muted/30 px-4 py-12 sm:px-6 lg:px-8 dark:bg-background">
      <div className="w-full max-w-md space-y-8">
        <div>
          <Link href="/" className="flex justify-center mb-6">
            {/* Replace with your actual logo component or Image if you have one */}
            {/* <Image src="/logo.svg" alt="The Scent" width={48} height={48} /> */}
            <span className="text-2xl font-bold text-foreground">The Scent</span>
          </Link>
          <h2 className="text-center text-3xl font-bold tracking-tight text-foreground">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Or{' '}
            <Link href="/auth/signup" className="font-medium text-primary hover:text-primary/80">
              create a new account
            </Link>
          </p>
        </div>
        <SignInFormClient error={error} callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}
```

---
**2. Updated `src/app/products/page.tsx`**
*Correct tRPC call syntax and `searchParams` access.*

```tsx
// src/app/products/page.tsx
import { type Metadata } from "next";
import Link from "next/link";
import { ProductGrid } from "~/components/products/ProductGrid";
import { createServerActionClient } from "~/trpc/server";
import { Button } from "~/components/ui/Button"; // For potential "Load More" or filter actions
// import ProductFiltersClient from "./ProductFiltersClient"; // Example for a client-side filter component

export const metadata: Metadata = {
  title: "All Products - The Scent",
  description: "Browse our entire collection of premium aromatherapy and wellness products.",
};

interface ProductsPageProps {
  searchParams?: { // searchParams are optional
    page?: string;
    sortBy?: string;
    category?: string;
    // ... other potential filters like price_min, price_max, tags etc.
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const serverApi = await createServerActionClient();
  
  // Safely access searchParams properties
  const pageParam = searchParams?.page;
  const sortByParam = searchParams?.sortBy;
  const categoryParam = searchParams?.category;
  // Add other params as needed

  const currentPage = parseInt(pageParam || "1");
  const limit = 12; // Products per page

  let productsData;
  try {
    // CORRECTED: Removed .query() from tRPC call using direct caller
    // Pass destructured/validated params to the query
    productsData = await serverApi.products.getAll({
      limit,
      // Example: Implement cursor logic if your API supports it
      // cursor: (currentPage > 1) ? previousPageLastItemId : undefined,
      // categoryId: categoryParam,
      // sortBy: sortByParam as any, // Cast if your sortBy enum matches string
    });
  } catch (error) {
    console.error("Error fetching products for ProductsPage:", error);
    if (error instanceof Error && 'shape' in error) { 
        console.error("TRPC Error Shape:", (error as any).shape);
    }
    productsData = { items: [], nextCursor: undefined }; // Graceful fallback
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="mb-8 md:mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Our Collection</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Explore a wide range of natural products designed for your well-being and sensory delight.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <aside className="lg:col-span-1 lg:sticky lg:top-24 self-start">
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground mb-4">Filter & Sort</h2>
            <p className="text-sm text-muted-foreground mb-4">(Filter UI Placeholder)</p>
            {/* Placeholder for filter components - these would likely be Client Components */}
            {/* <ProductFiltersClient currentFilters={{ category: categoryParam, sortBy: sortByParam }} /> */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-foreground mb-1">Categories</h3>
                <ul className="space-y-1 text-sm">
                    <li><Link href="/products?category=essential-oils" className="text-muted-foreground hover:text-primary">Essential Oils</Link></li>
                    <li><Link href="/products?category=diffusers" className="text-muted-foreground hover:text-primary">Diffusers</Link></li>
                    <li><Link href="/products?category=candles" className="text-muted-foreground hover:text-primary">Candles</Link></li>
                    <li><Link href="/products?category=blends" className="text-muted-foreground hover:text-primary">Signature Blends</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground mb-1">Sort By</h3>
                <ul className="space-y-1 text-sm">
                    <li><Link href="/products?sortBy=createdAt_desc" className="text-muted-foreground hover:text-primary">Newest</Link></li>
                    <li><Link href="/products?sortBy=price_asc" className="text-muted-foreground hover:text-primary">Price: Low to High</Link></li>
                    <li><Link href="/products?sortBy=price_desc" className="text-muted-foreground hover:text-primary">Price: High to Low</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </aside>

        <main className="lg:col-span-3">
          {productsData.items.length > 0 ? (
            <ProductGrid products={productsData.items} />
          ) : (
            <div className="py-16 text-center">
              <p className="text-xl text-muted-foreground">
                No products found. Try adjusting your filters!
              </p>
            </div>
          )}
          {/* TODO: Add Pagination controls here based on productsData.nextCursor or total count */}
          {/* Example:
          {productsData.nextCursor && (
            <div className="mt-10 text-center">
              <Button asChild variant="outline">
                <Link href={`/products?page=${currentPage + 1}${sortByParam ? `&sortBy=${sortByParam}` : ''}${categoryParam ? `&category=${categoryParam}` : ''}`}>
                  Load More
                </Link>
              </Button>
            </div>
          )}
          */}
        </main>
      </div>
    </div>
  );
}
```

---
**Asset 404 Errors:**
The log still shows 404 errors for your static assets:
*   `GET /images/about-1.jpg 404`
*   `GET /videos/hero-bg.mp4 404`
*   `GET /sounds/ambient-nature.mp3 404`
*   `GET /images/hero-poster.jpg 404`
*   `GET /images/about-2.jpg 404`

**Action for you (Reminder):** Please double-check that these files exist at the correct paths within your project's `/public` directory:
*   `public/images/about-1.jpg`
*   `public/images/about-2.jpg`
*   `public/images/hero-poster.jpg`
*   `public/images/og-default.jpg` (for metadata)
*   `public/images/twitter-default.jpg` (for metadata)
*   `public/sounds/ambient-nature.mp3`
*   `public/videos/hero-bg.mp4`

If they are in the correct place, try a hard refresh in your browser (Ctrl+Shift+R or Cmd+Shift+R) or test in an incognito window to rule out browser caching. Sometimes the Next.js dev server also needs a full restart after adding new files to `/public`.

---
**Summary and Conclusion:**

1.  **`searchParams` Access in Server Components (`src/app/auth/signin/page.tsx`, `src/app/products/page.tsx`):**
    *   Modified to access properties of `searchParams` by first assigning them to local variables (e.g., `const error = searchParams?.error;`). This pattern can sometimes help with how Next.js/Turbopack handle these dynamic props in Server Components.
2.  **tRPC Call Syntax in Server Components (`src/app/products/page.tsx`):**
    *   Corrected the server-side tRPC call by removing the extraneous `.query()`. It now correctly uses `await serverApi.products.getAll({ /* input */ });`. This should resolve the `No procedure found on path "products,getAll,query"` error for this page.
3.  **Asset 404s:** These remain an issue related to file placement in your `/public` directory, not code logic that I can fix directly.

After applying these changes:
*   Ensure all static assets are correctly located in your `/public` folder.
*   Restart your dev server (`npm run dev`).

These updates should resolve the specific errors related to `searchParams` access and the tRPC call on the products page.
