// src/pages/products/[slug].tsx
import { type NextPage, type GetServerSideProps } from "next";
import Head from "next/head";
import Image from "next/image"; // Using next/image
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { api } from "~/utils/api";
import { db } from "~/server/db"; // For GSSP direct Prisma access
import { useCart } from "~/contexts/CartContext";
import { useWishlist } from "~/contexts/WishlistContext"; // Assuming this context exists
import { Button } from "~/components/ui/Button"; // Placeholder
import { ProductReviews } from "~/components/products/ProductReviews"; // Placeholder
import { ProductGallery } from "~/components/products/ProductGallery"; // Placeholder
import { RecommendedProducts } from "~/components/products/RecommendedProducts"; // Placeholder
import { Rating } from "~/components/ui/Rating"; // Placeholder
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/Tabs"; // Placeholder
import { 
  FaHeart, FaRegHeart, FaShoppingCart, FaTruck, FaLeaf, FaRecycle, FaRegClock, FaInfoCircle
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { formatCurrency } from "~/utils/format"; // Assuming this util exists
import type { Product as PrismaProduct, ProductVariant as PrismaProductVariant, ProductImage as PrismaProductImage, Category as PrismaCategory, Tag as PrismaTag, Review as PrismaReview, User as PrismaUser } from "@prisma/client";
import { NextSeo, ProductJsonLd } from 'next-seo';
import { env } from "~/env.mjs";

// Define a more specific type for the product prop after GSSP processing
interface ProcessedProductVariant extends Omit<PrismaProductVariant, 'price'> {
  price: number | null; // Price converted to number
}
interface ProcessedProductReviewUser extends Pick<PrismaUser, 'id' | 'name' | 'image'> {}
interface ProcessedProductReview extends Omit<PrismaReview, 'createdAt' | 'updatedAt' | 'user'> {
    createdAt: string;
    updatedAt: string;
    user: ProcessedProductReviewUser;
}

interface ProductWithRelations extends Omit<PrismaProduct, 'price' | 'compareAtPrice' | 'costPrice' | 'createdAt' | 'updatedAt' | 'publishedAt' | 'saleEndDate' | 'variants' | 'reviews'> {
  images: PrismaProductImage[];
  variants: ProcessedProductVariant[];
  categories: PrismaCategory[];
  tags: PrismaTag[];
  reviews: ProcessedProductReview[]; // For initial load
  avgRating: number;
  reviewCount: number;
  price: number; // Converted
  compareAtPrice: number | null; // Converted
  costPrice: number | null; // Converted
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  saleEndDate: string | null;
}

interface ProductDetailProps {
  product: ProductWithRelations | null; // Product can be null if not found
  error?: string;
}

export const getServerSideProps: GetServerSideProps<ProductDetailProps> = async (context) => {
  const slug = context.params?.slug as string;

  if (!slug) {
    return { notFound: true };
  }

  try {
    const productData = await db.product.findUnique({
      where: { slug, publishedAt: { not: null, lte: new Date() } }, // Ensure product is published
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: { orderBy: [{ isDefault: 'desc' }, { name: 'asc' }] },
        categories: true,
        tags: true,
        reviews: { // Fetch initial set of reviews
          orderBy: { createdAt: 'desc' },
          take: 5, // Example: load 5 most recent reviews initially
          include: { user: { select: { id: true, name: true, image: true } } },
        },
      },
    });

    if (!productData) {
      return { notFound: true };
    }

    const totalRating = productData.reviews.reduce((sum, review) => sum + review.rating, 0);
    const reviewCount = productData.reviews.length;
    const avgRating = reviewCount > 0 ? totalRating / reviewCount : 0;

    // Process data for serialization (convert Decimal to number, Date to string)
    const product: ProductWithRelations = {
      ...productData,
      price: parseFloat(productData.price.toString()),
      compareAtPrice: productData.compareAtPrice ? parseFloat(productData.compareAtPrice.toString()) : null,
      costPrice: productData.costPrice ? parseFloat(productData.costPrice.toString()) : null,
      createdAt: productData.createdAt.toISOString(),
      updatedAt: productData.updatedAt.toISOString(),
      publishedAt: productData.publishedAt?.toISOString() || null,
      saleEndDate: productData.saleEndDate?.toISOString() || null,
      variants: productData.variants.map(v => ({
        ...v,
        price: v.price ? parseFloat(v.price.toString()) : null,
      })),
      reviews: productData.reviews.map(r => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
      })),
      avgRating,
      reviewCount,
    };

    return { props: { product } };
  } catch (error) {
    console.error("Error fetching product in GSSP:", error);
    // You could return a specific error prop or redirect to an error page
    return { props: { product: null, error: "Failed to load product data." } };
  }
};


