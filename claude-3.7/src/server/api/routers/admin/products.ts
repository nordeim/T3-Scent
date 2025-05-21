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
  collectionIds: z.array(z.string()).optional().default([]),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  inStock: z.boolean().optional().default(true),
  featured: z.boolean().optional().default(false),
  bestSeller: z.boolean().optional().default(false),
  isNew: z.boolean().optional().default(false),
  onSale: z.boolean().optional().default(false),
  saleEndDate: z.date().nullable().optional(),
  publishedAt: z.date().nullable().optional(),
  modelUrl: z.string().url().nullable().optional(),
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
        sortBy: z.string().optional().default("createdAt_desc"),
    }))
    .query(async ({ ctx, input }) => {
        const { limit, cursor, search, categoryId, tagId, collectionId, stockStatus, publishStatus, sortBy } = input;
        
        const where: Prisma.ProductWhereInput = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
            ];
        }
        if (categoryId) where.categories = { some: { id: categoryId } };
        if (tagId) where.tags = { some: { id: tagId }};
        if (collectionId) where.collections = { some: { id: collectionId }};

        // Corrected stockStatus logic
        if (stockStatus === "out_of_stock") {
            where.stockQuantity = { lte: 0 };
        } else if (stockStatus === "low_stock") {
            // This assumes 'low stock' means stock is positive but at or below a certain threshold.
            // Prisma cannot directly compare product.stockQuantity with product.lowStockThreshold in a WHERE clause.
            // A common simplification is to use a fixed value for "low" or filter in application code after fetching.
            // Here, we use a fixed threshold (e.g., 10) as an example.
            where.AND = [
                { stockQuantity: { gt: 0 } }, 
                { stockQuantity: { lte: 10 } } // Example fixed low stock threshold
            ];
        } else if (stockStatus === "in_stock") {
             where.stockQuantity = { gt: 10 }; // Example: stock greater than the fixed low stock threshold
        }

        if (publishStatus === "published") where.publishedAt = { not: null, lte: new Date() };
        else if (publishStatus === "draft") where.publishedAt = null;
        else if (publishStatus === "scheduled") where.publishedAt = { gt: new Date() };
        
        const orderBy: Prisma.ProductOrderByWithRelationInput = {};
        if (sortBy === 'name_asc') orderBy.name = 'asc';
        else if (sortBy === 'name_desc') orderBy.name = 'desc';
        else if (sortBy === 'price_asc') orderBy.price = 'asc';
        else if (sortBy === 'price_desc') orderBy.price = 'desc';
        else if (sortBy === 'stockQuantity_asc') orderBy.stockQuantity = 'asc';
        else if (sortBy === 'stockQuantity_desc') orderBy.stockQuantity = 'desc';
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
          categories: { select: { id: true } }, 
          tags: { select: { id: true } },       
          collections: { select: { id: true } }, 
          variants: { orderBy: [{ isDefault: 'desc' }, { name: 'asc' }] },
        },
      });
      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }
      return {
        ...product,
        price: parseFloat(product.price.toString()),
        compareAtPrice: product.compareAtPrice ? parseFloat(product.compareAtPrice.toString()) : null,
        costPrice: product.costPrice ? parseFloat(product.costPrice.toString()) : null,
        variants: product.variants.map(v => ({...v, price: v.price ? parseFloat(v.price.toString()): null, stockQuantity: v.stockQuantity ?? 0}))
      };
    }),

  createProduct: adminProcedure
    .input(ProductInputSchema) 
    .mutation(async ({ ctx, input }) => {
      const { categoryIds, tagIds, collectionIds, ...productData } = input;
      
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
        },
      });
      return product;
    }),

  updateProduct: adminProcedure
    .input(ProductInputSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, categoryIds, tagIds, collectionIds, ...productData } = input;

      if (productData.slug) {
          const existingSlug = await ctx.db.product.findFirst({ where: { slug: productData.slug, NOT: { id } } });
          if (existingSlug) {
              throw new TRPCError({ code: 'BAD_REQUEST', message: 'Slug already exists. Please choose a unique slug.' });
          }
      }

      const product = await ctx.db.product.update({
        where: { id },
        data: {
          ...productData,
          categories: { set: categoryIds.map(id => ({ id })) },
          tags: { set: tagIds.map(id => ({ id })) },
          collections: { set: collectionIds?.map(id => ({ id })) },
        },
      });
      return product;
    }),

  deleteProduct: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db.product.delete({ where: { id: input.id } });
        return { success: true, message: "Product deleted successfully." };
      } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2003') { 
              throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot delete product. It is referenced in orders or other essential records.'});
            }
            if (error.code === 'P2025') {
              throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found for deletion.' });
            }
          }
          console.error("Error deleting product:", error);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete product.' });
      }
    }),
    
    getAllCategories: adminProcedure.query(async ({ctx}) => {
        return ctx.db.category.findMany({orderBy: {name: 'asc'}});
    }),
    getAllTags: adminProcedure.query(async ({ctx}) => {
        return ctx.db.tag.findMany({orderBy: {name: 'asc'}});
    }),
    getAllCollections: adminProcedure.query(async ({ctx}) => {
        return ctx.db.collection.findMany({orderBy: {name: 'asc'}});
    }),
});