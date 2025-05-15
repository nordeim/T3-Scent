// src/types/product.ts
import type { 
    Product as PrismaProduct, 
    ProductVariant as PrismaProductVariant, 
    ProductImage as PrismaProductImage, 
    Category as PrismaCategory, 
    Tag as PrismaTag, 
    Review as PrismaReview, 
    User as PrismaUser 
} from "@prisma/client";

// Processed variant type for client-side use (price as number)
export interface ProcessedProductVariant extends Omit<PrismaProductVariant, 'price' | 'stockQuantity'> {
  price: number | null;
  stockQuantity: number; // Ensuring it's always a number, defaulting to 0 from Prisma
}

// Processed review user type (subset of PrismaUser)
export interface ProcessedProductReviewUser extends Pick<PrismaUser, 'id' | 'name' | 'image'> {}

// Processed review type (dates as strings, user processed)
export interface ProcessedProductReview extends Omit<PrismaReview, 'createdAt' | 'updatedAt' | 'user'> {
    createdAt: string;
    updatedAt: string;
    user: ProcessedProductReviewUser;
}

// Main processed product type for detail pages and listings
export interface ProductWithRelations extends Omit<
    PrismaProduct, 
    'price' | 'compareAtPrice' | 'costPrice' | 'createdAt' | 'updatedAt' | 'publishedAt' | 'saleEndDate' | 'variants' | 'reviews' | 'stockQuantity'
> {
  images: PrismaProductImage[];
  variants: ProcessedProductVariant[];
  categories: Pick<PrismaCategory, 'id' | 'name' | 'slug'>[]; // Only pick necessary fields
  tags: Pick<PrismaTag, 'id' | 'name' | 'slug'>[]; // Only pick necessary fields
  reviews: ProcessedProductReview[]; // For initial load or full list
  avgRating: number;
  reviewCount: number;
  price: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  stockQuantity: number; // Ensuring it's always a number
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  saleEndDate: string | null;
}