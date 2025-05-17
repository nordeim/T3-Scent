// src/server/api/routers/subscriptions.ts
import { protectedProcedure, createTRPCRouter } from "~/server/api/trpc";
import { z } from "zod";
import { SubscriptionFrequency, SubscriptionStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export const subscriptionsRouter = createTRPCRouter({
  getUserSubscriptions: protectedProcedure // Active and Paused subscriptions
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      console.log("User: Fetching active subscriptions for user:", userId);
      return ctx.db.productSubscription.findMany({
        where: { userId, status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAUSED] } },
        include: { 
            product: { include: { images: {take: 1, orderBy: {position: 'asc'}} } } 
            // variant: true, // If supporting variant subscriptions
        },
        orderBy: { createdAt: 'desc' },
      });
    }),

  getSubscriptionHistory: protectedProcedure // Cancelled or Expired subscriptions
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      console.log("User: Fetching subscription history for user:", userId);
      return ctx.db.productSubscription.findMany({
        where: { userId, status: { in: [SubscriptionStatus.CANCELLED, SubscriptionStatus.EXPIRED] } },
        include: { product: { include: { images: {take: 1, orderBy: {position: 'asc'}} } } },
        orderBy: { cancelledAt: 'desc' }, // Or updatedAt
      });
    }),
    
  getRecommendedProducts: protectedProcedure // Products suitable for subscription
    .query(async ({ctx}) => {
        console.log("User: Fetching recommended products for subscription");
        // Placeholder: Logic to find products good for subscription
        // e.g., consumables, frequently bought items, items with a "subscribable" flag
        return ctx.db.product.findMany({
            where: { inStock: true, publishedAt: {not: null, lte: new Date()} /* Add more filters */},
            take: 4,
            include: { images: {take: 1, orderBy: {position: 'asc'}} }
        });
    }),

  createSubscription: protectedProcedure
    .input(z.object({
      productId: z.string(),
      variantId: z.string().optional().nullable(),
      frequency: z.nativeEnum(SubscriptionFrequency),
      // startDate: z.date().optional(), // If user can choose start date
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      console.log("User: Creating subscription for user:", userId, "Product:", input.productId);
      // Placeholder:
      // 1. Check product/variant eligibility for subscription
      // 2. Potentially create a Stripe Subscription and store stripeSubscriptionId
      // 3. Calculate nextBillingDate and nextShipDate
      const nextBillingDate = new Date(); // Simplification
      // Add logic based on frequency:
      if (input.frequency === "MONTHLY") nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      // ... other frequencies ...

      return ctx.db.productSubscription.create({
        data: {
          userId,
          productId: input.productId,
          variantId: input.variantId,
          frequency: input.frequency,
          status: SubscriptionStatus.ACTIVE,
          nextBillingDate: nextBillingDate,
          nextShipDate: nextBillingDate, // Assuming ship immediately after billing
          // stripeSubscriptionId: "stripe_sub_id_placeholder",
        },
      });
    }),

  updateSubscription: protectedProcedure
    .input(z.object({
      id: z.string(), // Subscription ID
      frequency: z.nativeEnum(SubscriptionFrequency).optional(),
      nextBillingDate: z.string().datetime().optional(), // Allow changing next billing date
      // variantId: z.string().optional(), // Allow changing variant
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      console.log("User: Updating subscription:", input.id);
      const { id, ...updateData } = input;
      // Placeholder: Update Stripe subscription if frequency/plan changes
      // Recalculate nextShipDate if nextBillingDate changes
      return ctx.db.productSubscription.updateMany({ // updateMany to ensure ownership
        where: { id, userId },
        data: {
            ...updateData,
            nextBillingDate: input.nextBillingDate ? new Date(input.nextBillingDate) : undefined,
            // If nextBillingDate changed, nextShipDate should probably also change
            nextShipDate: input.nextBillingDate ? new Date(input.nextBillingDate) : undefined,
        },
      });
    }),

  pauseSubscription: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      console.log("User: Pausing subscription:", input.id);
      // Placeholder: Pause Stripe subscription if applicable
      return ctx.db.productSubscription.updateMany({
        where: { id: input.id, userId, status: SubscriptionStatus.ACTIVE },
        data: { status: SubscriptionStatus.PAUSED },
      });
    }),

  resumeSubscription: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      console.log("User: Resuming subscription:", input.id);
      // Placeholder: Resume Stripe subscription, recalculate next billing/ship date
      return ctx.db.productSubscription.updateMany({
        where: { id: input.id, userId, status: SubscriptionStatus.PAUSED },
        data: { status: SubscriptionStatus.ACTIVE /*, nextBillingDate: ... */ },
      });
    }),

  cancelSubscription: protectedProcedure
    .input(z.object({ id: z.string(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      console.log("User: Cancelling subscription:", input.id);
      // Placeholder: Cancel Stripe subscription
      return ctx.db.productSubscription.updateMany({
        where: { id: input.id, userId, status: { notIn: [SubscriptionStatus.CANCELLED, SubscriptionStatus.EXPIRED] } },
        data: { status: SubscriptionStatus.CANCELLED, cancelledAt: new Date() },
      });
    }),
    
  skipNextDelivery: protectedProcedure
    .input(z.object({id: z.string()}))
    .mutation(async ({ctx, input}) => {
        const userId = ctx.session.user.id;
        console.log("User: Skipping next delivery for subscription:", input.id);
        // Placeholder:
        // 1. Find current subscription
        // 2. Calculate the *new* nextBillingDate and nextShipDate by advancing one cycle
        // 3. Update Stripe subscription if needed (e.g. if it's usage-based or to skip one invoice)
        // 4. Update local DB record
        // This is complex; for now, just log.
        return {success: true, message: "Next delivery skipped (placeholder)."};
    }),
});