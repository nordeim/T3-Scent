// src/app/products/page.tsx
import { type Metadata } from "next";
import Link from "next/link";
import { ProductGrid } from "~/components/products/ProductGrid";
import { createServerActionClient } from "~/trpc/server";
import { Button } from "~/components/ui/Button";

export const metadata: Metadata = {
  title: "All Products - The Scent",
  description: "Browse our entire collection of premium aromatherapy and wellness products.",
};

interface ProductsPageProps {
  searchParams?: {
    page?: string;
    sortBy?: string;
    category?: string;
  };
}

export default async function ProductsPage({ params, searchParams }: ProductsPageProps) {
  // Access props at the beginning
  const pageParam = searchParams?.page;
  const sortByParam = searchParams?.sortBy;
  const categoryParam = searchParams?.category;

  const serverApi = await createServerActionClient(); // Then other async operations
  const currentPage = parseInt(pageParam || "1");
  const limit = 12; 

  // Now, perform async operations like creating the tRPC client
  const serverApi = await createServerActionClient();

  let productsData;
  try {
    // Use the accessed params for the query
    productsData = await serverApi.products.getAll({ // Correct: no .query()
      limit,
      // categoryId: categoryParam, // Uncomment and implement when category filtering is ready in backend
      // sortBy: sortByParam as any, // Uncomment and implement with proper type validation
    });
  } catch (error) {
    console.error("Error fetching products for ProductsPage:", error);
    if (error instanceof Error && 'shape' in error && (error as any).shape?.data?.code === 'NOT_FOUND') {
        // Handle expected "No procedure found" more gracefully if it's about a sub-procedure or path
        console.warn("A specific sub-procedure might be missing for products.getAll filters or includes.");
    } else if (error instanceof Error && 'shape' in error) { 
        console.error("TRPC Error Shape:", (error as any).shape);
    }
    productsData = { items: [], nextCursor: undefined };
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
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-foreground mb-1">Categories</h3>
                <ul className="space-y-1 text-sm">
                    <li><Link href={`/products?category=essential-oils${sortByParam ? `&sortBy=${sortByParam}` : ''}`} className="text-muted-foreground hover:text-primary">Essential Oils</Link></li>
                    <li><Link href={`/products?category=diffusers${sortByParam ? `&sortBy=${sortByParam}` : ''}`} className="text-muted-foreground hover:text-primary">Diffusers</Link></li>
                    <li><Link href={`/products?category=candles${sortByParam ? `&sortBy=${sortByParam}` : ''}`} className="text-muted-foreground hover:text-primary">Candles</Link></li>
                    <li><Link href={`/products?category=blends${sortByParam ? `&sortBy=${sortByParam}` : ''}`} className="text-muted-foreground hover:text-primary">Signature Blends</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground mb-1">Sort By</h3>
                <ul className="space-y-1 text-sm">
                    <li><Link href={`/products?sortBy=createdAt_desc${categoryParam ? `&category=${categoryParam}` : ''}`} className="text-muted-foreground hover:text-primary">Newest</Link></li>
                    <li><Link href={`/products?sortBy=price_asc${categoryParam ? `&category=${categoryParam}` : ''}`} className="text-muted-foreground hover:text-primary">Price: Low to High</Link></li>
                    <li><Link href={`/products?sortBy=price_desc${categoryParam ? `&category=${categoryParam}` : ''}`} className="text-muted-foreground hover:text-primary">Price: High to Low</Link></li>
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
          {/* TODO: Implement full pagination */}
        </main>
      </div>
    </div>
  );
}