const ProductDetail: NextPage<ProductDetailProps> = ({ product, error }) => {
  const router = useRouter();
  const { addItem: addItemToCart } = useCart(); // Renamed for clarity
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [selectedVariant, setSelectedVariant] = useState<ProcessedProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0); // For ProductGallery
  const [saleRemainingTime, setSaleRemainingTime] = useState<string | null>(null);

  // Initialize selectedVariant
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      const defaultVariant = product.variants.find(v => v.isDefault) || product.variants[0];
      setSelectedVariant(defaultVariant ?? null);
    } else {
        setSelectedVariant(null);
    }
  }, [product]);

  // Sale countdown timer
  useEffect(() => {
    if (!product?.onSale || !product.saleEndDate) {
      setSaleRemainingTime(null);
      return;
    }
    
    const saleEndDateObj = new Date(product.saleEndDate);
    if (isNaN(saleEndDateObj.getTime())) { // Invalid date
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
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      setSaleRemainingTime(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [product?.onSale, product?.saleEndDate]);

  const currentPrice = useMemo(() => {
    return selectedVariant?.price ?? product?.price ?? 0;
  }, [selectedVariant, product?.price]);

  const originalPrice = useMemo(() => {
    // Use product's compareAtPrice as a fallback if variant doesn't specify one
    return product?.compareAtPrice ?? null;
  }, [product?.compareAtPrice]);

  const discountPercentage = useMemo(() => {
    if (originalPrice && currentPrice < originalPrice) {
      return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    }
    return 0;
  }, [originalPrice, currentPrice]);

  const isInStock = useMemo(() => {
    if (!product) return false;
    if (selectedVariant) {
      return selectedVariant.stockQuantity === null || selectedVariant.stockQuantity > 0;
    }
    return product.inStock && (product.stockQuantity === null || product.stockQuantity > 0);
  }, [product, selectedVariant]);


  if (router.isFallback) {
    return <div>Loading product details...</div>; // Or a proper skeleton loader
  }
  if (error) {
    return <div className="container mx-auto px-4 py-8 text-center text-red-600">{error}</div>;
  }
  if (!product) {
    return <div className="container mx-auto px-4 py-8 text-center">Product not found.</div>;
  }

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
      slug: product.slug, // For linking back to product from cart
      variantName: selectedVariant?.name,
    });
  };

  const handleToggleWishlist = () => {
    const wishlistItem = {
        id: product.id,
        variantId: selectedVariant?.id, // Wishlist might be for a specific variant
        name: product.name + (selectedVariant ? ` - ${selectedVariant.name}` : ""),
        price: currentPrice,
        imageUrl: selectedVariant?.imageUrl ?? product.images[0]?.url ?? "",
        slug: product.slug,
    };
    if (isInWishlist(product.id, selectedVariant?.id)) {
      removeFromWishlist(product.id, selectedVariant?.id);
      toast.success(`${wishlistItem.name} removed from wishlist!`);
    } else {
      addToWishlist(wishlistItem);
      toast.success(`${wishlistItem.name} added to wishlist!`);
    }
  };

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Products", href: "/products" },
    ...(product.categories[0] ? [{ name: product.categories[0].name, href: `/categories/${product.categories[0].slug}` }] : []),
    { name: product.name, href: `/products/${product.slug}` }, // Current page, not linked
  ];

  return (
    <>
      <NextSeo
        title={product.metaTitle || product.name}
        description={product.metaDescription || product.description.substring(0, 160)}
        canonical={`${env.NEXT_PUBLIC_SITE_URL}/products/${product.slug}`}
        openGraph={{
          title: product.metaTitle || product.name,
          description: product.metaDescription || product.description.substring(0, 160),
          url: `${env.NEXT_PUBLIC_SITE_URL}/products/${product.slug}`,
          type: 'product',
          product: {
            priceAmount: currentPrice.toString(),
            priceCurrency: 'USD', // TODO: Make dynamic from localization context
            // availability: isInStock ? 'instock' : 'outofstock', // Not directly supported this way, use Offers
            // brand: 'The Scent', // Add if you have a brand field
            // condition: 'new',
            // retailerItemId: product.sku,
          },
          images: product.images.map(img => ({
            url: img.url,
            width: img.width || 800,
            height: img.height || 600,
            alt: img.altText || product.name,
          })),
        }}
      />
      <ProductJsonLd
        productName={product.name}
        images={product.images.map(img => img.url)}
        description={product.description}
        sku={selectedVariant?.sku || product.sku || undefined}
        brand={{ name: "The Scent" }} // Add your brand name
        offers={[{
            price: currentPrice.toString(),
            priceCurrency: "USD", // TODO: Make dynamic
            itemCondition: "https://schema.org/NewCondition",
            availability: isInStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: `${env.NEXT_PUBLIC_SITE_URL}/products/${product.slug}`,
            seller: { name: "The Scent" },
        }]}
        aggregateRating={product.reviewCount > 0 ? {
            ratingValue: product.avgRating.toFixed(1),
            reviewCount: product.reviewCount,
        } : undefined}
        // Add more fields like mpn, gtin if available
      />
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol role="list" className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((breadcrumb, index) => (
              <li key={breadcrumb.name}>
                <div className="flex items-center">
                  {index > 0 && (
                    <svg className="mr-2 h-4 w-4 flex-shrink-0 text-gray-300" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                    </svg>
                  )}
                  <a 
                    href={index === breadcrumbs.length - 1 ? undefined : breadcrumb.href} 
                    className={index === breadcrumbs.length - 1 ? "font-medium text-gray-500 dark:text-gray-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"}
                    aria-current={index === breadcrumbs.length - 1 ? "page" : undefined}
                  >
                    {breadcrumb.name}
                  </a>
                </div>
              </li>
            ))}
          </ol>
        </nav>
        
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Product Gallery */}
          <div className="lg:sticky lg:top-24 self-start"> {/* Added self-start for sticky positioning */}
            <ProductGallery 
              images={product.images} 
              productName={product.name} 
              activeIndex={activeImageIndex}
              setActiveIndex={setActiveImageIndex}
              // Pass variant image to gallery if selected variant has one
              currentVariantImageUrl={selectedVariant?.imageUrl}
            />
          </div>
          
          {/* Product Details */}
          <div className="flex flex-col">
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              {product.name}
            </h1>
            
            {/* Rating and Reviews Link */}
            <div className="mb-4 flex items-center">
              <Rating value={product.avgRating} readOnly size="md" />
              <a href="#reviews" className="ml-3 text-sm font-medium text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary">
                {product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'}
              </a>
            </div>
            
            {/* Price */}
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
            
            {/* Sale Countdown */}
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

            {/* Short Description */}
            <div className="mb-6 prose prose-sm max-w-none text-gray-700 dark:prose-invert dark:text-gray-300">
              <p>{product.description.split('\n\n')[0]}</p> {/* Show first paragraph as short description */}
            </div>
            
            {/* Variants */}
            {product.variants.length > 0 && (
              <div className="mb-6">
                {/* Assuming variants are grouped by option types like "Size", "Scent" */}
                {/* This part needs a more complex rendering logic if options are multi-dimensional */}
                <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Options: {selectedVariant?.name || "Select an option"}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <Button
                      key={variant.id}
                      variant={selectedVariant?.id === variant.id ? "default" : "outline"}
                      onClick={() => setSelectedVariant(variant)}
                      disabled={variant.stockQuantity !== null && variant.stockQuantity <= 0}
                      className={`relative transition-all ${ (variant.stockQuantity !== null && variant.stockQuantity <= 0) ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                      {variant.name}
                      {(variant.stockQuantity !== null && variant.stockQuantity <= 0) && (
                        <span className="absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900"></span>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Stock Status */}
            <div className="mb-6 text-sm">
                {isInStock ? (
                    <span className="inline-flex items-center gap-1 font-medium text-green-600 dark:text-green-400">
                        <FaCheck /> In Stock
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 font-medium text-red-600 dark:text-red-400">
                        <FaTimes /> Out of Stock
                    </span>
                )}
                {product.sku && <span className="ml-4 text-gray-500 dark:text-gray-400">SKU: {selectedVariant?.sku || product.sku}</span>}
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <Label htmlFor="quantity" className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Quantity
              </Label>
              <div className="flex h-10 w-32 items-center rounded-md border border-border">
                <Button variant="ghost" size="icon" className="h-full rounded-r-none" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>-</Button>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-full w-full border-0 bg-transparent text-center text-foreground focus:outline-none focus:ring-0"
                  readOnly // Or make it editable with validation
                />
                <Button variant="ghost" size="icon" className="h-full rounded-l-none" onClick={() => setQuantity(quantity + 1)} disabled={!isInStock}>+</Button>
              </div>
            </div>
            
            {/* Add to Cart & Wishlist */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row">
              <Button
                onClick={handleAddToCart}
                disabled={!isInStock}
                size="lg"
                className="flex-1 sm:flex-auto"
              >
                <FaShoppingCart className="mr-2 h-5 w-5" />
                {isInStock ? 'Add to Cart' : 'Out of Stock'}
              </Button>
              <Button
                onClick={handleToggleWishlist}
                variant="outline"
                size="lg"
                className="flex-1 sm:flex-auto"
              >
                {isInWishlist(product.id, selectedVariant?.id) ? (
                  <FaHeart className="mr-2 h-5 w-5 text-red-500" />
                ) : (
                  <FaRegHeart className="mr-2 h-5 w-5" />
                )}
                {isInWishlist(product.id, selectedVariant?.id) ? 'In Wishlist' : 'Add to Wishlist'}
              </Button>
            </div>
            
            {/* Product Info Tabs */}
            <div className="mb-6">
              <Tabs defaultValue="description">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="ingredients">Details</TabsTrigger>
                  <TabsTrigger value="shipping">Shipping & Returns</TabsTrigger>
                </TabsList>
                <TabsContent value="description" className="prose prose-sm dark:prose-invert mt-4 max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: product.description.replace(/\n/g, '<br />') }} />
                </TabsContent>
                <TabsContent value="ingredients" className="mt-4 text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  {/* Example content, make this dynamic from product data */}
                  <p><FaLeaf className="mr-2 inline-block text-green-500" />100% Natural Essential Oils</p>
                  <p><FaRecycle className="mr-2 inline-block text-blue-500" />Ethically Sourced Ingredients</p>
                  {product.weight && <p>Weight: {product.weight}g</p>}
                  {product.dimensions && <p>Dimensions: {(product.dimensions as {length: number, width: number, height: number}).length}x{(product.dimensions as any).width}x{(product.dimensions as any).height} cm</p>}
                </TabsContent>
                <TabsContent value="shipping" className="mt-4 text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <p><FaTruck className="mr-2 inline-block text-primary" />Standard shipping: 3-5 business days.</p>
                  <p><FaInfoCircle className="mr-2 inline-block text-gray-500" />Free shipping on orders over $50.</p>
                  <p>Easy 30-day returns.</p>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Scent Tags:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <Button key={tag.id} variant="outline" size="sm" asChild>
                      <a href={`/tags/${tag.slug}`}>{tag.name}</a>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* AR Visualization (if modelUrl exists) */}
            {product.modelUrl && (
                <div className="my-8">
                    <ARVisualization
                        productId={product.id}
                        productName={product.name}
                        modelUrl={product.modelUrl}
                        previewImageUrl={product.images[0]?.url}
                        productSize={product.dimensions as {width:number, height:number, depth:number} | undefined}
                    />
                </div>
            )}
          </div>
        </div>
        
        {/* Reviews Section */}
        <div id="reviews" className="mt-16">
          <h2 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">
            Customer Reviews
          </h2>
          <ProductReviews productId={product.id} productName={product.name} initialReviews={product.reviews} avgRating={product.avgRating} reviewCount={product.reviewCount}/>
        </div>
        
        {/* Related Products */}
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
    </>
  );
};

export default ProductDetail;