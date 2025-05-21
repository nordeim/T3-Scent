// src/app/products/page.tsx
import { type Metadata } from "next";
import Link from "next/link";
import { ProductGrid } from "~/components/products/ProductGrid";
import { createServerActionClient } from "~/trpc/server";

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

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const pageParam = searchParams?.page;
  const sortByParam = searchParams?.sortBy;
  const categoryParam = searchParams?.category;

  // currentPage is not directly used in the `getAll` call yet, but parsed for potential future use.
  // const currentPage = parseInt(pageParam || "1"); 
  const limit = 12; 

  const serverApi = await createServerActionClient();

  let productsData;
  try {
    productsData = await serverApi.products.getAll({
      limit,
      // cursor: If implementing cursor pagination, this would be derived from pageParam or another cursor value.
      categoryId: categoryParam,
      sortBy: sortByParam as any, // Cast if your tRPC router's sortBy enum is specific and different from string.
    });
  } catch (error) {
    console.error("Error fetching products for ProductsPage:", error);
    productsData = { items: [], nextCursor: undefined };
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