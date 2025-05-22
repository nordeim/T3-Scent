The fixes for the following `searchParams` errors are shown below:

```errors
Error: Route "/auth/signin" used `searchParams.error`. `searchParams` should be awaited before using its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
Error: Route "/auth/signin" used `searchParams.callbackUrl`. `searchParams` should be awaited before using its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
Error: Route "/auth/signin" used `searchParams.error`. `searchParams` should be awaited before using its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
Error: Route "/auth/signin" used `searchParams.callbackUrl`. `searchParams` should be awaited before using its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
Error: Route "/products" used `searchParams.page`. `searchParams` should be awaited before using its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
Error: Route "/products" used `searchParams.sortBy`. `searchParams` should be awaited before using its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
Error: Route "/products" used `searchParams.category`. `searchParams` should be awaited before using its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
Error: Route "/collections/[slug]" used `params.slug`. `params` should be awaited before using its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
Error: Route "/collections/[slug]" used `searchParams.page`. `searchParams` should be awaited before using its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
Error: Route "/collections/[slug]" used `searchParams.sortBy`. `searchParams` should be awaited before using its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
Error: Route "/collections/[slug]" used `params.slug`. `params` should be awaited before using its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
Error: Route "/collections/[slug]" used `params.slug`. `params` should be awaited before using its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
Error: Route "/collections/[slug]" used `searchParams.page`. `searchParams` should be awaited before using its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
Error: Route "/collections/[slug]" used `searchParams.sortBy`. `searchParams` should be awaited before using its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
Error: Route "/collections/[slug]" used `params.slug`. `params` should be awaited before using its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
```

$ diff -u src/app/auth/signin/page.tsx-orig src/app/auth/signin/page.tsx-fixed
--- src/app/auth/signin/page.tsx-orig   2025-05-22 06:45:48.092009929 +0800
+++ src/app/auth/signin/page.tsx-fixed        2025-05-22 06:30:54.856707114 +0800
@@ -1,44 +1,45 @@
-// src/app/auth/signin/page.tsx
-import { type Metadata } from "next";
-import Link from "next/link"; 
-import SignInFormClient from "./SignInFormClient"; 
-
-export const metadata: Metadata = {
-  title: "Sign In - The Scent",
-  description: "Sign in to your The Scent account.",
-};
-
-interface SignInPageProps {
-  searchParams?: {
-    callbackUrl?: string;
-    error?: string; 
-  };
-}
-
-export default async function SignInPage({ searchParams }: SignInPageProps) {
-  // Access searchParams properties at the beginning of the function
-  const error = searchParams?.error;
-  const callbackUrl = searchParams?.callbackUrl;
-
-  return (
-    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-muted/30 px-4 py-12 sm:px-6 lg:px-8 dark:bg-background">
-      <div className="w-full max-w-md space-y-8">
-        <div>
-          <Link href="/" className="flex justify-center mb-6">
-            <span className="text-2xl font-bold text-foreground">The Scent</span>
-          </Link>
-          <h2 className="text-center text-3xl font-bold tracking-tight text-foreground">
-            Sign in to your account
-          </h2>
-          <p className="mt-2 text-center text-sm text-muted-foreground">
-            Or{' '}
-            <Link href="/auth/signup" className="font-medium text-primary hover:text-primary/80">
-              create a new account
-            </Link>
-          </p>
-        </div>
-        <SignInFormClient error={error} callbackUrl={callbackUrl} />
-      </div>
-    </div>
-  );
-}
+// src/app/auth/signin/page.tsx
+import { type Metadata } from "next";
+import Link from "next/link"; 
+import SignInFormClient from "./SignInFormClient"; 
+
+export const metadata: Metadata = {
+  title: "Sign In - The Scent",
+  description: "Sign in to your The Scent account.",
+};
+
+interface SignInPageProps {
+  searchParams?: {
+    callbackUrl?: string;
+    error?: string; 
+  };
+}
+
+export default async function SignInPage(props: SignInPageProps) {
+  // Await searchParams before accessing its properties (Next.js 14+ dynamic API)
+  const searchParams = await props.searchParams;
+  const error = searchParams?.error;
+  const callbackUrl = searchParams?.callbackUrl;
+
+  return (
+    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-muted/30 px-4 py-12 sm:px-6 lg:px-8 dark:bg-background">
+      <div className="w-full max-w-md space-y-8">
+        <div>
+          <Link href="/" className="flex justify-center mb-6">
+            <span className="text-2xl font-bold text-foreground">The Scent</span>
+          </Link>
+          <h2 className="text-center text-3xl font-bold tracking-tight text-foreground">
+            Sign in to your account
+          </h2>
+          <p className="mt-2 text-center text-sm text-muted-foreground">
+            Or{' '}
+            <Link href="/auth/signup" className="font-medium text-primary hover:text-primary/80">
+              create a new account
+            </Link>
+          </p>
+        </div>
+        <SignInFormClient error={error} callbackUrl={callbackUrl} />
+      </div>
+    </div>
+  );
+}
\ No newline at end of file

