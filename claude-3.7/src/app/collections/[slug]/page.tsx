// src/app/collections/[slug]/page.tsx
import { type Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductGrid } from "~/components/products/ProductGrid";
import { createServerActionClient } from "~/trpc/server";
import { env } from "~/env.js";
import { Button } from "~/components/ui/Button";

interface CollectionPageProps {
  params: { slug: string };
  searchParams?: { 
    page?: string;
    sortBy?: string;
  };
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  // Access params at the beginning
  const slug = params.slug; 
  
  const serverApi = await createServerActionClient(); // Create client after accessing params

  // Placeholder: Fetch actual collection details for metadata
  // const collectionDetails = await serverApi.collections.getBySlug({ slug }); // Corrected: No .query()
  // if (!collectionDetails) {
  //   return { title: "Collection Not Found" };
  // }
  // const title = `${collectionDetails.name} Collection - The Scent`;
  // const description = collectionDetails.description || `Explore products from our ${collectionDetails.name} collection.`;
  
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
      // images: [collectionDetails?.imageUrl || '/images/og-default.jpg'],
    },
  };
}

export default async function CollectionPage({ params, searchParams }: CollectionPageProps) {
  // Access params and searchParams at the beginning
  const slug = params.slug; 
  const pageParam = searchParams?.page; 
  const sortByParam = searchParams?.sortBy;

  const serverApi = await createServerActionClient(); // Create client after accessing props
  
  const currentPage = parseInt(pageParam || "1");
  const limit = 12; 

  let productsData;
  let collectionName = slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  let collectionDescription = `Browse through the finest items in our ${collectionName} selection.`;

  // Placeholder for fetching collection details
  // try {
  //   const collectionDetails = await serverApi.collections.getBySlug({ slug }); // Corrected: No .query()
  //   if (!collectionDetails) notFound();
  //   collectionName = collectionDetails.name;
  //   collectionDescription = collectionDetails.description || collectionDescription;
  // } catch (error) {
  //   console.error(`Error fetching collection details for ${slug}:`, error);
  // }

  try {
    // CORRECTED: Removed .query()
    productsData = await serverApi.products.getAll({
      collectionSlug: slug,
      limit,
      // sortBy: sortByParam as any,
    });
  } catch (error) {
    console.error(`Error fetching products for collection ${slug}:`, error);
    if (error instanceof Error && 'shape' in error && (error as any).shape?.data?.code === 'NOT_FOUND') {
        console.warn(`No procedure found for products.getAll with collectionSlug ${slug}. Ensure router is correct.`);
    } else if (error instanceof Error && 'shape' in error) { 
        console.error("TRPC Error Shape:", (error as any).shape);
    }
    productsData = { items: [], nextCursor: undefined }; 
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
                <p className="text-sm text-muted-foreground">(Filters specific to this collection - Placeholder)</p>
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
            {/* TODO: Add Pagination controls here */}
        </main>
      </div>
    </div>
  );
}