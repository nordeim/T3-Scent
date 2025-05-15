// src/app/products/[slug]/page.tsx
import { type Metadata } from "next";
import Head from "next/head"; // Can still be used for dynamic updates in client components if needed
import Image from "next/image";
import Link from "next/link";

import { db } from "~/server/db"; // Direct DB access for server component data fetching
import { api as serverApi } from "~/trpc/server"; // Server-side tRPC caller
import ProductClientInteractions from "./ProductClientInteractions"; // New client component
import { ProductReviews } from "~/components/products/ProductReviews"; // Assumed to handle its own data or be client
import { RecommendedProducts } from "~/components/products/RecommendedProducts"; // Assumed to handle its own data or be client
import { ARVisualization } from "~/components/products/ARVisualization"; // This is likely a client component
import { Breadcrumbs } from "~/components/ui/Breadcrumbs"; // Placeholder UI component
import { notFound } from "next/navigation"; // For 404 in App Router
import { env } from "~/env.mjs";
import { type ProductWithRelations } from "~/types/product"; // Define this type centrally


// Define the expected params structure
interface ProductDetailPageProps {
  params: { slug: string };
}

// generateMetadata for SEO (App Router convention)
export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  try {
    const product = await db.product.findUnique({
      where: { slug: params.slug, publishedAt: { not: null, lte: new Date() } },
      select: {
        name: true,
        description: true,
        metaTitle: true,
        metaDescription: true,
        images: { select: { url: true, altText: true }, take: 1, orderBy: { position: "asc" } },
      },
    });

    if (!product) {
      return {
        title: "Product Not Found",
        description: "The product you are looking for does not exist or is not available.",
      };
    }

    const title = product.metaTitle || product.name;
    const description = product.metaDescription || product.description.substring(0, 160);
    const imageUrl = product.images[0]?.url 
        ? (product.images[0].url.startsWith('http') ? product.images[0].url : `${env.NEXT_PUBLIC_SITE_URL}${product.images[0].url}`)
        : `${env.NEXT_PUBLIC_SITE_URL}/images/og-image.jpg`;


    return {
      title: title,
      description: description,
      openGraph: {
        title: title,
        description: description,
        type: "product",
        url: `${env.NEXT_PUBLIC_SITE_URL}/products/${params.slug}`,
        images: [{ url: imageUrl, alt: product.images[0]?.altText || title }],
        // OpenGraph product specific fields can be added here
      },
      twitter: {
        card: "summary_large_image",
        title: title,
        description: description,
        images: [imageUrl],
      },
    };
  } catch (error) {
    console.error("Error generating metadata for product:", params.slug, error);
    return {
      title: "Error",
      description: "Could not load product information.",
    };
  }
}

// Server Component to fetch initial product data
export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = params;

  // Fetch product data server-side
  const productData = await db.product.findUnique({
    where: { slug: slug, publishedAt: { not: null, lte: new Date() } },
    include: {
      images: { orderBy: { position: 'asc' } },
      variants: { orderBy: [{ isDefault: 'desc' }, { name: 'asc' }] },
      categories: { select: { id: true, name: true, slug: true } }, // Select only needed fields
      tags: { select: { id: true, name: true, slug: true } },
      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 5, // Initial load, more can be fetched client-side
        include: { user: { select: { id: true, name: true, image: true } } },
      },
    },
  });

  if (!productData) {
    notFound(); // Triggers the not-found.tsx page in App Router
  }

  // Process data for client (convert Decimals, Dates)
  const totalRating = productData.reviews.reduce((sum, review) => sum + review.rating, 0);
  const reviewCount = productData.reviews.length;
  const avgRating = reviewCount > 0 ? totalRating / reviewCount : 0;

  const product: ProductWithRelations = {
    ...productData,
    price: parseFloat(productData.price.toString()),
    compareAtPrice: productData.compareAtPrice ? parseFloat(productData.compareAtPrice.toString()) : null,
    costPrice: productData.costPrice ? parseFloat(productData.costPrice.toString()) : null, // Not used directly on page but good to have
    createdAt: productData.createdAt.toISOString(),
    updatedAt: productData.updatedAt.toISOString(),
    publishedAt: productData.publishedAt?.toISOString() || null,
    saleEndDate: productData.saleEndDate?.toISOString() || null,
    variants: productData.variants.map(v => ({
      ...v,
      price: v.price ? parseFloat(v.price.toString()) : null,
      stockQuantity: v.stockQuantity ?? 0,
    })),
    reviews: productData.reviews.map(r => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
    avgRating,
    reviewCount,
  };

  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: "Products", href: "/products" },
    ...(product.categories[0] ? [{ name: product.categories[0].name, href: `/categories/${product.categories[0].slug}` }] : []),
    { name: product.name, href: `/products/${product.slug}`, isCurrent: true },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs items={breadcrumbItems} />
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 mt-6">
        {/* ProductClientInteractions will handle gallery, variant selection, add to cart etc. */}
        <ProductClientInteractions product={product} />
      </div>
      
      {/* AR Visualization - needs to be a Client Component */}
      {product.modelUrl && (
        <div className="my-12 rounded-lg border border-border bg-card p-4 md:p-6 shadow-sm">
           <h2 className="text-xl font-semibold text-foreground mb-4">Visualize in Your Space</h2>
          <ARVisualization
            productId={product.id}
            productName={product.name}
            modelUrl={product.modelUrl}
            previewImageUrl={product.images[0]?.url}
            productSize={product.dimensions as {width:number, height:number, depth:number} | undefined}
          />
        </div>
      )}
      
      {/* Reviews Section - ProductReviews component will handle fetching more reviews if needed */}
      <div id="reviews" className="mt-16">
        <h2 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">
          Customer Reviews
        </h2>
        <ProductReviews 
          productId={product.id} 
          productName={product.name} 
          initialReviews={product.reviews} 
          avgRating={product.avgRating} 
          reviewCount={product.reviewCount}
        />
      </div>
      
      {/* Recommended Products - RecommendedProducts component handles its own data fetching */}
      <div className="mt-16">
        <h2 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">
          You May Also Like
        </h2>
        <RecommendedProducts 
          productId={product.id} 
          categoryIds={product.categories.map(c => c.id)}
        />
      </div>
    </div>
  );
}