$ diff -u src/app/collections/\[slug\]/page.tsx-orig src/app/collections/\[slug\]/page.tsx-fixed
--- src/app/collections/[slug]/page.tsx-orig    2025-05-22 06:46:56.001727328 +0800
+++ src/app/collections/[slug]/page.tsx-fixed 2025-05-22 06:30:54.856707114 +0800
@@ -1,110 +1,115 @@
-// src/app/collections/[slug]/page.tsx
-import { type Metadata } from "next";
-import { notFound } from "next/navigation";
-import Link from "next/link";
-import { ProductGrid } from "~/components/products/ProductGrid";
-import { createServerActionClient } from "~/trpc/server";
-import { env } from "~/env.js";
-
-interface CollectionPageProps {
-  params: { slug: string };
-  searchParams?: { 
-    page?: string;
-    sortBy?: string;
-  };
-}
-
-export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
-  const slug = params.slug; 
-  
-  const collectionNameFromSlug = slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
-  const title = `${collectionNameFromSlug} Collection - The Scent`;
-  const description = `Discover our exclusive ${collectionNameFromSlug} collection, featuring unique aromatherapy products.`;
-
-  return {
-    title,
-    description,
-    metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
-    openGraph: {
-      title,
-      description,
-      url: `${env.NEXT_PUBLIC_SITE_URL}/collections/${slug}`,
-    },
-  };
-}
-
-export default async function CollectionPage({ params, searchParams }: CollectionPageProps) {
-  const slug = params.slug; 
-  const pageParam = searchParams?.page; 
-  const sortByParam = searchParams?.sortBy;
-
-  const serverApi = await createServerActionClient();
-  
-  // const currentPage = parseInt(pageParam || "1"); // Not used in current API call
-  const limit = 12; 
-
-  let productsData;
-  let collectionName = slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
-  let collectionDescription = `Browse through the finest items in our ${collectionName} selection.`;
-
-  // Placeholder: If you have a `serverApi.collections.getBySlug` procedure, you could use it here.
-  // try {
-  //   const collectionDetails = await serverApi.collections.getBySlug({ slug }); 
-  //   if (!collectionDetails) notFound();
-  //   collectionName = collectionDetails.name;
-  //   collectionDescription = collectionDetails.description || collectionDescription;
-  // } catch (error) {
-  //   console.error(`Error fetching collection details for ${slug}:`, error);
-  //   // Handle error, potentially call notFound()
-  // }
-
-  try {
-    productsData = await serverApi.products.getAll({
-      collectionSlug: slug,
-      limit,
-      sortBy: sortByParam as any,
-    });
-  } catch (error) {
-    console.error(`Error fetching products for collection ${slug}:`, error);
-    productsData = { items: [], nextCursor: undefined }; 
-  }
-
-  return (
-    <div className="container mx-auto px-4 py-8 md:py-12">
-      <div className="mb-8 md:mb-10 text-center">
-        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
-          {collectionName}
-        </h1>
-        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
-          {collectionDescription}
-        </p>
-      </div>
-      
-      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
-        <aside className="lg:col-span-1 lg:sticky lg:top-24 self-start">
-            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
-                <h2 className="text-xl font-semibold text-foreground mb-4">Refine This Collection</h2>
-                <p className="text-sm text-muted-foreground">(Filters specific to this collection - Placeholder)</p>
-                 <ul className="space-y-1.5 text-sm mt-4">
-                    <li><Link href={`/collections/${slug}?sortBy=createdAt_desc`} className="text-muted-foreground hover:text-primary transition-colors">Newest</Link></li>
-                    <li><Link href={`/collections/${slug}?sortBy=price_asc`} className="text-muted-foreground hover:text-primary transition-colors">Price: Low to High</Link></li>
-                    <li><Link href={`/collections/${slug}?sortBy=price_desc`} className="text-muted-foreground hover:text-primary transition-colors">Price: High to Low</Link></li>
-                </ul>
-            </div>
-        </aside>
-        <main className="lg:col-span-3">
-            {productsData.items.length > 0 ? (
-                <ProductGrid products={productsData.items} />
-            ) : (
-                <div className="py-16 text-center">
-                <p className="text-xl text-muted-foreground">
-                    No products currently in this collection. Check back soon!
-                </p>
-                </div>
-            )}
-            {/* TODO: Add Pagination controls here */}
-        </main>
-      </div>
-    </div>
-  );
-}
+// src/app/collections/[slug]/page.tsx
+import { type Metadata } from "next";
+import { notFound } from "next/navigation";
+import Link from "next/link";
+import { ProductGrid } from "~/components/products/ProductGrid";
+import { createServerActionClient } from "~/trpc/server";
+import { env } from "~/env.js";
+
+interface CollectionPageProps {
+  params: { slug: string };
+  searchParams?: { 
+    page?: string;
+    sortBy?: string;
+  };
+}
+
+export async function generateMetadata(props: CollectionPageProps): Promise<Metadata> {
+  // Await params before accessing its properties (Next.js 14+ dynamic API)
+  const params = await props.params;
+  const slug = params.slug; 
+  
+  const collectionNameFromSlug = slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
+  const title = `${collectionNameFromSlug} Collection - The Scent`;
+  const description = `Discover our exclusive ${collectionNameFromSlug} collection, featuring unique aromatherapy products.`;
+
+  return {
+    title,
+    description,
+    metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
+    openGraph: {
+      title,
+      description,
+      url: `${env.NEXT_PUBLIC_SITE_URL}/collections/${slug}`,
+    },
+  };
+}
+
+export default async function CollectionPage(props: CollectionPageProps) {
+  // Await params and searchParams before accessing their properties (Next.js 14+ dynamic API)
+  const params = await props.params;
+  const searchParams = await props.searchParams;
+  const slug = params.slug; 
+  const pageParam = searchParams?.page; 
+  const sortByParam = searchParams?.sortBy;
+
+  const serverApi = await createServerActionClient();
+  
+  // const currentPage = parseInt(pageParam || "1"); // Not used in current API call
+  const limit = 12; 
+
+  let productsData;
+  let collectionName = slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
+  let collectionDescription = `Browse through the finest items in our ${collectionName} selection.`;
+
+  // Placeholder: If you have a `serverApi.collections.getBySlug` procedure, you could use it here.
+  // try {
+  //   const collectionDetails = await serverApi.collections.getBySlug({ slug }); 
+  //   if (!collectionDetails) notFound();
+  //   collectionName = collectionDetails.name;
+  //   collectionDescription = collectionDetails.description || collectionDescription;
+  // } catch (error) {
+  //   console.error(`Error fetching collection details for ${slug}:`, error);
+  //   // Handle error, potentially call notFound()
+  // }
+
+  try {
+    productsData = await serverApi.products.getAll({
+      collectionSlug: slug,
+      limit,
+      sortBy: sortByParam as any,
+    });
+  } catch (error) {
+    console.error(`Error fetching products for collection ${slug}:`, error);
+    productsData = { items: [], nextCursor: undefined }; 
+  }
+
+  return (
+    <div className="container mx-auto px-4 py-8 md:py-12">
+      <div className="mb-8 md:mb-10 text-center">
+        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
+          {collectionName}
+        </h1>
+        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
+          {collectionDescription}
+        </p>
+      </div>
+      
+      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
+        <aside className="lg:col-span-1 lg:sticky lg:top-24 self-start">
+            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
+                <h2 className="text-xl font-semibold text-foreground mb-4">Refine This Collection</h2>
+                <p className="text-sm text-muted-foreground">(Filters specific to this collection - Placeholder)</p>
+                 <ul className="space-y-1.5 text-sm mt-4">
+                    <li><Link href={`/collections/${slug}?sortBy=createdAt_desc`} className="text-muted-foreground hover:text-primary transition-colors">Newest</Link></li>
+                    <li><Link href={`/collections/${slug}?sortBy=price_asc`} className="text-muted-foreground hover:text-primary transition-colors">Price: Low to High</Link></li>
+                    <li><Link href={`/collections/${slug}?sortBy=price_desc`} className="text-muted-foreground hover:text-primary transition-colors">Price: High to Low</Link></li>
+                </ul>
+            </div>
+        </aside>
+        <main className="lg:col-span-3">
+            {productsData.items.length > 0 ? (
+                <ProductGrid products={productsData.items} />
+            ) : (
+                <div className="py-16 text-center">
+                <p className="text-xl text-muted-foreground">
+                    No products currently in this collection. Check back soon!
+                </p>
+                </div>
+            )}
+            {/* TODO: Add Pagination controls here */}
+        </main>
+      </div>
+    </div>
+  );
+}
\ No newline at end of file

