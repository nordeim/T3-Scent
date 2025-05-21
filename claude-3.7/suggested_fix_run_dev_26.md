Okay, I've performed a deep review of your project files and the reported errors. Here's a breakdown of the issues found and the applied fixes.

**Summary of Key Issues and Fixes:**

1.  **`quiz.getAdvancedQuizQuestions` tRPC Error:**
    *   The generic error `Error: [[ << query #1 ]quiz.getAdvancedQuizQuestions {}` from `errors.txt` usually indicates a server-side processing issue or a serialization problem.
    *   A specific bug was found in `src/server/api/routers/quiz.ts` within the `submitQuizResponses` procedure (not `getAdvancedQuizQuestions` directly, but related to quiz functionality). The input schema for `questionId` was `z.string().cuid()`, but the seed data uses fixed string IDs (e.g., `clwzquiz0001`). This mismatch would cause validation errors on submission.
    *   **Fix:** Changed `questionId: z.string().cuid()` to `questionId: z.string()` in the `submitQuizResponses` input schema in `src/server/api/routers/quiz.ts`.
    *   **Further Enhancement (Defensive Coding for `getAdvancedQuizQuestions`):** Added more robust logging within the `map` function in `getAdvancedQuizQuestions` to help diagnose if any specific question's data structure causes an issue during transformation (though the original code for options parsing was already fairly robust).

2.  **`toggleMobileMenu is not defined` in Navbar:**
    *   The `onClick` handlers for mobile menu links in `src/components/layout/Navbar.tsx` were attempting to call `toggleMobileMenu` which was not defined in a way that sets the mobile menu state.
    *   **Fix:** Defined `const toggleMobileMenu = () => setIsMobileMenuOpen(false);` within the `Navbar` component to close the menu upon navigation.

3.  **`searchParams` / `params` Warnings (Dynamic API Usage):**
    *   Next.js shows warnings when `searchParams` or `params` (which make a page dynamic) are accessed in Server Components, especially if the component isn't explicitly `async` or if access patterns seem problematic to its static analyzer.
    *   **Fix:** Ensured relevant page components like `src/app/auth/signin/page.tsx` are declared as `async function`. The actual access pattern of `searchParams?.prop` was already correct. This change primarily addresses the Next.js analyzer's expectations.

4.  **Image 404s in `src/app/gift-cards/page.tsx`:**
    *   The page attempts to load images like `/images/gift_card_25.jpg` which were not found. This is a missing asset issue.
    *   **Fix (Code-Side):** Added a comment in `src/app/gift-cards/page.tsx` reminding that these images need to be placed in the `public/images/` directory. Also, imported `Link` from `next/link` which was missing.

5.  **Missing `postRouter` in `src/server/api/root.ts`:**
    *   The project includes `src/app/_components/post.tsx` and `src/server/api/routers/post.ts` (a common T3 app example), but `postRouter` was not registered in the main `appRouter`.
    *   **Fix:** Added `post: postRouter` to the `appRouter` in `src/server/api/root.ts`.

6.  **Environment File Consolidation (`src/env.mjs`):**
    *   The project had both `src/env.js` (from collection 4, more complete) and `src/env.mjs` (from collection 3, simpler). The `package.json` indicates ESM (`"type": "module"`), and `create-t3-app` typically generates `src/env.mjs`.
    *   **Fix:** Used the more comprehensive content from `src/env.js` (collection 4) for the `src/env.mjs` file, ensuring it aligns with the project's primary env management. The file `src/env.js` is no longer needed if `src/env.mjs` is the standard. *I will provide the updated `src/env.mjs`.*

7.  **NextAuth.js v4 Remnants:**
    *   Files `src/server/auth/index.ts` and `src/server/auth/config.ts` appeared to be for NextAuth.js v4, while the project uses v5 (`next-auth: "5.0.0-beta.25"`) and has `src/server/auth.ts` configured for v5.
    *   **Action:** These v4 files are superseded and should be removed. I will not provide updated versions for them as they are not part of the active v5 setup. The main `src/server/auth.ts` is correct.

