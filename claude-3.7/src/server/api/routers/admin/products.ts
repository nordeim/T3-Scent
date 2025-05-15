// src/server/api/routers/admin/products.ts
import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { type Prisma } from "@prisma/client";

const ProductInputSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0.01, "Price must be positive"),
  compareAtPrice: z.number().min(0).nullable().optional(),
  costPrice: z.number().min(0).nullable().optional(),
  sku: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  weight: z.number().min(0).nullable().optional(),
  dimensions: z.object({
    length: z.number().min(0).optional(),
    width: z.number().min(0).optional(),
    height: z.number().min(0).optional(),
  }).nullable().optional(),
  stockQuantity: z.number().int().min(0).nullable().optional(),
  lowStockThreshold: z.number().int().min(0).optional().default(5),
  categoryIds: z.array(z.string()).optional().default([]),
  tagIds: z.array(z.string()).optional().default([]),
  collectionIds: z.array(z.string()).optional().default([]), // Added for collections
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  inStock: z.boolean().optional().default(true),
  featured: z.boolean().optional().default(false),
  bestSeller: z.boolean().optional().default(false),
  isNew: z.boolean().optional().default(false),
  onSale: z.boolean().optional().default(false),
  saleEndDate: z.date().nullable().optional(),
  publishedAt: z.date().nullable().optional(), // For scheduling publication
  modelUrl: z.string().url().nullable().optional(),
  // variants: ProductVariantInputSchema[] - This needs to be handled carefully, Prisma doesn't support nested create/update of relations in one go for complex cases easily.
  // images: ProductImageInputSchema[] - Similar to variants, image handling is complex.
});

