// src/server/api/routers/reviews.ts
import { protectedProcedure, publicProcedure, createTRPCRouter } from "~/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

const ReviewInputSchema = z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(3).max(100).optional(),
  comment: z.string().min(10).max(1000).optional(),
  // orderItemId: z.string().optional(), // To link to a specific purchase for "verified" status
});

export const reviewsRouter = createTRPCRouter({
  getReviewsForProduct: publicProcedure
    .input(z.object({
      productId: z.string(),
      limit: z.number().min(1).max(50).optional().default(5),
      cursor: z.string().optional(), // Review ID for cursor
      sortBy: z.enum(["newest", "oldest", "rating_high", "rating_low", "helpful"]).optional().default("newest"),
    }))
    .query(async ({ ctx, input }) => {
      console.log("Fetching reviews for product:", input.productId);
      // Placeholder: Implement fetching reviews with pagination and sorting
      let orderBy: any = { createdAt: 'desc' };
      if (input.sortBy === "oldest") orderBy = { createdAt: 'asc' };
      else if (input.sortBy === "rating_high") orderBy = [{ rating: 'desc' }, { createdAt: 'desc' }];
      else if (input.sortBy === "rating_low") orderBy = [{ rating: 'asc' }, { createdAt: 'desc' }];
      else if (input.sortBy === "helpful") orderBy = [{ helpfulCount: 'desc' }, { createdAt: 'desc' }];
      
      const reviews = await ctx.db.review.findMany({
          where: { productId: input.productId, status: "APPROVED" }, // Only show approved reviews
          take: input.limit + 1,
          cursor: input.cursor ? {id: input.cursor} : undefined,
          orderBy,
          include: { user: {select: {name: true, image: true}} }
      });
      // ... pagination logic ...
      return { items: reviews, nextCursor: undefined, totalCount: 0, averageRating: 0 };
    }),

  createReview: protectedProcedure
    .input(ReviewInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      console.log("User: Creating review for product:", input.productId, "by user:", userId);

      // Check if user has purchased this product (optional, for verified reviews)
      // const hasPurchased = await ctx.db.orderItem.findFirst({
      //   where: { order: { userId }, productId: input.productId },
      // });
      // if (!hasPurchased && input.orderItemId) { /* Validate orderItemId belongs to user and product */ }

      // Check if user already reviewed this product (typically one review per product per user)
      const existingReview = await ctx.db.review.findFirst({
          where: { userId, productId: input.productId }
      });
      if (existingReview) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "You have already reviewed this product." });
      }

      const newReview = await ctx.db.review.create({
        data: {
          userId,
          productId: input.productId,
          rating: input.rating,
          title: input.title,
          comment: input.comment,
          // isVerifiedPurchase: !!hasPurchased, // Set based on purchase check
          status: "PENDING", // Default to pending for moderation
        },
      });
      return newReview;
    }),

  toggleHelpfulReview: protectedProcedure
    .input(z.object({ reviewId: z.string(), helpful: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
        console.log("User: Toggling helpful status for review:", input.reviewId);
        // Placeholder: This needs more complex logic to track who voted, prevent multiple votes by same user.
        // Usually involves a separate junction table like UserReviewVote (userId, reviewId, voteType).
        if (input.helpful) {
            await ctx.db.review.update({ where: {id: input.reviewId}, data: { helpfulCount: {increment: 1}}});
        } else {
            await ctx.db.review.update({ where: {id: input.reviewId}, data: { notHelpfulCount: {increment: 1}}});
        }
        return { success: true };
    }),
});