// src/server/api/routers/newsletter.ts
import { createTRPCRouter, publicProcedure, adminProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { type Prisma } from "@prisma/client"; // For types if needed

export const newsletterRouter = createTRPCRouter({
  /**
   * Allows a user to subscribe to the newsletter.
   * If the email already exists and is inactive, it reactivates the subscription.
   * If already active, it informs the user.
   */
  subscribe: publicProcedure
    .input(z.object({
      email: z.string().email({ message: "Invalid email address." }),
      name: z.string().optional(), // Optional name field
      source: z.string().optional(), // Optional: where did the subscription come from?
    }))
    .mutation(async ({ ctx, input }) => {
      const { email, name, source } = input;

      const existingSubscriber = await ctx.db.newsletterSubscriber.findUnique({
        where: { email },
      });

      if (existingSubscriber) {
        if (existingSubscriber.active) {
          // Already subscribed and active
          return { success: true, status: "already_subscribed", message: "You are already subscribed to our newsletter!" };
        } else {
          // Existing but inactive, so reactivate
          const updatedSubscriber = await ctx.db.newsletterSubscriber.update({
            where: { email },
            data: { 
              active: true, 
              name: name ?? existingSubscriber.name, // Update name if provided, otherwise keep old
              source: source ?? existingSubscriber.source, // Update source if provided
              updatedAt: new Date(), // Explicitly set updatedAt if not auto-updated by Prisma
            },
          });
          // TODO: Potentially send a "Welcome Back" email
          return { success: true, status: "reactivated", message: "Welcome back! You've been resubscribed.", subscriber: updatedSubscriber };
        }
      } else {
        // New subscriber
        const newSubscriber = await ctx.db.newsletterSubscriber.create({
          data: {
            email,
            name,
            active: true,
            source: source ?? "website_form", // Default source
            // interests: [], // Initialize interests if needed
          },
        });
        // TODO: Potentially send a "Welcome & Confirm Subscription" email (double opt-in)
        return { success: true, status: "subscribed", message: "Thank you for subscribing to our newsletter!", subscriber: newSubscriber };
      }
    }),

  /**
   * (Admin) Get all newsletter subscribers with pagination and filtering.
   */
  getAllSubscribers: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).optional().default(20),
      cursor: z.string().optional(), // Subscriber ID for cursor
      search: z.string().optional(), // Search by email or name
      active: z.boolean().optional(), // Filter by active status
    }))
    .query(async ({ ctx, input }) => {
      const { limit, cursor, search, active } = input;
      const where: Prisma.NewsletterSubscriberWhereInput = {};

      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (typeof active === 'boolean') {
        where.active = active;
      }

      const subscribers = await ctx.db.newsletterSubscriber.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where,
        orderBy: { createdAt: 'desc' },
      });

      let nextCursor: string | undefined = undefined;
      if (subscribers.length > limit) {
        const nextItem = subscribers.pop();
        nextCursor = nextItem?.id;
      }
      return { items: subscribers, nextCursor };
    }),
  
  /**
   * (Admin) Manually update a subscriber's status or details.
   */
  updateSubscriber: adminProcedure
    .input(z.object({
        id: z.string(),
        email: z.string().email().optional(),
        name: z.string().nullable().optional(),
        active: z.boolean().optional(),
        interests: z.array(z.string()).optional(),
    }))
    .mutation(async ({ctx, input}) => {
        const { id, ...updateData } = input;
        try {
            const updatedSubscriber = await ctx.db.newsletterSubscriber.update({
                where: {id},
                data: updateData,
            });
            return updatedSubscriber;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002' && error.meta?.target === 'NewsletterSubscriber_email_key') {
                 throw new TRPCError({ code: "BAD_REQUEST", message: "This email address is already in use by another subscriber." });
            }
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update subscriber." });
        }
    }),
  
  /**
   * (Public - if implementing one-click unsubscribe link from email)
   * Needs a token-based verification for security.
   * For simplicity, this is a placeholder for an admin action or a more secure user-facing action.
   */
  unsubscribe: publicProcedure // Or protectedProcedure if user must be logged in to manage via UI
    .input(z.object({ email: z.string().email(), token: z.string().optional() /* For secure unsubscribe links */ }))
    .mutation(async ({ ctx, input }) => {
      // TODO: If using token, validate it first.
      // For now, simple unsubscribe by email (less secure for public endpoint if not tokenized)
      const updatedSubscriber = await ctx.db.newsletterSubscriber.updateMany({
        where: { email: input.email, active: true },
        data: { active: false },
      });
      if (updatedSubscriber.count > 0) {
        return { success: true, message: "You have been unsubscribed." };
      }
      return { success: false, message: "Email not found or already unsubscribed." };
    }),
});