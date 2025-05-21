// src/server/api/routers/newsletter.ts
import { createTRPCRouter, publicProcedure, adminProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { type Prisma } from "@prisma/client";

export const newsletterRouter = createTRPCRouter({
  subscribe: publicProcedure
    .input(z.object({
      email: z.string().email({ message: "Invalid email address." }),
      name: z.string().optional(),
      source: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { email, name, source } = input;

      const existingSubscriber = await ctx.db.newsletterSubscriber.findUnique({
        where: { email },
      });

      if (existingSubscriber) {
        if (existingSubscriber.active) {
          return { success: true, status: "already_subscribed", message: "You are already subscribed to our newsletter!" };
        } else {
          const updatedSubscriber = await ctx.db.newsletterSubscriber.update({
            where: { email },
            data: { 
              active: true, 
              name: name ?? existingSubscriber.name, 
              source: source ?? existingSubscriber.source,
            },
          });
          return { success: true, status: "reactivated", message: "Welcome back! You've been resubscribed.", subscriber: updatedSubscriber };
        }
      } else {
        const newSubscriber = await ctx.db.newsletterSubscriber.create({
          data: {
            email,
            name,
            active: true,
            source: source ?? "website_form",
          },
        });
        return { success: true, status: "subscribed", message: "Thank you for subscribing to our newsletter!", subscriber: newSubscriber };
      }
    }),

  getAllSubscribers: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).optional().default(20),
      cursor: z.string().optional(),
      search: z.string().optional(),
      active: z.boolean().optional(),
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
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                 const targetFields = error.meta?.target as string[] | undefined;
                 if (targetFields?.includes('email')) { // More robust check
                    throw new TRPCError({ code: "BAD_REQUEST", message: "This email address is already in use by another subscriber." });
                 }
            }
            console.error("Failed to update subscriber:", error); // Generic log for other errors
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update subscriber." });
        }
    }),
  
  unsubscribe: publicProcedure
    .input(z.object({ email: z.string().email(), token: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      // For a public unsubscribe link from an email, a token system is crucial for security.
      // This simple version is suitable if, for example, a user unsubscribes from their account settings page.
      // if (input.token) { /* validate token */ }
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