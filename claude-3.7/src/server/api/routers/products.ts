// src/server/api/routers/products.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { type Prisma } from "@prisma/client"; // For WhereInput types

export const productsRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        categoryId: z.string().optional(),
        tagIds: z.array(z.string()).optional(),
        collectionSlug: z.string().optional(), // Added for collections
        featured: z.boolean().optional(),
        onSale: z.boolean().optional(), // Added for sale filter
        bestSeller: z.boolean().optional(),
        isNew: z.boolean().optional(),
        search: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        sortBy: z.enum(["createdAt_desc", "createdAt_asc", "price_asc", "price_desc", "name_asc", "name_desc", "rating_desc"]).optional().default("createdAt_desc"),
        limit: z.number().min(1).max(100).optional().default(12),
        cursor: z.string().optional(), // For cursor-based pagination
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, categoryId, tagIds, collectionSlug, featured, onSale, bestSeller, isNew, search, minPrice, maxPrice, sortBy } = input;

      const whereClause: Prisma.ProductWhereInput = {
        publishedAt: { not: null, lte: new Date() }, // Only show published products
        ...(categoryId ? { categories: { some: { id: categoryId } } } : {}),
        ...(collectionSlug ? { collections: { some: { slug: collectionSlug } } } : {}),
        ...(tagIds && tagIds.length > 0 ? { tags: { some: { id: { in: tagIds } } } } : {}),
        ...(featured !== undefined ? { featured } : {}),
        ...(onSale !== undefined ? { onSale } : {}),
        ...(bestSeller !== undefined ? { bestSeller } : {}),
        ...(isNew !== undefined ? { isNew } : {}),
        ...(minPrice !== undefined ? { price: { gte: minPrice } } : {}),
        ...(maxPrice !== undefined ? { price: { lte: maxPrice } } : {}),
        ...(search ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { sku: { contains: search, mode: "insensitive" } },
              { categories: { some: { name: { contains: search, mode: "insensitive" } } } },
              { tags: { some: { name: { contains: search, mode: "insensitive" } } } },
            ],
          } : {}),
      };
      
      let orderByClause: Prisma.ProductOrderByWithRelationInput = {};
      switch (sortBy) {
        case "createdAt_desc": orderByClause = { createdAt: "desc" }; break;
        case "createdAt_asc": orderByClause = { createdAt: "asc" }; break;
        case "price_asc": orderByClause = { price: "asc" }; break;
        case "price_desc": orderByClause = { price: "desc" }; break;
        case "name_asc": orderByClause = { name: "asc" }; break;
        case "name_desc": orderByClause = { name: "desc" }; break;
        // rating_desc would require a more complex sort or denormalized avgRating field
        default: orderByClause = { createdAt: "desc" };
      }


      const items = await ctx.db.product.findMany({
        take: limit + 1, // Fetch one more to check for next cursor
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: orderByClause,
        where: whereClause,
        include: {
          categories: true,
          tags: true,
          images: { take: 1, orderBy: { position: 'asc' } }, // Take first image
          reviews: {
            select: {
              rating: true,
            },
          },
          variants: { // Include variants to show price range or default variant price
            select: { price: true, options: true }
          }
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop(); // remove the extra item
        nextCursor = nextItem?.id;
      }

      const productsWithAvgRating = items.map(product => {
        const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
        const avgRating = product.reviews.length > 0 ? totalRating / product.reviews.length : 0;
        
        // Convert Decimal fields to string or number for client
        return {
          ...product,
          price: parseFloat(product.price.toString()),
          compareAtPrice: product.compareAtPrice ? parseFloat(product.compareAtPrice.toString()) : null,
          avgRating,
          reviewCount: product.reviews.length,
        };
      });

      return {
        items: productsWithAvgRating,
        nextCursor,
      };
    }),

  getById: publicProcedure // Used by [slug].tsx in design_document_2.md, so should use slug
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUnique({
        where: { slug: input.slug, publishedAt: { not: null, lte: new Date() } },
        include: {
          images: { orderBy: { position: 'asc' } },
          categories: true,
          tags: true,
          variants: { orderBy: { isDefault: 'desc' } }, // Default variant first
          reviews: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 10, // Limit initial reviews shown
          },
          // For "relatedProducts" and "recommendedWith" if using direct relations
          // relatedProducts: { include: { images: { take: 1 } } }, 
          // recommendedWith: { include: { images: { take: 1 } } },
        },
      });

      if (!product) {
        // Consider throwing TRPCError NOT_FOUND if product must exist
        return null;
      }

      const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
      const avgRating = product.reviews.length ? totalRating / product.reviews.length : 0;

      return {
        ...product,
        price: parseFloat(product.price.toString()),
        compareAtPrice: product.compareAtPrice ? parseFloat(product.compareAtPrice.toString()) : null,
        costPrice: product.costPrice ? parseFloat(product.costPrice.toString()) : null,
        avgRating,
        reviewCount: product.reviews.length,
        // Ensure all Decimal fields in variants are also converted if needed client-side
        variants: product.variants.map(v => ({
          ...v,
          price: v.price ? parseFloat(v.price.toString()) : null,
        }))
      };
    }),
    
  search: publicProcedure // From SearchBox.tsx in design_document_2.md
    .input(
      z.object({
        query: z.string(),
        limit: z.number().optional().default(5),
        categoryId: z.string().optional(), // Optional category context for search
      })
    )
    .query(async ({ ctx, input }) => {
      const { query, limit, categoryId } = input;

      if (query.trim().length < 2) { // Minimum query length
        return { items: [] };
      }

      const items = await ctx.db.product.findMany({
        where: {
          publishedAt: { not: null, lte: new Date() },
          ...(categoryId ? { categories: { some: { id: categoryId } } } : {}),
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { sku: { contains: query, mode: "insensitive" } },
            { tags: { some: { name: { contains: query, mode: "insensitive" } } } },
          ],
        },
        take: limit,
        include: {
          images: { take: 1, orderBy: { position: 'asc' } },
          categories: { select: { name: true, slug: true }, take: 1 }, // Select only needed fields
        },
        orderBy: {
          // Add a relevance score or sort by name/popularity eventually
          _relevance: { // Prisma full-text search relevance (PostgreSQL specific)
            fields: ['name', 'description'],
            search: query.split(' ').join(' & '), // Prepare for full-text search
            sort: 'desc'
          }
        }
      });

      // Convert Decimal fields
      const results = items.map(product => ({
        ...product,
        price: parseFloat(product.price.toString()),
        compareAtPrice: product.compareAtPrice ? parseFloat(product.compareAtPrice.toString()) : null,
      }));

      return { items: results };
    }),

  getScents: publicProcedure // Used by SmartHomeIntegration.tsx for scent selection
    .query(async ({ ctx }) => {
      // This is a simplified version. In reality, "scents" might be products themselves,
      // specific variants, or a dedicated ScentProfile model.
      // Assuming 'scents' are products tagged as 'diffuser-scent' or similar category.
      const scents = await ctx.db.product.findMany({
        where: {
          // Example: filter by a specific category or tag indicating it's a scent
          // categories: { some: { slug: "diffuser-oils" } },
          inStock: true,
          publishedAt: { not: null, lte: new Date() },
        },
        select: {
          id: true,
          name: true,
          images: { take: 1, select: { url: true }, orderBy: {position: 'asc'} },
        },
        orderBy: { name: 'asc' },
        take: 100, // Limit for dropdown
      });
      return scents.map(s => ({
        id: s.id,
        name: s.name,
        imageUrl: s.images[0]?.url,
      }));
    }),
});
