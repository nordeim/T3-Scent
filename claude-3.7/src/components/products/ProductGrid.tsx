// src/components/products/ProductGrid.tsx
import React from 'react';
import { ProductCard } from '~/components/common/ProductCard'; 
import type { RouterOutputs } from '~/utils/api';

// Using the specific product type from the getAll procedure's output items
type ProductInGrid = RouterOutputs["products"]["getAll"]["items"][number];

interface ProductGridProps {
  products?: ProductInGrid[]; // Make products optional for loading/empty states
  isLoading?: boolean;
  skeletonsCount?: number; // How many skeletons to show
  className?: string;
  emptyStateMessage?: string;
}

export const ProductGrid = ({ 
  products, 
  isLoading = false, 
  skeletonsCount = 4, 
  className,
  emptyStateMessage = "No products found matching your criteria." 
}: ProductGridProps) => {
  
  const gridClasses = "grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8";

  if (isLoading) {
    return (
      <div className={cn(gridClasses, className)}>
        {Array.from({ length: skeletonsCount }).map((_, index) => (
          // Basic Skeleton for ProductCard
          <div key={`skeleton-${index}`} className="group animate-pulse">
            <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted"></div>
            <div className="mt-4 h-4 w-3/4 rounded bg-muted"></div>
            <div className="mt-2 h-6 w-1/2 rounded bg-muted"></div>
            <div className="mt-2 h-4 w-1/4 rounded bg-muted"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-muted-foreground">{emptyStateMessage}</p>
        {/* Optional: Add a CTA like "Browse all products" */}
      </div>
    );
  }

  return (
    <div className={cn(gridClasses, className)}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

// cn utility if not globally available for this component (usually from lib/utils)
function cn(...inputs: (string | undefined | null | boolean)[]) {
  return inputs.filter(Boolean).join(' ');
}