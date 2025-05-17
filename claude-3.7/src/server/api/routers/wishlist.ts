// src/server/api/routers/wishlist.ts
import { protectedProcedure, createTRPCRouter } from "~/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const wishlistRouter = createTRPCRouter({
  getWishlist: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      console.log("User: Fetching wishlist for user:", userId);
      return ctx.db.wishlistItem.findMany({
        where: { userId },
        include: {
          product: { // Include necessary product details for display
            select: { 
                id: true, 
                name: true, 
                slug: true, 
                price: true, // Will need parseFloat on client
                compareAtPrice: true, // Will need parseFloat on client
                inStock: true, 
                stockQuantity: true,
                images: { take: 1, orderBy: { position: 'asc' }, select: {url: true, altText: true} } 
            }
          },
          // If you store variantId on WishlistItem and want variant details:
          // variant: { select: { id: true, name: true, price: true, imageUrl: true } }
        },
        orderBy: { addedAt: 'desc' },
      });
    }),

  addToWishlist: protectedProcedure
    .input(z.object({
      productId: z.string(),
      variantId: z.string().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      console.log("User: Adding to wishlist:", input, "for user:", userId);
      
      // Check if item already exists (Prisma unique constraint should also handle this)
      const existingItem = await ctx.db.wishlistItem.findFirst({
          where: {userId, productId: input.productId, variantId: input.variantId ?? null}
      });
      if (existingItem) {
          // Optionally, just return existing item or a specific message
          // throw new TRPCError({ code: "BAD_REQUEST", message: "Item already in wishlist." });
          return existingItem; // Or simply do nothing and let client handle UI
      }

      return ctx.db.wishlistItem.create({
        data: {
          userId,
          productId: input.productId,
          variantId: input.variantId ?? null,
        },
      });
    }),

  removeFromWishlist: protectedProcedure
    .input(z.object({
      productId: z.string(),
      variantId: z.string().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      console.log("User: Removing from wishlist:", input, "for user:", userId);
      const result = await ctx.db.wishlistItem.deleteMany({ // deleteMany to handle composite key for deletion
        where: {
          userId,
          productId: input.productId,
          variantId: input.variantId ?? null,
        },
      });
      if (result.count === 0) {
          // Optionally throw if item not found, or just return success
          // throw new TRPCError({ code: "NOT_FOUND", message: "Item not found in wishlist." });
      }
      return { success: result.count > 0 };
    }),

  clearWishlist: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      console.log("User: Clearing wishlist for user:", userId);
      await ctx.db.wishlistItem.deleteMany({
        where: { userId },
      });
      return { success: true };
    }),
});