// src/components/common/ProductCard.tsx
"use client"; // If it uses client-side hooks for cart/wishlist interactions

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '~/components/ui/Button';
import { Rating } from '~/components/ui/Rating'; // Assuming Rating component
import { formatCurrency } from '~/utils/format';
import type { RouterOutputs } from '~/utils/api';
import { FaShoppingCart, FaHeart, FaRegHeart } from 'react-icons/fa';
import { useCart } from '~/contexts/CartContext';
import { useWishlist } from '~/contexts/WishlistContext';
import { toast } from 'react-hot-toast';

type Product = RouterOutputs["products"]["getAll"]["items"][number];

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem: addItemToCart, getItem: getCartItem } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation if button is inside Link
    addItemToCart({
      id: product.id,
      name: product.name,
      price: product.price, // Assuming price is already a number
      imageUrl: product.images?.[0]?.url ?? "/images/placeholder.png",
      slug: product.slug,
      quantity: 1,
    });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    const wishlistItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.images?.[0]?.url ?? "/images/placeholder.png",
        slug: product.slug,
    };
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      toast.success(`${product.name} removed from wishlist!`);
    } else {
      addToWishlist(wishlistItem);
      toast.success(`${product.name} added to wishlist!`);
    }
  };
  
  const cartItem = getCartItem(product.id); // Check if item is in cart

  return (
    <Link href={`/products/${product.slug}`} className="group block overflow-hidden rounded-lg border border-border shadow-sm transition-shadow hover:shadow-md dark:border-border/50">
      <div className="relative aspect-[3/4] w-full bg-muted">
        {product.images?.[0]?.url ? (
          <Image
            src={product.images[0].url}
            alt={product.images[0].altText || product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
            No Image
          </div>
        )}
        {product.onSale && product.compareAtPrice && (
          <div className="absolute top-2 left-2 rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white">
            SALE
          </div>
        )}
      </div>

      <div className="p-4">
        {product.categories?.[0] && (
            <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">{product.categories[0].name}</p>
        )}
        <h3 className="truncate text-base font-semibold text-foreground group-hover:text-primary">
          {product.name}
        </h3>
        
        {product.avgRating !== undefined && product.reviewCount !== undefined && product.reviewCount > 0 && (
          <div className="mt-1 flex items-center">
            <Rating value={product.avgRating} size="sm" readOnly />
            <span className="ml-1.5 text-xs text-muted-foreground">({product.reviewCount})</span>
          </div>
        )}

        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-lg font-bold text-foreground">{formatCurrency(product.price)}</p>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <p className="text-sm text-muted-foreground line-through">
              {formatCurrency(product.compareAtPrice)}
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
            <Button 
                variant={cartItem ? "secondary" : "default"}
                size="sm" 
                className="flex-1" 
                onClick={handleAddToCart}
                disabled={!product.inStock || (product.stockQuantity !== null && product.stockQuantity <=0 )}
            >
                <FaShoppingCart className="mr-1.5 h-4 w-4" />
                {product.inStock && (product.stockQuantity === null || product.stockQuantity > 0) ? (cartItem ? "In Cart" : "Add to Cart") : "Out of Stock"}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleToggleWishlist} aria-label="Toggle Wishlist">
                {isInWishlist(product.id) ? <FaHeart className="h-5 w-5 text-red-500" /> : <FaRegHeart className="h-5 w-5 text-muted-foreground" />}
            </Button>
        </div>
      </div>
    </Link>
  );
};