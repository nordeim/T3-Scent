// src/components/products/ProductGrid.tsx
import React from 'react';
import { ProductCard } from '~/components/common/ProductCard'; // Assuming ProductCard component
import type { RouterOutputs } from '~/utils/api'; // For product type

// Use a more specific type for products, e.g., from your tRPC output or a custom type
type Product = RouterOutputs["products"]["getAll"]["items"][number]; // Example type

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean; // Optional loading state for skeleton loaders
  itemsPerPage?: number; // For skeleton placeholders
}

export const ProductGrid = ({ products, isLoading, itemsPerPage = 4 }: ProductGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
        {Array.from({ length: itemsPerPage }).map((_, index) => (
          <div key={index} className="group animate-pulse">
            <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg bg-muted xl:aspect-h-8 xl:aspect-w-7"></div>
            <div className="mt-4 h-4 w-3/4 rounded bg-muted"></div>
            <div className="mt-1 h-6 w-1/2 rounded bg-muted"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return <p className="text-center text-muted-foreground">No products found.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};