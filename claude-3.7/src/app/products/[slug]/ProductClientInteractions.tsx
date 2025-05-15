// src/app/products/[slug]/ProductClientInteractions.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation"; // Use next/navigation for App Router
import Image from "next/image";
import { useCart } from "~/contexts/CartContext";
import { useWishlist } from "~/contexts/WishlistContext";
import { Button } from "~/components/ui/Button";
import { ProductGallery } from "~/components/products/ProductGallery";
import { Rating } from "~/components/ui/Rating";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/Tabs";
import { Label } from "~/components/ui/Label";
import { 
  FaHeart, FaRegHeart, FaShoppingCart, FaTruck, FaLeaf, FaRecycle, FaRegClock, FaInfoCircle, FaCheck, FaTimes
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { formatCurrency } from "~/utils/format";
import type { ProductWithRelations, ProcessedProductVariant } from "~/types/product"; // Assuming these types are defined

interface ProductClientInteractionsProps {
  product: ProductWithRelations;
}

export default function ProductClientInteractions({ product }: ProductClientInteractionsProps) {
  const router = useRouter();
  const { addItem: addItemToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [selectedVariant, setSelectedVariant] = useState<ProcessedProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [saleRemainingTime, setSaleRemainingTime] = useState<string | null>(null);

  useEffect(() => {
    if (product.variants && product.variants.length > 0) {
      const defaultVariant = product.variants.find(v => v.isDefault) || product.variants[0];
      setSelectedVariant(defaultVariant ?? null);
    } else {
        setSelectedVariant(null);
    }
  }, [product.variants]);

  useEffect(() => {
    if (!product.onSale || !product.saleEndDate) {
      setSaleRemainingTime(null);
      return;
    }
    const saleEndDateObj = new Date(product.saleEndDate);
    if (isNaN(saleEndDateObj.getTime())) {
        setSaleRemainingTime(null);
        return;
    }
    const intervalId = setInterval(() => {
      const now = new Date();
      const diffMs = saleEndDateObj.getTime() - now.getTime();
      if (diffMs <= 0) {
        setSaleRemainingTime("Sale ended");
        clearInterval(intervalId);
        return;
      }
      const d = Math.floor(diffMs/(1000*60*60*24));
      const h = Math.floor((diffMs/(1000*60*60)) % 24);
      const m = Math.floor((diffMs/1000/60) % 60);
      const s = Math.floor((diffMs/1000) % 60);
      setSaleRemainingTime(`${d}d ${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [product.onSale, product.saleEndDate]);

  const currentPrice = useMemo(() => {
    return selectedVariant?.price ?? product.price;
  }, [selectedVariant, product.price]);

  const originalPrice = useMemo(() => {
    return product.compareAtPrice;
  }, [product.compareAtPrice]);

  const discountPercentage = useMemo(() => {
    if (originalPrice && currentPrice < originalPrice) {
      return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    }
    return 0;
  }, [originalPrice, currentPrice]);

  const isInStock = useMemo(() => {
    if (selectedVariant) {
      return selectedVariant.stockQuantity === null || selectedVariant.stockQuantity > 0;
    }
    return product.inStock && (product.stockQuantity === null || product.stockQuantity > 0);
  }, [product.inStock, product.stockQuantity, selectedVariant]);

  const handleAddToCart = () => {
    if (!isInStock) {
      toast.error("This product is currently out of stock.");
      return;
    }
    addItemToCart({
      id: product.id,
      variantId: selectedVariant?.id,
      name: product.name + (selectedVariant ? ` - ${selectedVariant.name}` : ""),
      price: currentPrice,
      imageUrl: selectedVariant?.imageUrl ?? product.images[0]?.url ?? "",
      quantity: quantity,
      slug: product.slug,
      variantName: selectedVariant?.name,
    });
  };

  const handleToggleWishlist = () => {
     const wishlistItem = {
        id: product.id,
        variantId: selectedVariant?.id,
        name: product.name + (selectedVariant ? ` - ${selectedVariant.name}` : ""),
        price: currentPrice,
        imageUrl: selectedVariant?.imageUrl ?? product.images[0]?.url ?? "",
        slug: product.slug,
    };
    if (isInWishlist(product.id, selectedVariant?.id)) {
      removeFromWishlist(product.id, selectedVariant?.id);
      toast.success(`${wishlistItem.name} removed from wishlist`);
    } else {
      addToWishlist(wishlistItem);
      toast.success(`${wishlistItem.name} added to wishlist`);
    }
  };

  return (
    <>
      {/* Product Gallery */}
      <div className="lg:sticky lg:top-24 self-start">
        <ProductGallery 
          images={product.images} 
          productName={product.name} 
          activeIndex={activeImageIndex}
          setActiveIndex={setActiveImageIndex}
          currentVariantImageUrl={selectedVariant?.imageUrl}
        />
      </div>
      
      {/* Product Details */}
      <div className="flex flex-col">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          {product.name}
        </h1>
        
        <div className="mb-4 flex items-center">
          <Rating value={product.avgRating} readOnly size="md" />
          <a href="#reviews" className="ml-3 text-sm font-medium text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary">
            {product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'}
          </a>
        </div>
        
        <div className="mb-6 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(currentPrice)}
          </span>
          {originalPrice && originalPrice > currentPrice && (
            <span className="text-xl text-gray-500 line-through dark:text-gray-400">
              {formatCurrency(originalPrice)}
            </span>
          )}
          {discountPercentage > 0 && (
            <span className="rounded-md bg-red-100 px-2 py-1 text-sm font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
              SAVE {discountPercentage}%
            </span>
          )}
        </div>
        
        {product.onSale && saleRemainingTime && saleRemainingTime !== "Sale ended" && (
          <div className="mb-4 flex items-center rounded-md bg-amber-100 p-3 dark:bg-amber-900/30">
            <FaRegClock className="mr-2 h-5 w-5 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Sale ends in: {saleRemainingTime}
            </span>
          </div>
        )}
        {product.onSale && saleRemainingTime === "Sale ended" && (
          <div className="mb-4 rounded-md bg-gray-100 p-3 text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            Sale has ended.
          </div>
        )}

        <div className="mb-6 prose prose-sm max-w-none text-gray-700 dark:prose-invert dark:text-gray-300">
          <p>{product.description.split('\n\n')[0]}</p>
        </div>
        
        {product.variants.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Options: {selectedVariant?.name || "Select an option"}
            </h3>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((variant) => (
                <Button
                  key={variant.id}
                  variant={selectedVariant?.id === variant.id ? "default" : "outline"}
                  onClick={() => setSelectedVariant(variant)}
                  disabled={(variant.stockQuantity ?? 0) <= 0}
                  className={`relative transition-all ${ (variant.stockQuantity ?? 0) <= 0 ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  {variant.name}
                  {(variant.stockQuantity ?? 0) <= 0 && (
                    <span className="absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900"></span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        <div className="mb-6 text-sm">
            {isInStock ? (
                <span className="inline-flex items-center gap-1 font-medium text-green-600 dark:text-green-400">
                    <FaCheck /> In Stock {selectedVariant && selectedVariant.stockQuantity !== null ? `(${selectedVariant.stockQuantity} left)` : product.stockQuantity !== null ? `(${product.stockQuantity} left)` : ''}
                </span>
            ) : (
                <span className="inline-flex items-center gap-1 font-medium text-red-600 dark:text-red-400">
                    <FaTimes /> Out of Stock
                </span>
            )}
             {product.sku && <span className="ml-4 text-gray-500 dark:text-gray-400">SKU: {selectedVariant?.sku || product.sku}</span>}
        </div>

        <div className="mb-6">
          <Label htmlFor="quantity-pdp" className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Quantity
          </Label>
          <div className="flex h-10 w-32 items-center rounded-md border border-border">
            <Button variant="ghost" size="icon" className="h-full rounded-r-none" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>-</Button>
            <input
              id="quantity-pdp"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="h-full w-full border-0 bg-transparent text-center text-foreground focus:outline-none focus:ring-0"
            />
            <Button variant="ghost" size="icon" className="h-full rounded-l-none" onClick={() => setQuantity(quantity + 1)} disabled={!isInStock}>+</Button>
          </div>
        </div>
        
        <div className="mb-8 flex flex-col gap-4 sm:flex-row">
          <Button onClick={handleAddToCart} disabled={!isInStock} size="lg" className="flex-1 sm:flex-auto">
            <FaShoppingCart className="mr-2 h-5 w-5" />
            {isInStock ? 'Add to Cart' : 'Out of Stock'}
          </Button>
          <Button onClick={handleToggleWishlist} variant="outline" size="lg" className="flex-1 sm:flex-auto">
            {isInWishlist(product.id, selectedVariant?.id) ? (
              <FaHeart className="mr-2 h-5 w-5 text-red-500" />
            ) : (
              <FaRegHeart className="mr-2 h-5 w-5" />
            )}
            {isInWishlist(product.id, selectedVariant?.id) ? 'In Wishlist' : 'Add to Wishlist'}
          </Button>
        </div>
        
        <div className="mb-6">
          <Tabs defaultValue="description">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="shipping">Shipping & Returns</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="prose prose-sm dark:prose-invert mt-4 max-w-none">
              <div dangerouslySetInnerHTML={{ __html: product.description.replace(/\n/g, '<br />') }} />
            </TabsContent>
            <TabsContent value="details" className="mt-4 text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <p><FaLeaf className="mr-2 inline-block text-green-500" />100% Natural Essential Oils</p>
              <p><FaRecycle className="mr-2 inline-block text-blue-500" />Ethically Sourced Ingredients</p>
              {product.weight && <p>Weight: {product.weight}g</p>}
              {product.dimensions && <p>Dimensions: {(product.dimensions as any).length}x{(product.dimensions as any).width}x{(product.dimensions as any).height} cm</p>}
            </TabsContent>
            <TabsContent value="shipping" className="mt-4 text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <p><FaTruck className="mr-2 inline-block text-primary" />Standard shipping: 3-5 business days.</p>
              <p><FaInfoCircle className="mr-2 inline-block text-gray-500" />Free shipping on orders over $50.</p>
              <p>Easy 30-day returns.</p>
            </TabsContent>
          </Tabs>
        </div>
            
        {product.tags.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Scent Tags:
            </h3>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Button key={tag.id} variant="outline" size="sm" asChild>
                  <Link href={`/tags/${tag.slug}`}>{tag.name}</Link>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}