export const adminProductsRouter = createTRPCRouter({
  getAll: adminProcedure
    .input(z.object({
        limit: z.number().optional().default(20),
        cursor: z.string().optional(),
        search: z.string().optional(),
        categoryId: z.string().optional(),
        tagId: z.string().optional(),
        collectionId: z.string().optional(),
        stockStatus: z.enum(["in_stock", "low_stock", "out_of_stock"]).optional(),
        publishStatus: z.enum(["published", "draft", "scheduled"]).optional(),
        sortBy: z.string().optional().default("createdAt_desc"), // e.g., "name_asc", "price_desc"
    }))
    .query(async ({ ctx, input }) => {
        // Placeholder for fetching paginated admin product list
        const { limit, cursor, search, categoryId, stockStatus, publishStatus, sortBy } = input;
        
        const where: Prisma.ProductWhereInput = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
            ];
        }
        if (categoryId) where.categories = { some: { id: categoryId } };
        if (stockStatus === "out_of_stock") where.stockQuantity = { lte: 0 };
        else if (stockStatus === "low_stock") where.AND = [ {stockQuantity: { gt: 0 }}, { stockQuantity: { lte: prisma.product.fields.lowStockThreshold }} ]; // This needs a more complex query or raw SQL
        else if (stockStatus === "in_stock") where.stockQuantity = { gt: prisma.product.fields.lowStockThreshold }; // or gt: 0 if lowStockThreshold is not always set

        if (publishStatus === "published") where.publishedAt = { not: null, lte: new Date() };
        else if (publishStatus === "draft") where.publishedAt = null;
        // else if (publishStatus === "scheduled") where.publishedAt = { gt: new Date() };
        
        // Basic sorting, more complex sort needed for variants or computed fields
        const orderBy: Prisma.ProductOrderByWithRelationInput = {};
        if (sortBy === 'name_asc') orderBy.name = 'asc';
        else if (sortBy === 'name_desc') orderBy.name = 'desc';
        else if (sortBy === 'price_asc') orderBy.price = 'asc';
        else if (sortBy === 'price_desc') orderBy.price = 'desc';
        else orderBy.createdAt = 'desc';

        const products = await ctx.db.product.findMany({
            take: limit + 1,
            cursor: cursor ? { id: cursor } : undefined,
            where,
            orderBy,
            include: {
                categories: { select: { id: true, name: true } },
                images: { take: 1, orderBy: { position: 'asc'}, select: { url: true, altText: true } },
                variants: { select: { id: true, name: true, sku: true, stockQuantity: true, price: true } },
            },
        });

        let nextCursor: typeof cursor | undefined = undefined;
        if (products.length > limit) {
            const nextItem = products.pop();
            nextCursor = nextItem?.id;
        }
        
        // Convert Decimals
        return {
            items: products.map(p => ({
                ...p,
                price: parseFloat(p.price.toString()),
                compareAtPrice: p.compareAtPrice ? parseFloat(p.compareAtPrice.toString()) : null,
                costPrice: p.costPrice ? parseFloat(p.costPrice.toString()) : null,
                variants: p.variants.map(v => ({...v, price: v.price ? parseFloat(v.price.toString()): null}))
            })),
            nextCursor,
        };
    }),
  
  getById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUnique({
        where: { id: input.id },
        include: {
          images: { orderBy: { position: 'asc' } },
          categories: { select: { id: true } }, // For multi-select, just need IDs
          tags: { select: { id: true } },       // For multi-select, just need IDs
          collections: { select: { id: true } }, // For multi-select
          variants: { orderBy: [{ isDefault: 'desc' }, { name: 'asc' }] },
        },
      });
      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }
      // Convert Decimals
      return {
        ...product,
        price: parseFloat(product.price.toString()),
        compareAtPrice: product.compareAtPrice ? parseFloat(product.compareAtPrice.toString()) : null,
        costPrice: product.costPrice ? parseFloat(product.costPrice.toString()) : null,
        variants: product.variants.map(v => ({...v, price: v.price ? parseFloat(v.price.toString()): null, stockQuantity: v.stockQuantity ?? 0}))
      };
    }),

  createProduct: adminProcedure
    .input(ProductInputSchema.omit({ variants: true, images: true })) // Handle variants/images separately
    .mutation(async ({ ctx, input }) => {
      const { categoryIds, tagIds, collectionIds, ...productData } = input;
      
      // Check for slug uniqueness
      const existingSlug = await ctx.db.product.findUnique({ where: { slug: productData.slug } });
      if (existingSlug) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Slug already exists. Please choose a unique slug.' });
      }

      const product = await ctx.db.product.create({
        data: {
          ...productData,
          categories: { connect: categoryIds.map(id => ({ id })) },
          tags: { connect: tagIds.map(id => ({ id })) },
          collections: { connect: collectionIds?.map(id => ({ id })) },
          // Image and Variant creation would be more complex, often multi-step or separate procedures
        },
      });
      return product;
    }),

  updateProduct: adminProcedure
    .input(ProductInputSchema.extend({ id: z.string() }).omit({ variants: true, images: true }))
    .mutation(async ({ ctx, input }) => {
      const { id, categoryIds, tagIds, collectionIds, ...productData } = input;

      // Check for slug uniqueness if changed
      if (productData.slug) {
          const existingSlug = await ctx.db.product.findFirst({ where: { slug: productData.slug, NOT: { id } } });
          if (existingSlug) {
              throw new TRPCError({ code: 'BAD_REQUEST', message: 'Slug already exists. Please choose a unique slug.' });
          }
      }

      // Handle relations for categories, tags, collections
      // This needs to disconnect old ones and connect new ones if not using set
      const product = await ctx.db.product.update({
        where: { id },
        data: {
          ...productData,
          categories: { set: categoryIds.map(id => ({ id })) },
          tags: { set: tagIds.map(id => ({ id })) },
          collections: { set: collectionIds?.map(id => ({ id })) },
          // Image and Variant updates are complex.
          // Usually involves deleting old ones not in new list, updating existing, creating new.
        },
      });
      return product;
    }),

  deleteProduct: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Add checks: e.g., ensure product is not in active orders or subscriptions before deletion, or handle cascading effects.
      // For now, a simple delete:
      try {
        await ctx.db.product.delete({ where: { id: input.id } });
        return { success: true, message: "Product deleted successfully." };
      } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') { // Foreign key constraint
              throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot delete product. It is referenced in orders or other records.'});
          }
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete product.' });
      }
    }),
    
    // Procedures for categories, tags, collections
    getAllCategories: adminProcedure.query(async ({ctx}) => {
        return ctx.db.category.findMany({orderBy: {name: 'asc'}});
    }),
    getAllTags: adminProcedure.query(async ({ctx}) => {
        return ctx.db.tag.findMany({orderBy: {name: 'asc'}});
    }),
    // ... add more admin procedures for product related entities if needed
});
