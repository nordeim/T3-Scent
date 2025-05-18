<think>
The user wants me to:
1.  Create a `newsletterRouter.ts` file.
2.  Implement a `subscribe` mutation within it, as implied by `NewsletterForm.tsx`.
3.  Update `src/server/api/root.ts` to include this new `newsletterRouter`.

I need to ensure the `newsletterRouter` has a `subscribe` procedure that takes an email, adds it to the `NewsletterSubscriber` table (handling existing subscribers gracefully), and returns a success/error message.

**Plan:**

**1. Create `src/server/api/routers/newsletter.ts`:**
    *   **Imports:** `createTRPCRouter`, `publicProcedure` (subscribing doesn't require login), `z` for Zod.
    *   **`subscribe` Mutation:**
        *   **Input:** `z.object({ email: z.string().email("Invalid email address."), name: z.string().optional() })`. Adding an optional name field is good practice.
        *   **Logic:**
            *   Check if the email already exists in the `NewsletterSubscriber` table.
            *   If it exists and is `active: true`, return a message like "You are already subscribed!".
            *   If it exists and is `active: false`, update it to `active: true` and return a "Welcome back! You've been resubscribed." message.
            *   If it doesn't exist, create a new `NewsletterSubscriber` record with `active: true`.
            *   Return a success message.
        *   **Error Handling:** Catch potential database errors.
    *   **Admin Procedures (Conceptual Stubs for future):**
        *   `getAllSubscribers` (adminProcedure): Paginated list.
        *   `unsubscribeUser` (adminProcedure): To manually unsubscribe someone.
        *   `exportSubscribers` (adminProcedure): For CSV export.

**2. Update `src/server/api/root.ts`:**
    *   Import the newly created `newsletterRouter`.
    *   Add it to the `appRouter` definition.

**Detailed Logic for `subscribe` mutation:**
When a user subscribes:
```typescript
const existingSubscriber = await ctx.db.newsletterSubscriber.findUnique({
  where: { email: input.email },
});

if (existingSubscriber) {
  if (existingSubscriber.active) {
    // Optional: Could throw a TRPCError with code 'CONFLICT' or return a specific success state
    return { success: true, alreadySubscribed: true, message: "You are already subscribed!" };
  } else {
    // Reactivate existing inactive subscriber
    await ctx.db.newsletterSubscriber.update({
      where: { email: input.email },
      data: { active: true, name: input.name ?? existingSubscriber.name }, // Update name if provided
    });
    return { success: true, reactivated: true, message: "Welcome back! You've been resubscribed." };
  }
} else {
  // Create new subscriber
  await ctx.db.newsletterSubscriber.create({
    data: { email: input.email, name: input.name, active: true, source: "website_form" /* Example source */ },
  });
  return { success: true, newlySubscribed: true, message: "Thank you for subscribing!" };
}
```

This covers the main requirements. I'll make sure the Zod schema is robust and return types are clear.
The `NewsletterForm.tsx` I stubbed previously called `api.newsletter.subscribe.useMutation`, so the path and procedure name match.
</think>

Excellent! Let's add the `newsletterRouter` and integrate it into your tRPC root router. This will provide the backend functionality for your `NewsletterForm.tsx` component.

---
**1. Create `src/server/api/routers/newsletter.ts`**

This file will contain the tRPC router for newsletter-related actions, primarily the subscription logic.

```ts
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
```

---
**2. Update `src/server/api/root.ts`**

Now, import and add the `newsletterRouter` to your main `appRouter`.

```ts
// src/server/api/root.ts
import { createTRPCRouter } from "~/server/api/trpc";
import { productsRouter } from "~/server/api/routers/products";
import { ordersRouter } from "~/server/api/routers/orders";
import { quizRouter } from "~/server/api/routers/quiz"; 
import { recommendationsRouter } from "~/server/api/routers/recommendations";
import { usersRouter } from "~/server/api/routers/users"; 
import { wishlistRouter } from "~/server/api/routers/wishlist"; 
import { reviewsRouter } from "~/server/api/routers/reviews"; 
import { subscriptionsRouter } from "~/server/api/routers/subscriptions"; 
import { loyaltyRouter } from "~/server/api/routers/loyalty"; 
import { smartHomeRouter } from "~/server/api/routers/smartHome"; 
import { notificationsRouter } from "~/server/api/routers/notifications"; 
import { newsletterRouter } from "~/server/api/routers/newsletter"; // IMPORT THE NEW ROUTER

import { adminProductsRouter } from "~/server/api/routers/admin/products";
import { adminOrdersRouter } from "~/server/api/routers/admin/orders";
import { adminUsersRouter } from "~/server/api/routers/admin/users";
import { adminRolesRouter } from "~/server/api/routers/admin/roles";
import { adminAnalyticsRouter } from "~/server/api/routers/admin/analytics";
import { adminInventoryRouter } from "~/server/api/routers/admin/inventory";
import { adminSettingsRouter } from "~/server/api/routers/admin/settings";

export const appRouter = createTRPCRouter({
  // Public/User-facing routers
  products: productsRouter,
  orders: ordersRouter,
  quiz: quizRouter,
  recommendations: recommendationsRouter,
  users: usersRouter,
  wishlist: wishlistRouter,
  reviews: reviewsRouter,
  subscriptions: subscriptionsRouter,
  loyalty: loyaltyRouter,
  smartHome: smartHomeRouter,
  notifications: notificationsRouter,
  newsletter: newsletterRouter, // ADD THE ROUTER HERE

  // Admin-specific routers nested under 'admin'
  admin: createTRPCRouter({
    products: adminProductsRouter,
    orders: adminOrdersRouter,
    users: adminUsersRouter,
    roles: adminRolesRouter,
    analytics: adminAnalyticsRouter,
    inventory: adminInventoryRouter,
    settings: adminSettingsRouter,
  }),
});

export type AppRouter = typeof appRouter;
```

---
**Summary and Conclusion:**

1.  **`src/server/api/routers/newsletter.ts` (New File):**
    *   A new tRPC router has been created specifically for newsletter functionalities.
    *   It includes a `subscribe` public mutation that handles new subscriptions and reactivates existing inactive ones, returning appropriate messages. It accepts an optional `name` and `source`.
    *   Placeholder admin procedures (`getAllSubscribers`, `updateSubscriber`) and a basic `unsubscribe` mutation have been stubbed for future development.
2.  **`src/server/api/root.ts` (Updated):**
    *   The new `newsletterRouter` has been imported.
    *   It has been correctly added to the `appRouter` definition, making its procedures available under the `newsletter` namespace (e.g., `api.newsletter.subscribe`).

With these changes, the `NewsletterForm.tsx` component (which uses `api.newsletter.subscribe.useMutation`) will now have a corresponding backend procedure to call. You can proceed to test the newsletter subscription functionality. Remember to implement any "TODO" items in the `newsletterRouter` like sending confirmation emails for a production-ready feature.
