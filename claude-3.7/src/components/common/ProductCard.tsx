// src/components/common/ProductCard.tsx
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '~/components/ui/Button';
import { Rating } from '~/components/ui/Rating';
import { formatCurrency } from '~/utils/format';
import type { RouterOutputs } from '~/utils/api'; // For specific product type from router
import { FaShoppingCart, FaHeart, FaRegHeart, FaSpinner } from 'react-icons/fa';
import { useCart } from '~/contexts/CartContext';
import { useWishlist } from '~/contexts/WishlistContext';
import { toast } from 'react-hot-toast';
import { cn } from '~/lib/utils'; // For classnames
import { useState } from 'react';

// Use the specific item type from your products.getAll tRPC output
type Product = RouterOutputs["products"]["getAll"]["items"][number];

interface ProductCardProps {
  product: Product;
  className?: string;
}

export const ProductCard = ({ product, className }: ProductCardProps) => {
  const { addItem: addItemToCart, getItem: getCartItem } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist, isLoading: isWishlistLoading } = useWishlist();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);


  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.inStock || (product.stockQuantity !== null && product.stockQuantity <=0 )) {
        toast.error("This product is currently out of stock.");
        return;
    }
    setIsAddingToCart(true);
    // Simulate async operation for UX, or if addItemToCart becomes async
    await new Promise(resolve => setTimeout(resolve, 300)); 
    addItemToCart({
      id: product.id,
      name: product.name,
      price: product.price, 
      imageUrl: product.images?.[0]?.url ?? "/images/placeholder.png", // Fallback image
      slug: product.slug,
      quantity: 1,
      // variantId: undefined, // If this card is for base product only
    });
    setIsAddingToCart(false);
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsTogglingWishlist(true);
    const wishlistItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.images?.[0]?.url ?? "/images/placeholder.png",
        slug: product.slug,
    };

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 300));
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      // Toast is handled in context, or can be here: toast.success(`${product.name} removed from wishlist!`);
    } else {
      addToWishlist(wishlistItem);
      // toast.success(`${product.name} added to wishlist!`);
    }
    setIsTogglingWishlist(false);
  };
  
  const cartItem = getCartItem(product.id); 
  const productInWishlist = isInWishlist(product.id);

  const effectivePrice = product.price;
  const effectiveCompareAtPrice = product.compareAtPrice;

  return (
    <div className={cn("group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all hover:shadow-lg dark:border-border/20", className)}>
      <Link href={`/products/${product.slug}`} className="contents"> {/* Make link wrap content for better semantics */}
        <div className="relative aspect-[3/4] w-full bg-muted overflow-hidden">
          {product.images?.[0]?.url ? (
            <Image
              src={product.images[0].url}
              alt={product.images[0].altText || product.name}
              fill
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, (max-width: 1280px) 30vw, 23vw"
              className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
              priority={false} // Set to true for LCP images if applicable
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
              No Image
            </div>
          )}
          {product.onSale && effectiveCompareAtPrice && effectiveCompareAtPrice > effectivePrice && (
            <div className="absolute top-3 left-3 rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold text-white shadow">
              SALE
            </div>
          )}
          {/* Wishlist button positioned absolutely */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-card/70 p-0 text-muted-foreground backdrop-blur-sm hover:bg-card hover:text-primary disabled:opacity-50"
            onClick={handleToggleWishlist}
            disabled={isWishlistLoading || isTogglingWishlist}
            aria-label={productInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            {isTogglingWishlist ? <FaSpinner className="h-4 w-4 animate-spin" /> : 
                (productInWishlist ? <FaHeart className="h-4 w-4 text-red-500" /> : <FaRegHeart className="h-4 w-4" />)
            }
          </Button>
        </div>

        <div className="flex flex-1 flex-col p-4">
          {product.categories?.[0]?.name && (
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-primary">
                {product.categories[0].name}
              </p>
          )}
          <h3 className="flex-grow text-base font-semibold leading-tight text-foreground group-hover:text-primary">
            <span aria-hidden="true" className="absolute inset-0" /> {/* For clickable card area */}
            {product.name}
          </h3>
          
          {product.avgRating !== undefined && product.reviewCount !== undefined && product.reviewCount > 0 && (
            <div className="mt-1.5 flex items-center">
              <Rating value={product.avgRating} size="sm" readOnly />
              <span className="ml-1.5 text-xs text-muted-foreground">({product.reviewCount})</span>
            </div>
          )}

          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-lg font-bold text-foreground">{formatCurrency(effectivePrice)}</p>
            {effectiveCompareAtPrice && effectiveCompareAtPrice > effectivePrice && (
              <p className="text-sm text-muted-foreground line-through">
                {formatCurrency(effectiveCompareAtPrice)}
              </p>
            )}
          </div>
        </div>
      </Link> {/* End of Link wrapper */}
      
      {/* Add to Cart Button - outside of Link to prevent nested interactive elements if Link handles click */}
      <div className="mt-auto p-4 pt-0"> {/* Ensures button is at the bottom */}
        <Button 
            variant={cartItem ? "secondary" : "default"}
            size="sm" 
            className="w-full" 
            onClick={handleAddToCart} // This click is separate from the link navigation
            disabled={!product.inStock || (product.stockQuantity !== null && product.stockQuantity <=0 ) || isAddingToCart}
            aria-label={`Add ${product.name} to cart`}
        >
            {isAddingToCart ? <FaSpinner className="mr-1.5 h-4 w-4 animate-spin"/> : <FaShoppingCart className="mr-1.5 h-4 w-4" />}
            {product.inStock && (product.stockQuantity === null || product.stockQuantity > 0) ? (cartItem ? "Added to Cart" : "Add to Cart") : "Out of Stock"}
        </Button>
      </div>
    </div>
  );
};