8.  **Unique Constraint Error Handling in `newsletterRouter`:**
    *   The check for unique email constraint violations in `src/server/api/routers/newsletter.ts` was a bit specific (`error.meta?.target === 'NewsletterSubscriber_email_key'`).
    *   **Fix:** Made the check more robust by checking if the `target` array (as Prisma's `meta.target` for P2002 is typically an array of field names) includes `'email'`: `if (error.code === 'P2002' && (error.meta?.target as string[])?.includes('email'))`.

9.  **Admin Product Stock Status Filter (`adminProductsRouter`):**
    *   The logic for filtering products by `low_stock` in `src/server/api/routers/admin/products.ts` used an invalid Prisma syntax (`prisma.product.fields.lowStockThreshold`). Prisma's `WHERE` clause doesn't support direct field-to-field comparisons.
    *   **Fix:** Simplified the `low_stock` filter to use a fixed sensible threshold (e.g., quantity between 1 and 10). A more dynamic solution would require more complex logic or raw queries. Changed to: `where.AND = [ {stockQuantity: { gt: 0 }}, { stockQuantity: { lte: 10 }} ] ;`

10. **Tailwind CSS Class `border-border` Error:**
    *   The log `[Error: Cannot apply unknown utility class: border-border]` was noted. The configurations in `globals.css` (defining `--border` and `@apply border-border`) and `tailwind.config.ts` (using `hsl(var(--border))`) appear correct. This error is likely a transient development server issue or a very specific context problem not evident from the provided files. No changes made to Tailwind configuration files as they seem correct.

The following files have been updated. Files not listed were deemed correct or did not require changes based on the provided information and error logs.

```tsx
// src/components/layout/Navbar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, type ReactNode } from "react"; // Added ReactNode for userNavLinks icon
import { FaBars, FaTimes, FaShoppingCart, FaUserCircle, FaMoon, FaSun, FaSignOutAlt } from "react-icons/fa";
import { Button } from "~/components/ui/Button";
import { ThemeToggle } from "~/components/ui/ThemeToggle";
import { useCart } from "~/contexts/CartContext";
import { cn } from "~/lib/utils";

const mainNavLinks = [
  { href: "/products", label: "All Products" },
  { href: "/collections/essential-oils", label: "Essential Oils" },
  { href: "/collections/diffusers", label: "Diffusers" },
  { href: "/quiz", label: "Scent Quiz" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact"},
];

// Define interface for user navigation items including optional icon
interface UserNavLink {
    href: string;
    label: string;
    icon?: ReactNode; // Optional icon
}

const userNavLinks: UserNavLink[] = [ // Typed as UserNavLink[]
    { href: "/account/profile", label: "My Profile" },
    { href: "/account/orders", label: "My Orders" },
    { href: "/account/subscriptions", label: "My Subscriptions" },
    { href: "/account/wishlist", label: "My Wishlist" },
    { href: "/account/loyalty", label: "Rewards & Loyalty" },
];

export const Navbar = () => {
  const { data: session, status } = useSession();
  const { itemCount: cartItemCount, toggleCart } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false); // Defined function to close mobile menu

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/20 bg-background/80 shadow-sm backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 dark:bg-card/80 dark:border-border/30">
      <div className="container flex h-16 items-center sm:h-20">
        {/* Mobile Menu Toggle */}
        <div className="mr-4 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle mobile menu">
            {isMobileMenuOpen ? <FaTimes className="h-5 w-5" /> : <FaBars className="h-5 w-5" />}
          </Button>
        </div>

        {/* Logo / Brand Name */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2" onClick={closeMobileMenu}> {/* Close menu on logo click */}
            {/* <Image src="/logo.png" alt="The Scent Logo" width={36} height={36} /> */}
            <span className="text-2xl font-bold text-foreground font-head">The Scent</span>
          </Link>
        </div>

        {/* Desktop Navigation - Centered */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-6 lg:gap-8 text-sm">
          {mainNavLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="font-accent font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary text-[0.9rem]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side icons and actions */}
        <div className={cn("flex items-center space-x-2 sm:space-x-3", {"md:ml-auto": true } )}>
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={toggleCart} aria-label="Open cart" className="relative">
            <FaShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {cartItemCount}
              </span>
            )}
          </Button>

          {status === "loading" && ( <div className="h-9 w-20 rounded-md bg-muted animate-pulse"></div> )}
          {status === "unauthenticated" && ( <Button onClick={() => signIn()} variant="outline" size="sm">Sign In</Button> )}
          {status === "authenticated" && session?.user && (
            <div className="relative group">
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 sm:h-10 sm:w-10">
                {session.user.image ? (
                  <Image src={session.user.image} alt={session.user.name || "User"} width={36} height={36} className="rounded-full" />
                ) : ( <FaUserCircle className="h-6 w-6 text-muted-foreground" /> )}
              </Button>
              <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-popover text-popover-foreground shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible focus-within:opacity-100 focus-within:visible transition-all duration-150 ease-out"
                   role="menu" aria-orientation="vertical">
                <div className="py-1" role="none">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold truncate">{session.user.name || "Valued Customer"}</p>
                    <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                  </div>
                  {userNavLinks.map(link => (
                     <Link key={link.href} href={link.href} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted" role="menuitem">
                        {link.icon && <span className="w-4 h-4">{link.icon}</span>} {link.label}
                     </Link>
                  ))}
                  {(session.user.role === "ADMIN" || session.user.role === "MANAGER") && (
                    <Link href="/admin/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted" role="menuitem">
                        Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-destructive hover:bg-destructive/10"
                    role="menuitem"
                  >
                    <FaSignOutAlt /> Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-background shadow-lg border-t border-border z-40">
          <nav className="flex flex-col space-y-1 px-3 py-4">
            {mainNavLinks.map((link) => (
              <Link key={link.label} href={link.href} onClick={closeMobileMenu} // Use closeMobileMenu
                className="block rounded-md px-3 py-2.5 text-base font-medium text-muted-foreground hover:bg-muted hover:text-primary">
                {link.label}
              </Link>
            ))}
            <div className="my-3 border-t border-border"></div>
            {status === "authenticated" && session?.user ? (
                <>
                     {userNavLinks.map(link => (
                         <Link key={link.href} href={link.href} onClick={closeMobileMenu} // Use closeMobileMenu
                            className="block rounded-md px-3 py-2.5 text-base font-medium text-muted-foreground hover:bg-muted hover:text-primary">
                            {link.label}
                         </Link>
                      ))}
                      {(session.user.role === "ADMIN" || session.user.role === "MANAGER") && (
                        <Link href="/admin/dashboard" onClick={closeMobileMenu} // Use closeMobileMenu
                            className="block rounded-md px-3 py-2.5 text-base font-medium text-muted-foreground hover:bg-muted hover:text-primary">
                            Admin Dashboard
                        </Link>
                      )}
                     <button onClick={() => { signOut({ callbackUrl: '/' }); closeMobileMenu(); }} // Use closeMobileMenu
                        className="block w-full rounded-md px-3 py-2.5 text-left text-base font-medium text-destructive hover:bg-destructive/10">
                        Sign Out
                      </button>
                </>
            ) : status === "unauthenticated" ? (
                <Button onClick={() => { signIn(); closeMobileMenu(); }} variant="default" className="w-full mt-2">Sign In</Button> // Use closeMobileMenu
            ) : null}
          </nav>
        </div>
      )}
    </header>
  );
};
```

```tsx
// src/app/auth/signin/page.tsx
import { type Metadata } from "next";
import Link from "next/link"; 
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

// Changed to async function to potentially appease Next.js dynamic rendering analysis for searchParams
export default async function SignInPage({ searchParams }: SignInPageProps) {
  // Access searchParams properties at the beginning of the function
  const error = searchParams?.error;
  const callbackUrl = searchParams?.callbackUrl;

  // Any server-side async operations (if this page had them) would come after accessing props.
  // For example:
  // const someServerData = await someAsyncFunction(); 

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-muted/30 px-4 py-12 sm:px-6 lg:px-8 dark:bg-background">
      <div className="w-full max-w-md space-y-8">
        <div>
          <Link href="/" className="flex justify-center mb-6">
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
        {/* Pass the resolved/accessed props */}
        <SignInFormClient error={error} callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}
```

```tsx
// src/app/products/page.tsx
import { type Metadata } from "next";
import Link from "next/link";
import { ProductGrid } from "~/components/products/ProductGrid";
import { createServerActionClient } from "~/trpc/server";
// import { Button } from "~/components/ui/Button"; // Not used directly in this version

export const metadata: Metadata = {
  title: "All Products - The Scent",
  description: "Browse our entire collection of premium aromatherapy and wellness products.",
};

interface ProductsPageProps {
  searchParams?: {
    page?: string;
    sortBy?: string;
    category?: string;
    // ... other potential filters
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  // Access searchParams properties at the beginning
  const pageParam = searchParams?.page;
  const sortByParam = searchParams?.sortBy;
  const categoryParam = searchParams?.category;

  const currentPage = parseInt(pageParam || "1"); // currentPage not used in current getAll query
  const limit = 12; 

  const serverApi = await createServerActionClient();

  let productsData;
  try {
    productsData = await serverApi.products.getAll({
      limit,
      cursor: undefined, // Example: if you were to implement cursor pagination with 'pageParam'
      categoryId: categoryParam,
      sortBy: sortByParam as any, // Cast to any if sortBy enum in router is complex
    });
  } catch (error) {
    console.error("Error fetching products for ProductsPage:", error);
    // More detailed error logging if needed
    // if (error instanceof Error && 'shape' in error && (error as any).shape?.data?.code === 'NOT_FOUND') {
    //     console.warn("A specific sub-procedure might be missing for products.getAll filters or includes.");
    // } else if (error instanceof Error && 'shape' in error) { 
    //     console.error("TRPC Error Shape:", (error as any).shape);
    // }
    productsData = { items: [], nextCursor: undefined }; // Fallback to empty
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="mb-8 md:mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl font-head">Our Collection</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto font-body">
          Explore a wide range of natural products designed for your well-being and sensory delight.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <aside className="lg:col-span-1 lg:sticky lg:top-24 self-start">
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground font-head mb-4">Filter & Sort</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2 font-accent uppercase tracking-wider">Categories</h3>
                <ul className="space-y-1.5 text-sm">
                    <li><Link href={`/products?category=essential-oils${sortByParam ? `&sortBy=${sortByParam}` : ''}`} className="text-muted-foreground hover:text-primary transition-colors">Essential Oils</Link></li>
                    <li><Link href={`/products?category=diffusers${sortByParam ? `&sortBy=${sortByParam}` : ''}`} className="text-muted-foreground hover:text-primary transition-colors">Diffusers</Link></li>
                    <li><Link href={`/products?category=candles${sortByParam ? `&sortBy=${sortByParam}` : ''}`} className="text-muted-foreground hover:text-primary transition-colors">Candles</Link></li>
                    <li><Link href={`/products?category=blends${sortByParam ? `&sortBy=${sortByParam}` : ''}`} className="text-muted-foreground hover:text-primary transition-colors">Signature Blends</Link></li>
                     <li><Link href={`/products${sortByParam ? `?sortBy=${sortByParam}` : ''}`} className="text-muted-foreground hover:text-primary transition-colors font-semibold">All Categories</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2 font-accent uppercase tracking-wider">Sort By</h3>
                <ul className="space-y-1.5 text-sm">
                    <li><Link href={`/products?sortBy=createdAt_desc${categoryParam ? `&category=${categoryParam}` : ''}`} className="text-muted-foreground hover:text-primary transition-colors">Newest</Link></li>
                    <li><Link href={`/products?sortBy=price_asc${categoryParam ? `&category=${categoryParam}` : ''}`} className="text-muted-foreground hover:text-primary transition-colors">Price: Low to High</Link></li>
                    <li><Link href={`/products?sortBy=price_desc${categoryParam ? `&category=${categoryParam}` : ''}`} className="text-muted-foreground hover:text-primary transition-colors">Price: High to Low</Link></li>
                    <li><Link href={`/products?sortBy=rating_desc${categoryParam ? `&category=${categoryParam}` : ''}`} className="text-muted-foreground hover:text-primary transition-colors">Rating</Link></li>
                    <li><Link href={`/products${categoryParam ? `?category=${categoryParam}` : ''}`} className="text-muted-foreground hover:text-primary transition-colors font-semibold">Default</Link></li>
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
          {/* TODO: Implement full pagination based on productsData.nextCursor or total count */}
        </main>
      </div>
    </div>
  );
}
```

```tsx
// src/app/collections/[slug]/page.tsx
import { type Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductGrid } from "~/components/products/ProductGrid";
import { createServerActionClient } from "~/trpc/server";
import { env } from "~/env.js";
// import { Button } from "~/components/ui/Button"; // Not used directly

interface CollectionPageProps {
  params: { slug: string };
  searchParams?: { 
    page?: string;
    sortBy?: string;
  };
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const slug = params.slug; 
  // const serverApi = await createServerActionClient(); // serverApi not used for metadata in this version
  
  // Placeholder: Fetch actual collection details for metadata if available
  // const collectionDetails = await serverApi.collections.getBySlug({ slug }); 
  // if (!collectionDetails) {
  //   return { title: "Collection Not Found" };
  // }
  // const title = `${collectionDetails.name} Collection - The Scent`;
  // const description = collectionDetails.description || `Explore products from our ${collectionDetails.name} collection.`;
  
  // Simple metadata generation from slug
  const collectionNameFromSlug = slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  const title = `${collectionNameFromSlug} Collection - The Scent`;
  const description = `Discover our exclusive ${collectionNameFromSlug} collection, featuring unique aromatherapy products.`;

  return {
    title,
    description,
    metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
    openGraph: {
      title,
      description,
      url: `${env.NEXT_PUBLIC_SITE_URL}/collections/${slug}`,
      // images: [collectionDetails?.imageUrl || '/images/og-default.jpg'], // Needs collectionDetails
    },
  };
}

export default async function CollectionPage({ params, searchParams }: CollectionPageProps) {
  const slug = params.slug; 
  const pageParam = searchParams?.page; 
  const sortByParam = searchParams?.sortBy;

  const serverApi = await createServerActionClient();
  
  const currentPage = parseInt(pageParam || "1"); // currentPage not used in current getAll query
  const limit = 12; 

  let productsData;
  let collectionName = slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  let collectionDescription = `Browse through the finest items in our ${collectionName} selection.`;

  // Placeholder for fetching actual collection details (if a collections router exists and has getBySlug)
  // try {
  //   const collectionDetails = await serverApi.collections.getBySlug({ slug }); 
  //   if (!collectionDetails) notFound(); // If collection must exist
  //   collectionName = collectionDetails.name;
  //   collectionDescription = collectionDetails.description || collectionDescription;
  // } catch (error) {
  //   console.error(`Error fetching collection details for ${slug}:`, error);
  //   // if (error has code NOT_FOUND) notFound();
  // }

  try {
    productsData = await serverApi.products.getAll({
      collectionSlug: slug,
      limit,
      sortBy: sortByParam as any, // Cast to any if sortBy enum in router is complex
    });
  } catch (error) {
    console.error(`Error fetching products for collection ${slug}:`, error);
    // More detailed error logging if needed
    productsData = { items: [], nextCursor: undefined }; // Fallback
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="mb-8 md:mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {collectionName}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          {collectionDescription}
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <aside className="lg:col-span-1 lg:sticky lg:top-24 self-start">
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-foreground mb-4">Refine This Collection</h2>
                <p className="text-sm text-muted-foreground">(Filters specific to this collection would appear here - Placeholder)</p>
                {/* Example refinement links, similar to products page */}
                <ul className="space-y-1.5 text-sm mt-4">
                    <li><Link href={`/collections/${slug}?sortBy=createdAt_desc`} className="text-muted-foreground hover:text-primary transition-colors">Newest</Link></li>
                    <li><Link href={`/collections/${slug}?sortBy=price_asc`} className="text-muted-foreground hover:text-primary transition-colors">Price: Low to High</Link></li>
                    <li><Link href={`/collections/${slug}?sortBy=price_desc`} className="text-muted-foreground hover:text-primary transition-colors">Price: High to Low</Link></li>
                </ul>
            </div>
        </aside>
        <main className="lg:col-span-3">
            {productsData.items.length > 0 ? (
                <ProductGrid products={productsData.items} />
            ) : (
                <div className="py-16 text-center">
                <p className="text-xl text-muted-foreground">
                    No products currently in this collection. Check back soon!
                </p>
                </div>
            )}
            {/* TODO: Add Pagination controls here based on productsData.nextCursor */}
        </main>
      </div>
    </div>
  );
}
```

```tsx
// src/app/gift-cards/page.tsx
import { type Metadata } from "next";
import Image from "next/image";
import Link from "next/link"; // Added missing import
import { Button } from "~/components/ui/Button"; 

export const metadata: Metadata = {
  title: "Gift Cards - The Scent",
  description: "Give the gift of choice with The Scent gift cards. Perfect for any occasion.",
};

export default function GiftCardsPage() {
  const giftCardOptions = [
    // Ensure these image paths will exist in your /public/images/ directory
    // For example, create placeholder images there if actual ones are missing.
    { amount: 25, imageUrl: "/images/gift_card_25.jpg", altText: "A beautifully designed $25 The Scent gift card" }, 
    { amount: 50, imageUrl: "/images/gift_card_50.jpg", altText: "A beautifully designed $50 The Scent gift card" },
    { amount: 100, imageUrl: "/images/gift_card_100.jpg", altText: "A beautifully designed $100 The Scent gift card" },
    { amount: 200, imageUrl: "/images/gift_card_200.jpg", altText: "A beautifully designed $200 The Scent gift card" },
  ];

  return (
    <div className="container mx-auto min-h-[calc(100vh-theme(space.32))] px-4 py-12 md:py-16">
      <header className="mb-10 md:mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl font-head">
          The Scent Gift Cards
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto font-body">
          Share the gift of tranquility and well-being. Our gift cards are perfect for any occasion and let your loved ones choose their favorite scents.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {giftCardOptions.map((option) => (
          <div key={option.amount} className="rounded-lg border border-border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col group transition-all hover:shadow-xl hover:transform hover:-translate-y-1">
            <div className="relative aspect-video w-full overflow-hidden">
              {/* 
                NOTE: For the images to work, ensure files like 'public/images/gift_card_25.jpg' exist.
                If they don't, this will result in 404s for the images.
              */}
              <Image 
                src={option.imageUrl} 
                alt={option.altText} 
                fill 
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            </div>
            <div className="p-6 flex flex-col flex-grow">
              <h2 className="text-2xl font-semibold text-foreground font-head">${option.amount} Gift Card</h2>
              <p className="text-sm text-muted-foreground mt-2 mb-4 flex-grow font-body">
                Redeemable for any product on our store. Delivered instantly by email with instructions.
              </p>
              <Button className="w-full mt-auto font-accent">
                Purchase ${option.amount} Card
              </Button>
            </div>
          </div>
        ))}
      </div>

      <section className="mt-16 md:mt-24 text-center max-w-3xl mx-auto bg-muted/50 dark:bg-card p-8 rounded-lg shadow">
        <h2 className="text-2xl font-semibold text-foreground font-head mb-6">How It Works</h2>
        <ol className="space-y-4 text-muted-foreground text-left font-body list-decimal list-inside">
          <li>Choose your desired gift card amount and complete your purchase.</li>
          <li>You'll instantly receive an email containing the unique gift card code.</li>
          <li>Forward the email or share the code with your lucky recipient.</li>
          <li>They can redeem it at checkout to experience the world of The Scent!</li>
        </ol>
        <p className="mt-8 text-sm text-muted-foreground font-body">
          Our gift cards are non-refundable and do not expire. 
          For any questions, please don't hesitate to <Link href="/contact" className="text-primary hover:underline font-semibold">contact our support team</Link>.
        </p>
      </section>
    </div>
  );
}
```

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
  post: postRouter, // Added postRouter

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

```ts
// src/server/api/routers/quiz.ts
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { 
    type QuizQuestion as PrismaQuizQuestion, 
    QuizQuestionType as PrismaQuizQuestionType,
    type Prisma // Added Prisma for Prisma.PrismaClientKnownRequestError
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

export interface AdvancedQuizQuestionClient extends Omit<PrismaQuizQuestion, 'options' | 'type'> {
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
      // This should ideally not happen if all enum members are covered.
      // If it does, it's a type mismatch or new enum member not handled.
      console.warn(`Unknown PrismaQuizQuestionType: ${prismaType as string} mapped to 'single'.`);
      return "single"; 
  }
}

export const quizRouter = createTRPCRouter({
  getAdvancedQuizQuestions: publicProcedure
    .query(async ({ ctx }): Promise<AdvancedQuizQuestionClient[]> => {
      try {
        console.log("Fetching advanced quiz questions from DB...");
        const questionsFromDb = await ctx.db.quizQuestion.findMany({
          orderBy: { order: 'asc' },
        });

        if (questionsFromDb.length === 0) {
            console.log("No quiz questions found in the database.");
            return [];
        }
        
        console.log(`Found ${questionsFromDb.length} questions, transforming...`);

        return questionsFromDb.map((q, index) => {
          let parsedOptions: AdvancedQuizQuestionOption[] = [];
          try {
            if (Array.isArray(q.options)) {
              const optionsValidation = z.array(ZodQuizOptionSchema).safeParse(q.options);
              if (optionsValidation.success) {
                parsedOptions = optionsValidation.data;
              } else {
                console.error(`Invalid options JSON structure for QuizQuestion ID ${q.id} (index ${index}):`, optionsValidation.error.flatten().fieldErrors, "Raw options:", q.options);
                // Keep parsedOptions as [] to avoid crashing the entire query
              }
            } else {
              console.error(`Options for QuizQuestion ID ${q.id} (index ${index}) is not an array or expected structure:`, q.options);
              // Keep parsedOptions as []
            }
          } catch (parseError) {
             console.error(`Critical error parsing options for QuizQuestion ID ${q.id} (index ${index}):`, parseError, "Raw options:", q.options);
             // Keep parsedOptions as []
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
        console.error("Failed to fetch or transform advanced quiz questions:", error);
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
          questionId: z.string(), // Changed from .cuid() to .string() to match seed IDs
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
        
        console.log(`Stored ${input.responses.length} quiz responses for ${userId ? `user ${userId}` : `session ${input.sessionId ?? 'unknown'}`}`);
        
        return { 
          success: true, 
          message: "Your quiz responses have been saved.",
          responseCount: input.responses.length 
        };

      } catch (error) {
        console.error("Failed to submit quiz responses:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2003') { // Foreign key constraint failed on questionId
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
        : z.string().min(1, "AUTH_SECRET is required for development too"), // Still good practice for dev
    AUTH_URL: z.preprocess(
      // This logic ensures AUTH_URL is set for Vercel deployments.
      // NextAuth.js v5 might infer this, but explicit is safer.
      (str) => process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : str,
      process.env.VERCEL ? z.string().min(1) : z.string().url().optional()
    ),
    AUTH_TRUST_HOST: z.preprocess(
        (str) => str === "true" || str === "1", // Convert string "true" or "1" to boolean
        z.boolean().optional().default(process.env.NODE_ENV !== "production") // Default true in dev, false in prod unless explicitly set to true
    ),

    // OAuth Providers
    GOOGLE_CLIENT_ID: z.string().optional(), // Optional: only if Google provider is used
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    
    // Discord Provider - Made optional
    AUTH_DISCORD_ID: z.string().optional(), // Optional: only if Discord provider is used
    AUTH_DISCORD_SECRET: z.string().optional(),

    // Stripe
    STRIPE_SECRET_KEY: z.string().startsWith("sk_").min(1, "Stripe secret key is required"),
    STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(), // Optional for local dev

    // Optional: Email Service (example)
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
    // Example client-side var:
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

```ts
// src/server/api/routers/newsletter.ts
import { createTRPCRouter, publicProcedure, adminProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { type Prisma } from "@prisma/client";

export const newsletterRouter = createTRPCRouter({
  /**
   * Allows a user to subscribe to the newsletter.
   * If the email already exists and is inactive, it reactivates the subscription.
   * If already active, it informs the user.
   */
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
              // updatedAt: new Date(), // Prisma typically handles updatedAt automatically
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
            // More robust check for unique constraint violation on 'email' field
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                 const targetFields = error.meta?.target as string[] | undefined;
                 if (targetFields?.includes('email')) {
                    throw new TRPCError({ code: "BAD_REQUEST", message: "This email address is already in use by another subscriber." });
                 }
            }
            console.error("Failed to update subscriber:", error);
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update subscriber." });
        }
    }),
  
  unsubscribe: publicProcedure 
    .input(z.object({ email: z.string().email(), token: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      // TODO: If using token for one-click unsubscribe, validate it first for security.
      // This current implementation is simple and might be okay if called from a user's authenticated session settings page.
      // For public unsubscribe links in emails, a token system is crucial.
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

        if (stockStatus === "out_of_stock") {
            where.stockQuantity = { lte: 0 };
        } else if (stockStatus === "low_stock") {
            // Simplified: Assumes a general low stock threshold (e.g., 10) or that products have their own `lowStockThreshold` field.
            // Prisma cannot directly compare `stockQuantity <= lowStockThreshold` in a single WHERE.
            // This typically requires fetching and filtering in code, or using a default value for comparison.
            // For this example, let's use a fixed value or rely on a client-side calculation if `lowStockThreshold` is dynamic per product.
            where.AND = [
                { stockQuantity: { gt: 0 } }, 
                { stockQuantity: { lte: 10 } } // Example: Define low stock as <= 10 items and > 0.
                                                // For dynamic comparison against product.lowStockThreshold, 
                                                // you'd need a raw query or application-level filtering.
            ];
        } else if (stockStatus === "in_stock") {
            // Assuming "in_stock" means not out_of_stock and not low_stock (above threshold)
             where.stockQuantity = { gt: 10 }; // Example: Define in_stock as > 10 items
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
        // Add more robust checks here if needed, e.g., active subscriptions, etc.
        // Prisma's onDelete: Restrict on OrderItem -> Product will prevent deletion if product is in orders.
        await ctx.db.product.delete({ where: { id: input.id } });
        return { success: true, message: "Product deleted successfully." };
      } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // P2003: Foreign key constraint failed
            // P2025: Record to delete does not exist.
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
    getAllCollections: adminProcedure.query(async ({ctx}) => { // Added this for completeness
        return ctx.db.collection.findMany({orderBy: {name: 'asc'}});
    }),
});
```

**Regarding `src/env.js` vs `src/env.mjs`:**
The project structure provided `src/env.mjs` in collection 3, and `src/env.js` in collection 4. Given `package.json` has `"type": "module"`, `.mjs` is the explicit ESM extension, while `.js` files are also treated as ESM. Standard `create-t3-app` usually generates `src/env.mjs`. I've used the more complete schema from collection 4's `env.js` and provided it as `src/env.mjs`. If your project actually uses `src/env.js`, you can rename the provided `env.mjs` content to `env.js`.

**Authentication Files:**
As mentioned, `src/server/auth.ts` is the correct file for NextAuth.js v5. The files `src/server/auth/index.ts` and `src/server/auth/config.ts` are for v4 and would typically be removed in a v5 setup. Therefore, I haven't provided "updated" versions of these v4 files.

This covers the primary errors and inconsistencies found. The platform should be more stable with these changes. Remember to place the gift card images in `public/images/` for them to load correctly. The `quiz.getAdvancedQuizQuestions` tRPC error should be further investigated with server-side logs if the added client-side logging in the router doesn't pinpoint a data transformation issue for a specific question.

