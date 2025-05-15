// src/server/api/routers/recommendations.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { type Prisma } from "@prisma/client";

// Define a type for product with recommendation scores
type ProductWithScore = Prisma.ProductGetPayload<{
  include: {
    images: { take: 1, orderBy: { position: 'asc' } };
    categories: true;
    tags: true;
    reviews: { select: { rating: true } };
  };
}> & {
  price: number; // Converted from Decimal
  compareAtPrice: number | null; // Converted from Decimal
  score?: number;
  avgRating?: number;
  relevanceScore?: number;
  cooccurrenceScore?: number;
};

export const recommendationsRouter = createTRPCRouter({
  getPersonalized: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(8) }))
    .query(async ({ ctx, input }): Promise<ProductWithScore[]> => {
      const userId = ctx.session.user.id;
      const { limit } = input;

      const userOrders = await ctx.db.order.findMany({
        where: { userId, status: { in: ["COMPLETED", "DELIVERED", "SHIPPED", "PAID"] } }, // Consider paid orders too
        include: {
          orderItems: {
            include: {
              product: {
                include: { categories: true, tags: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10, // Consider more orders for better preference profile
      });

      const purchasedProductIds = new Set<string>();
      const categoryPreferences = new Map<string, number>(); // categoryId -> weight
      const tagPreferences = new Map<string, number>();     // tagId -> weight

      userOrders.forEach((order, orderIndex) => {
        // Recency multiplier: more recent orders have higher impact
        const recencyMultiplier = Math.max(0.2, 1 - (orderIndex * 0.1));
        order.orderItems.forEach(item => {
          if (!item.product) return; // Should not happen with include
          purchasedProductIds.add(item.productId);

          item.product.categories.forEach(category => {
            categoryPreferences.set(category.id, (categoryPreferences.get(category.id) || 0) + (1 * recencyMultiplier));
          });
          item.product.tags.forEach(tag => {
            tagPreferences.set(tag.id, (tagPreferences.get(tag.id) || 0) + (1 * recencyMultiplier));
          });
        });
      });
      
      // Also consider wishlist items for preferences (lower weight than purchases)
      const userWishlist = await ctx.db.wishlistItem.findMany({
        where: { userId },
        include: { product: { include: { categories: true, tags: true }}},
        take: 20,
      });

      userWishlist.forEach(item => {
        if (!item.product) return;
        // Don't add to purchasedProductIds, as we might still recommend wishlisted items if not bought
        item.product.categories.forEach(category => {
            categoryPreferences.set(category.id, (categoryPreferences.get(category.id) || 0) + 0.3); // Lower weight for wishlist
        });
        item.product.tags.forEach(tag => {
            tagPreferences.set(tag.id, (tagPreferences.get(tag.id) || 0) + 0.3);
        });
      });


      if (categoryPreferences.size === 0 && tagPreferences.size === 0) {
        // No preference data, return featured or best-selling products as fallback
        const fallbackProducts = await ctx.db.product.findMany({
          where: {
            id: { notIn: Array.from(purchasedProductIds) },
            OR: [{ featured: true }, { bestSeller: true }],
            inStock: true,
            publishedAt: { not: null, lte: new Date() },
          },
          include: { images: { take: 1, orderBy: { position: 'asc' } }, categories: true, tags: true, reviews: { select: { rating: true } } },
          take: limit,
          orderBy: { createdAt: 'desc' } // Or by some popularity metric
        });
        return fallbackProducts.map(p => ({
            ...p,
            price: parseFloat(p.price.toString()),
            compareAtPrice: p.compareAtPrice ? parseFloat(p.compareAtPrice.toString()) : null,
            score: 0 // No specific score
        }));
      }

      const topCategoryIds = [...categoryPreferences.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
      const topTagIds = [...tagPreferences.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);

      const recommendedProducts = await ctx.db.product.findMany({
        where: {
          id: { notIn: Array.from(purchasedProductIds) },
          OR: [
            { categories: { some: { id: { in: topCategoryIds } } } },
            { tags: { some: { id: { in: topTagIds } } } },
          ],
          inStock: true,
          publishedAt: { not: null, lte: new Date() },
        },
        include: { images: { take: 1, orderBy: { position: 'asc' } }, categories: true, tags: true, reviews: { select: { rating: true } } },
        take: limit * 2, // Fetch more initially for better scoring and filtering
      });

      const scoredProducts = recommendedProducts.map(product => {
        let score = 0;
        product.categories.forEach(c => score += (categoryPreferences.get(c.id) || 0) * 1.5); // Higher weight for category match
        product.tags.forEach(t => score += (tagPreferences.get(t.id) || 0));

        const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = product.reviews.length ? totalRating / product.reviews.length : 0;
        if (avgRating > 0) score *= (1 + (avgRating / 10)); // Boost by up to 50% based on rating

        return {
          ...product,
          price: parseFloat(product.price.toString()),
          compareAtPrice: product.compareAtPrice ? parseFloat(product.compareAtPrice.toString()) : null,
          score,
          avgRating,
        };
      }).sort((a, b) => b.score - a.score).slice(0, limit);

      return scoredProducts;
    }),

  getQuizRecommendations: publicProcedure // Changed to a query for GET, but doc 2 had mutation. If storing, mutation is fine.
                                          // Assuming it's a mutation to allow response storage.
    .input(z.object({
      responses: z.array(z.object({ questionId: z.string(), answer: z.string() /* Can be comma-sep for multi */ })),
      sessionId: z.string().optional(), // For anonymous users to potentially link sessions later
      limit: z.number().optional().default(8),
    }))
    .mutation(async ({ ctx, input }): Promise<{ recommendedProducts: ProductWithScore[], personality?: object | null }> => {
      const { responses, sessionId, limit } = input;
      const userId = ctx.session?.user?.id;

      if (responses.length === 0) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'No quiz responses provided.' });
      }

      // Store responses
      await Promise.all(responses.map(response =>
        ctx.db.quizResponse.create({
          data: {
            questionId: response.questionId,
            answer: response.answer,
            userId: userId,
            sessionId: userId ? undefined : sessionId,
          },
        })
      ));
      
      const questionIds = responses.map(r => r.questionId);
      const questions = await ctx.db.quizQuestion.findMany({ where: { id: { in: questionIds } } });

      const preferenceTags = new Map<string, number>(); // tag_name (lower) -> weight

      responses.forEach(response => {
        const question = questions.find(q => q.id === response.questionId);
        if (!question || !question.options) return;
        
        const questionOptions = question.options as Array<{ id: string; label: string; value?: string; tags?: string[] }>;
        const selectedAnswerValues = response.answer.split(','); // For multiple choice

        selectedAnswerValues.forEach(answerValue => {
            const selectedOption = questionOptions.find(opt => opt.id === answerValue || opt.value === answerValue);
            if (selectedOption?.tags) {
                selectedOption.tags.forEach(tag => {
                    preferenceTags.set(tag.toLowerCase(), (preferenceTags.get(tag.toLowerCase()) || 0) + 1);
                });
            }
        });
      });
      
      if (preferenceTags.size === 0) {
          // Fallback: recommend generic popular items
          const fallback = await ctx.db.product.findMany({
              where: { inStock: true, publishedAt: { not: null, lte: new Date() }, OR: [{featured: true}, {bestSeller: true}]},
              include: { images: { take: 1, orderBy: {position: 'asc'} }, categories: true, tags: true, reviews: { select: { rating: true } } },
              take: limit,
              orderBy: { createdAt: 'desc' }
          });
          return { recommendedProducts: fallback.map(p => ({...p, price: parseFloat(p.price.toString()), compareAtPrice: p.compareAtPrice ? parseFloat(p.compareAtPrice.toString()) : null})) };
      }

      const topPreferenceTags = [...preferenceTags.entries()].sort((a,b) => b[1] - a[1]).slice(0,10).map(e => e[0]);
      const matchingDbTags = await ctx.db.tag.findMany({ where: { name: { in: topPreferenceTags, mode: 'insensitive' }}});
      const matchingDbTagIds = matchingDbTags.map(t => t.id);

      const recommendedProducts = await ctx.db.product.findMany({
        where: {
          tags: { some: { id: { in: matchingDbTagIds } } },
          inStock: true,
          publishedAt: { not: null, lte: new Date() },
        },
        include: { images: { take: 1, orderBy: { position: 'asc' } }, categories: true, tags: true, reviews: { select: { rating: true } } },
        take: limit * 2, 
      });

      const scoredProducts = recommendedProducts.map(product => {
        let relevanceScore = 0;
        product.tags.forEach(tag => {
          if (matchingDbTags.some(dbTag => dbTag.id === tag.id && preferenceTags.has(dbTag.name.toLowerCase()))) {
            relevanceScore += (preferenceTags.get(tag.name.toLowerCase()) || 0);
          }
        });
        const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = product.reviews.length ? totalRating / product.reviews.length : 0;
        if (avgRating > 3.5) relevanceScore *= 1.2; // Boost for good ratings

        return {
          ...product,
          price: parseFloat(product.price.toString()),
          compareAtPrice: product.compareAtPrice ? parseFloat(product.compareAtPrice.toString()) : null,
          relevanceScore,
          avgRating,
        };
      }).sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, limit);

      // TODO: Determine "personality" based on dominant tags/responses
      let personality = null;
      // Example simplified personality logic:
      // const dominantTag = topPreferenceTags[0];
      // if (dominantTag === 'calming') personality = { type: "The Tranquil Soul", description: "...", traits: ["Peaceful", "Relaxed"] };

      return { recommendedProducts: scoredProducts, personality };
    }),

  getFrequentlyBoughtTogether: publicProcedure
    .input(z.object({
      productId: z.string(),
      limit: z.number().optional().default(3),
    }))
    .query(async ({ ctx, input }): Promise<ProductWithScore[]> => {
      const { productId, limit } = input;

      const ordersWithProduct = await ctx.db.order.findMany({
        where: {
          orderItems: { some: { productId } },
          status: { in: ["COMPLETED", "DELIVERED", "SHIPPED", "PAID"] },
        },
        select: { orderItems: { select: { productId: true } } },
        take: 200, // More orders for better co-occurrence data
      });

      const cooccurrence = new Map<string, number>();
      ordersWithProduct.forEach(order => {
        const productIdsInOrder = new Set(order.orderItems.map(item => item.productId));
        if (productIdsInOrder.has(productId)) {
          productIdsInOrder.forEach(id => {
            if (id !== productId) {
              cooccurrence.set(id, (cooccurrence.get(id) || 0) + 1);
            }
          });
        }
      });

      const sortedCooccurring = [...cooccurrence.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);

      if (sortedCooccurring.length === 0) {
        // Fallback: products from the same primary category
        const currentProduct = await ctx.db.product.findUnique({
          where: { id: productId },
          include: { categories: { take: 1, orderBy: { name: 'asc'} } }, // Get primary category
        });
        if (!currentProduct?.categories[0]) return [];

        const categoryProducts = await ctx.db.product.findMany({
          where: {
            id: { not: productId },
            categories: { some: { id: currentProduct.categories[0].id } },
            inStock: true,
            publishedAt: { not: null, lte: new Date() },
          },
          include: { images: { take: 1, orderBy: { position: 'asc' } }, categories: true, tags: true, reviews: { select: { rating: true } } },
          take: limit,
          orderBy: { reviews: { _count: 'desc' } } // Example: order by review count
        });
        return categoryProducts.map(p => ({
            ...p,
            price: parseFloat(p.price.toString()),
            compareAtPrice: p.compareAtPrice ? parseFloat(p.compareAtPrice.toString()) : null,
            cooccurrenceScore: 0,
        }));
      }

      const cooccurringProductIds = sortedCooccurring.map(entry => entry[0]);
      const products = await ctx.db.product.findMany({
        where: { id: { in: cooccurringProductIds }, inStock: true, publishedAt: { not: null, lte: new Date() } },
        include: { images: { take: 1, orderBy: { position: 'asc' } }, categories: true, tags: true, reviews: { select: { rating: true } } },
      });

      return products.map(p => ({
        ...p,
        price: parseFloat(p.price.toString()),
        compareAtPrice: p.compareAtPrice ? parseFloat(p.compareAtPrice.toString()) : null,
        cooccurrenceScore: cooccurrence.get(p.id) || 0,
      })).sort((a,b) => (b.cooccurrenceScore || 0) - (a.cooccurrenceScore || 0));
    }),
});