$ diff -u src/app/products/page.tsx-orig src/app/products/page.tsx-fixed
--- src/app/products/page.tsx-orig      2025-05-22 07:00:02.460944924 +0800
+++ src/app/products/page.tsx-fixed   2025-05-22 06:30:54.856707114 +0800
@@ -1,97 +1,57 @@
-// src/app/products/page.tsx
-import { type Metadata } from "next";
-import Link from "next/link";
-import { ProductGrid } from "~/components/products/ProductGrid";
-import { createServerActionClient } from "~/trpc/server";
-
-export const metadata: Metadata = {
-  title: "All Products - The Scent",
-  description: "Browse our entire collection of premium aromatherapy and wellness products.",
-};
-
-interface ProductsPageProps {
-  searchParams?: {
-    page?: string;
-    sortBy?: string;
-    category?: string;
-  };
-}
-
-export default async function ProductsPage({ searchParams }: ProductsPageProps) {
-  const pageParam = searchParams?.page;
-  const sortByParam = searchParams?.sortBy;
-  const categoryParam = searchParams?.category;
-
-  // currentPage is not directly used in the `getAll` call yet, but parsed for potential future use.
-  // const currentPage = parseInt(pageParam || "1"); 
-  const limit = 12; 
-
-  const serverApi = await createServerActionClient();
-
-  let productsData;
-  try {
-    productsData = await serverApi.products.getAll({
-      limit,
-      // cursor: If implementing cursor pagination, this would be derived from pageParam or another cursor value.
-      categoryId: categoryParam,
-      sortBy: sortByParam as any, // Cast if your tRPC router's sortBy enum is specific and different from string.
-    });
-  } catch (error) {
-    console.error("Error fetching products for ProductsPage:", error);
-    productsData = { items: [], nextCursor: undefined };
-  }
-
-  return (
-    <div className="container mx-auto px-4 py-8 md:py-12">
-      <div className="mb-8 md:mb-10 text-center">
-        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl font-head">Our Collection</h1>
-        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto font-body">
-          Explore a wide range of natural products designed for your well-being and sensory delight.
-        </p>
-      </div>
-
-      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
-        <aside className="lg:col-span-1 lg:sticky lg:top-24 self-start">
-          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
-            <h2 className="text-xl font-semibold text-foreground font-head mb-4">Filter & Sort</h2>
-            <div className="space-y-6">
-              <div>
-                <h3 className="text-sm font-medium text-foreground mb-2 font-accent uppercase tracking-wider">Categories</h3>
-                <ul className="space-y-1.5 text-sm">
-                    <li><Link href={`/products?category=essential-oils${sortByParam ? `&sortBy=${sortByParam}` : ''}`} className="text-muted-foreground hover:text-primary transition-colors">Essential Oils</Link></li>
-                    <li><Link href={`/products?category=diffusers${sortByParam ? `&sortBy=${sortByParam}` : ''}`} className="text-muted-foreground hover:text-primary transition-colors">Diffusers</Link></li>
-                    <li><Link href={`/products?category=candles${sortByParam ? `&sortBy=${sortByParam}` : ''}`} className="text-muted-foreground hover:text-primary transition-colors">Candles</Link></li>
-                    <li><Link href={`/products?category=blends${sortByParam ? `&sortBy=${sortByParam}` : ''}`} className="text-muted-foreground hover:text-primary transition-colors">Signature Blends</Link></li>
-                    <li><Link href={`/products${sortByParam ? `?sortBy=${sortByParam}` : ''}`} className="text-muted-foreground hover:text-primary transition-colors font-semibold">All Categories</Link></li>
-                </ul>
-              </div>
-              <div>
-                <h3 className="text-sm font-medium text-foreground mb-2 font-accent uppercase tracking-wider">Sort By</h3>
-                <ul className="space-y-1.5 text-sm">
-                    <li><Link href={`/products?sortBy=createdAt_desc${categoryParam ? `&category=${categoryParam}` : ''}`} className="text-muted-foreground hover:text-primary transition-colors">Newest</Link></li>
-                    <li><Link href={`/products?sortBy=price_asc${categoryParam ? `&category=${categoryParam}` : ''}`} className="text-muted-foreground hover:text-primary transition-colors">Price: Low to High</Link></li>
-                    <li><Link href={`/products?sortBy=price_desc${categoryParam ? `&category=${categoryParam}` : ''}`} className="text-muted-foreground hover:text-primary transition-colors">Price: High to Low</Link></li>
-                    <li><Link href={`/products?sortBy=rating_desc${categoryParam ? `&category=${categoryParam}` : ''}`} className="text-muted-foreground hover:text-primary transition-colors">Rating</Link></li>
-                    <li><Link href={`/products${categoryParam ? `?category=${categoryParam}` : ''}`} className="text-muted-foreground hover:text-primary transition-colors font-semibold">Default</Link></li>
-                </ul>
-              </div>
-            </div>
-          </div>
-        </aside>
-
-        <main className="lg:col-span-3">
-          {productsData.items.length > 0 ? (
-            <ProductGrid products={productsData.items} />
-          ) : (
-            <div className="py-16 text-center">
-              <p className="text-xl text-muted-foreground">
-                No products found. Try adjusting your filters!
-              </p>
-            </div>
-          )}
-          {/* TODO: Implement full pagination based on productsData.nextCursor or total count */}
-        </main>
-      </div>
-    </div>
-  );
-}
+import { type Metadata } from "next";
+import Link from "next/link";
+import { ProductGrid } from "~/components/products/ProductGrid";
+import { createServerActionClient } from "~/trpc/server";
+
+export const metadata: Metadata = {
+  title: "All Products - The Scent",
+  description: "Browse our entire collection of premium aromatherapy and wellness products.",
+};
+
+interface ProductsPageProps {
+  searchParams?: {
+    page?: string;
+    sortBy?: string;
+    category?: string;
+  };
+}
+
+export default async function ProductsPage(props: ProductsPageProps) {
+  // Await searchParams before accessing its properties (Next.js 14+ dynamic API)
+  const searchParams = await props.searchParams;
+  const pageParam = searchParams?.page;
+  const sortByParam = searchParams?.sortBy;
+  const categoryParam = searchParams?.category;
+
+  // currentPage is not directly used in the `getAll` call yet, but parsed for potential future use.
+  // const currentPage = parseInt(pageParam || "1"); 
+  const limit = 12; 
+
+  const serverApi = await createServerActionClient();
+
+  let productsData;
+  try {
+    productsData = await serverApi.products.getAll({
+      limit,
+      // cursor: If implementing cursor pagination, this would be derived from pageParam or another cursor value.
+      categoryId: categoryParam,
+      sortBy: sortByParam as any, // Cast if your tRPC router's sortBy enum is specific and different from string.
+    });
+  } catch (error) {
+    console.error("Error fetching products for ProductsPage:", error);
+    productsData = { items: [], nextCursor: undefined };
+  }
+
+  return (
+    <div className="container mx-auto px-4 py-8 md:py-12">
+      <div className="mb-8 md:mb-10 text-center">
+        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl font-head">Our Collection</h1>
+        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto font-body">
+          Explore a wide range of natural products designed for your well-being and sensory delight.
+        </p>
+      </div>
+      <ProductGrid products={productsData.items} />
+      {/* Pagination and sorting controls would go here if implemented */}
+    </div>
+  );
+}
\ No newline at end of file

