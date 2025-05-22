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

export default async function ProductsPage(props: ProductsPageProps) {
  // Await searchParams before accessing its properties (Next.js 14+ dynamic API)
  const searchParams = await props.searchParams;
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
      <ProductGrid products={productsData.items} />
      {/* Pagination and sorting controls would go here if implemented */}
    </div>
  );
}