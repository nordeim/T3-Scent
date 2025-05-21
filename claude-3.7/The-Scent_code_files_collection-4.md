# src/server/api/routers/orders.ts
```ts
// src/server/api/routers/orders.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import { nanoid } from "nanoid"; // Ensure nanoid is installed
import { db } from "~/server/db";
import { env } from "~/env.mjs";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16", // Use the API version from your Stripe dashboard or the latest stable.
});

// Helper to get or create Stripe Customer ID and link it to our User
async function getOrCreateStripeCustomerId(userId: string, email: string | null | undefined): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true } // Assuming you add `stripeCustomerId String? @unique` to User model
  });

  if (user?.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // Create a new Stripe customer
  const customer = await stripe.customers.create({
    email: email ?? undefined, // Stripe requires email or name/phone/address
    metadata: {
      userId: userId,
    },
  });

  // Update our User model with the new Stripe Customer ID
  await db.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}


const AddressInputSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"), // Client should send email for guest checkout too
  phone: z.string().optional(),
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State/Province is required"),
  zipCode: z.string().min(1, "ZIP/Postal code is required"),
  country: z.string().min(2, "Country is required"), // Typically 2-letter country code
});

const OrderItemInputSchema = z.object({
  id: z.string(), // Product ID
  variantId: z.string().optional().nullable(),
  quantity: z.number().min(1),
});

export const ordersRouter = createTRPCRouter({
  createPaymentIntent: protectedProcedure
    .input(
      z.object({
        items: z.array(OrderItemInputSchema).min(1, "Cannot create an empty order."),
        shippingMethodId: z.string(), // e.g., "standard", "express"
        shippingAddress: AddressInputSchema, // Assuming this is validated on client and passed
        couponCode: z.string().optional(), // For discounts
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { items, shippingMethodId, shippingAddress, couponCode } = input;
      const userId = ctx.session.user.id;
      const userEmail = ctx.session.user.email;

      const productIds = items.map(item => item.id);
      const productsFromDb = await db.product.findMany({
        where: { id: { in: productIds } },
        include: { variants: true },
      });

      let subtotal = 0;
      const orderItemsDataForMeta = [];

      for (const item of items) {
        const product = productsFromDb.find(p => p.id === item.id);
        if (!product || !product.inStock) { // Also check stock
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Product "${product?.name ?? item.id}" is not available or out of stock.`,
          });
        }

        let price = parseFloat(product.price.toString());
        let stockToCheck = product.stockQuantity;

        if (item.variantId) {
          const variant = product.variants.find(v => v.id === item.variantId);
          if (!variant) {
            throw new TRPCError({ code: "BAD_REQUEST", message: `Variant for product ${product.name} not found.` });
          }
          if (variant.price) price = parseFloat(variant.price.toString());
          stockToCheck = variant.stockQuantity;
        }
        
        if (stockToCheck !== null && stockToCheck < item.quantity) {
            throw new TRPCError({ code: "BAD_REQUEST", message: `Not enough stock for ${product.name}${item.variantId ? ' (variant)' : ''}. Available: ${stockToCheck}` });
        }

        subtotal += price * item.quantity;
        orderItemsDataForMeta.push({ productId: product.id, variantId: item.variantId, quantity: item.quantity, price });
      }

      // TODO: Fetch actual shipping costs and tax rates dynamically, e.g., from SiteSettings or an API
      const shippingMethods: Record<string, { name: string; price: number }> = {
        standard: { name: "Standard Shipping", price: 5.99 },
        express: { name: "Express Shipping", price: 12.99 },
      };
      const shippingCost = shippingMethods[shippingMethodId]?.price ?? 5.99;
      
      // TODO: Apply coupon discount
      let discountAmount = 0;
      if (couponCode) {
        // const coupon = await db.coupon.findUnique({where: {code: couponCode, isActive: true}});
        // if (coupon) { /* apply discount logic */ discountAmount = ... }
        // For now, placeholder:
        if (couponCode === "SAVE10") discountAmount = subtotal * 0.10;
      }

      const subtotalAfterDiscount = subtotal - discountAmount;
      const taxRate = 0.07; // Example 7% tax rate
      const taxAmount = subtotalAfterDiscount * taxRate;
      const total = subtotalAfterDiscount + shippingCost + taxAmount;

      if (total <= 0.50) { // Stripe minimum charge is $0.50
          throw new TRPCError({ code: "BAD_REQUEST", message: "Order total is too low." });
      }

      const stripeCustomerId = await getOrCreateStripeCustomerId(userId, userEmail);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100), // Amount in cents
        currency: "usd", // Consider making this dynamic based on SiteSettings or LocalizationContext
        customer: stripeCustomerId,
        receipt_email: shippingAddress.email, // Use the provided email for receipt
        shipping: { // Provide shipping details to Stripe for fraud protection & address on receipt
          name: shippingAddress.fullName,
          address: {
            line1: shippingAddress.addressLine1,
            line2: shippingAddress.addressLine2 ?? undefined,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postal_code: shippingAddress.zipCode,
            country: shippingAddress.country,
          },
          phone: shippingAddress.phone ?? undefined,
        },
        metadata: {
          userId,
          orderItems: JSON.stringify(orderItemsDataForMeta),
          shippingMethodId,
          shippingAddress: JSON.stringify(shippingAddress), // Store for order creation
          subtotal: subtotal.toFixed(2),
          shippingCost: shippingCost.toFixed(2),
          taxAmount: taxAmount.toFixed(2),
          discountAmount: discountAmount.toFixed(2),
          total: total.toFixed(2),
          couponCode: couponCode ?? "",
        },
      });

      if (!paymentIntent.client_secret) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create Stripe Payment Intent." });
      }
      
      return { clientSecret: paymentIntent.client_secret };
    }),

  createOrder: protectedProcedure // This should be called by a webhook after successful payment, or client-side for simple cases.
                                 // The doc 2 `checkout.tsx` calls this client-side on payment success.
    .input(
      z.object({
        paymentIntentId: z.string(),
        // Shipping address and method ID are now in metadata, but can be passed for verification
        // shippingAddress: AddressInputSchema, 
        // shippingMethodId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { paymentIntentId } = input;
      const userId = ctx.session.user.id;

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ["customer"] });

      if (paymentIntent.metadata.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Payment intent does not belong to this user." });
      }
      if (paymentIntent.status !== "succeeded") {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Payment not succeeded. Status: ${paymentIntent.status}` });
      }

      // Check if order already exists for this paymentIntentId
      const existingOrder = await db.order.findUnique({ where: { paymentIntentId } });
      if (existingOrder) {
        console.warn(`Order already exists for paymentIntentId: ${paymentIntentId}. Returning existing order.`);
        return { id: existingOrder.id, orderNumber: existingOrder.orderNumber };
      }
      
      const parsedOrderItemsMeta = JSON.parse(paymentIntent.metadata.orderItems || "[]") as { productId: string; variantId: string | null; quantity: number; price: number }[];
      const shippingAddressMeta = JSON.parse(paymentIntent.metadata.shippingAddress || "{}") as z.infer<typeof AddressInputSchema>;
      const shippingMethodIdMeta = paymentIntent.metadata.shippingMethodId || "standard";
      const subtotalMeta = parseFloat(paymentIntent.metadata.subtotal || "0");
      const shippingCostMeta = parseFloat(paymentIntent.metadata.shippingCost || "0");
      const taxAmountMeta = parseFloat(paymentIntent.metadata.taxAmount || "0");
      const discountAmountMeta = parseFloat(paymentIntent.metadata.discountAmount || "0");
      const totalMeta = parseFloat(paymentIntent.metadata.total || "0");
      // const couponCodeMeta = paymentIntent.metadata.couponCode;


      const productDetailsForOrder = await db.product.findMany({
        where: { id: { in: parsedOrderItemsMeta.map(item => item.productId) } },
        include: { images: { take: 1, orderBy: {position: 'asc'} }, variants: true },
      });

      const orderNumber = `SCNT-${nanoid(8).toUpperCase()}`;

      const createdOrder = await db.order.create({
        data: {
          userId,
          orderNumber,
          status: "PAID", // Or PROCESSING if further steps needed
          subtotal: subtotalMeta,
          shippingCost: shippingCostMeta,
          tax: taxAmountMeta,
          discountAmount: discountAmountMeta,
          total: totalMeta,
          shippingAddress: shippingAddressMeta, // Storing the JSON directly
          // billingAddress: billingAddressMeta, // If collected separately
          paymentMethod: paymentIntent.payment_method_types[0] ?? "card",
          paymentIntentId,
          currency: paymentIntent.currency.toUpperCase(),
          shippingMethod: shippingMethodIdMeta,
          // notes: customerNotes, // If collected
          orderItems: {
            create: parsedOrderItemsMeta.map(item => {
              const product = productDetailsForOrder.find(p => p.id === item.productId);
              const variant = item.variantId ? product?.variants.find(v => v.id === item.variantId) : null;
              const currentPrice = item.price; // Price from metadata, locked at time of PI creation

              const productDataSnapshot = {
                id: product?.id,
                name: product?.name,
                sku: variant?.sku ?? product?.sku,
                price: currentPrice,
                imageUrl: variant?.imageUrl ?? product?.images[0]?.url,
                options: variant?.options,
              };

              return {
                productId: item.productId,
                variantId: item.variantId,
                name: product?.name ?? "Unknown Product",
                sku: variant?.sku ?? product?.sku,
                price: currentPrice,
                quantity: item.quantity,
                subtotal: currentPrice * item.quantity,
                imageUrl: variant?.imageUrl ?? product?.images[0]?.url,
                productData: productDataSnapshot,
              };
            }),
          },
          history: {
            create: {
              status: "PAID",
              comment: `Payment successful via Stripe. Amount: ${formatCurrency(totalMeta, paymentIntent.currency)}.`,
              createdBy: userId,
            },
          },
        },
      });

      // Update inventory (critical step, needs to be robust)
      for (const item of parsedOrderItemsMeta) {
        if (item.variantId) {
          await db.productVariant.update({
            where: { id: item.variantId },
            data: { stockQuantity: { decrement: item.quantity } },
          });
        } else {
          await db.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { decrement: item.quantity } },
          });
        }
        // TODO: Update overall product.inStock if stockQuantity becomes 0
      }

      // TODO: Send order confirmation email
      // TODO: Create notification for user
      await db.notification.create({
        data: {
          userId,
          type: "ORDER_CONFIRMATION",
          title: "Order Confirmed!",
          message: `Your order #${createdOrder.orderNumber} for ${formatCurrency(totalMeta, paymentIntent.currency)} has been placed.`,
          link: `/account/orders/${createdOrder.id}`,
          data: { orderId: createdOrder.id, orderNumber: createdOrder.orderNumber },
        },
      });
      
      // TODO: Award loyalty points
      // if (ctx.session.user.id && totalMeta > 0) {
      //   await awardLoyaltyPoints(ctx.session.user.id, createdOrder.id, totalMeta);
      // }

      return { id: createdOrder.id, orderNumber: createdOrder.orderNumber };
    }),
  
  getUserOrders: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).optional().default(10),
        cursor: z.string().optional(), // Order ID for cursor
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;
      const userId = ctx.session.user.id;

      const orders = await db.order.findMany({
        where: { userId },
        include: {
          orderItems: { // Include a few items for preview on the list page
            take: 3,
            select: { id: true, name: true, imageUrl: true, quantity: true }
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (orders.length > limit) {
        const nextItem = orders.pop();
        nextCursor = nextItem?.id;
      }
      
      // Convert decimal fields for client
      const clientOrders = orders.map(order => ({
        ...order,
        subtotal: parseFloat(order.subtotal.toString()),
        shippingCost: parseFloat(order.shippingCost.toString()),
        tax: parseFloat(order.tax.toString()),
        discountAmount: parseFloat(order.discountAmount.toString()),
        total: parseFloat(order.total.toString()),
        refundAmount: order.refundAmount ? parseFloat(order.refundAmount.toString()) : null,
      }));

      return { orders: clientOrders, nextCursor };
    }),

  getOrderById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await db.order.findUnique({
        where: { id: input.id },
        include: {
          orderItems: {
            include: {
              // Include product/variant for linking, though productData snapshot is primary source
              product: { select: { slug: true, images: { take: 1, orderBy: { position: 'asc' }} } }, 
              variant: { select: { name: true, options: true } },
            }
          },
          history: { orderBy: { createdAt: "desc" } },
          user: { select: { name: true, email: true } }, // For admin view if needed
        },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
      }
      if (order.userId !== ctx.session.user.id && ctx.session.user.role !== "ADMIN" && ctx.session.user.role !== "MANAGER") {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to view this order." });
      }
      
      // Convert decimal fields
      return {
        ...order,
        subtotal: parseFloat(order.subtotal.toString()),
        shippingCost: parseFloat(order.shippingCost.toString()),
        tax: parseFloat(order.tax.toString()),
        discountAmount: parseFloat(order.discountAmount.toString()),
        total: parseFloat(order.total.toString()),
        refundAmount: order.refundAmount ? parseFloat(order.refundAmount.toString()) : null,
        orderItems: order.orderItems.map(item => ({
            ...item,
            price: parseFloat(item.price.toString()),
            subtotal: parseFloat(item.subtotal.toString()),
        })),
      };
    }),

  cancelOrder: protectedProcedure
    .input(z.object({ id: z.string(), reason: z.string().min(5, "Reason must be at least 5 characters").optional() }))
    .mutation(async ({ ctx, input }) => {
      const { id, reason } = input;
      const userId = ctx.session.user.id;

      const order = await db.order.findUnique({ where: { id } });

      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      if (order.userId !== userId && ctx.session.user.role !== "ADMIN" && ctx.session.user.role !== "MANAGER") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (!["PENDING", "PROCESSING", "PAID", "ON_HOLD"].includes(order.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Order in status ${order.status} cannot be cancelled.` });
      }

      // TODO: Add logic for refunding payment via Stripe if order was 'PAID'
      // const paymentIntentId = order.paymentIntentId;
      // if (order.status === "PAID" && paymentIntentId) {
      //   try {
      //     await stripe.refunds.create({ payment_intent: paymentIntentId, reason: 'requested_by_customer', metadata: { orderId: order.id } });
      //   } catch (stripeError: any) {
      //     throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Stripe refund failed: ${stripeError.message}` });
      //   }
      // }

      // TODO: Add logic to restock items

      const updatedOrder = await db.order.update({
        where: { id },
        data: {
          status: "CANCELLED",
          cancelReason: reason ?? "Cancelled by user/admin.",
          history: {
            create: {
              status: "CANCELLED",
              comment: `Order cancelled. ${reason ? `Reason: ${reason}` : ''}`,
              createdBy: userId,
            },
          },
        },
      });
      
      // TODO: Send order cancellation email/notification
      
      return updatedOrder;
    }),
});

// Helper function to format currency (could be moved to a utils file)
const formatCurrency = (amount: number, currencyCode = 'usd') => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode.toUpperCase() }).format(amount);
};

```

# src/server/api/routers/wishlist.ts
```ts
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
```

# src/server/api/routers/notifications.ts
```ts
// src/server/api/routers/notifications.ts
import { protectedProcedure, createTRPCRouter } from "~/server/api/trpc";
import { z } from "zod";
import { type Notification as PrismaNotification } from "@prisma/client";

export const notificationsRouter = createTRPCRouter({
  getNotifications: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).optional().default(10),
      cursor: z.string().optional(), // Notification ID for cursor
      unreadOnly: z.boolean().optional().default(false),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      console.log("User: Fetching notifications for user:", userId, "Input:", input);
      
      const whereCondition: Prisma.NotificationWhereInput = { userId };
      if (input.unreadOnly) {
        whereCondition.isRead = false;
      }

      const notifications = await ctx.db.notification.findMany({
        where: whereCondition,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: 'desc' },
      });

      let nextCursor: string | undefined = undefined;
      if (notifications.length > input.limit) {
        const nextItem = notifications.pop();
        nextCursor = nextItem?.id;
      }
      
      const unreadCount = await ctx.db.notification.count({
          where: { userId, isRead: false }
      });

      return { items: notifications, nextCursor, unreadCount };
    }),

  markAsRead: protectedProcedure
    .input(z.object({ 
      notificationId: z.string().optional(),
      markAllAsRead: z.boolean().optional().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      if (input.markAllAsRead) {
        console.log("User: Marking all notifications as read for user:", userId);
        await ctx.db.notification.updateMany({
          where: { userId, isRead: false },
          data: { isRead: true, readAt: new Date() },
        });
        return { success: true, message: "All notifications marked as read." };
      } else if (input.notificationId) {
        console.log("User: Marking notification as read:", input.notificationId);
        await ctx.db.notification.updateMany({ // Use updateMany to avoid error if already read by another client
          where: { id: input.notificationId, userId },
          data: { isRead: true, readAt: new Date() },
        });
        return { success: true, message: `Notification ${input.notificationId} marked as read.` };
      }
      return { success: false, message: "No action taken." };
    }),

  deleteNotification: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      console.log("User: Deleting notification:", input.notificationId, "for user:", userId);
      await ctx.db.notification.deleteMany({ // deleteMany to ensure ownership
          where: { id: input.notificationId, userId }
      });
      return { success: true, message: `Notification ${input.notificationId} deleted.` };
    }),
});
```

# src/server/api/routers/products.ts
```ts
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

```

# src/server/api/routers/users.ts
```ts
// src/server/api/routers/users.ts
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
// import { hash, compare } from "bcryptjs"; // If handling password changes

const AddressInputSchema = z.object({ // Consistent with orders router
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional().nullable(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State/Province is required"),
  postalCode: z.string().min(1, "ZIP/Postal code is required"),
  country: z.string().min(2, "Country is required"),
  phoneNumber: z.string().optional().nullable(),
  addressType: z.enum(["SHIPPING", "BILLING"]), // Ensure this matches Prisma enum
  isDefaultShipping: z.boolean().optional(),
  isDefaultBilling: z.boolean().optional(),
});

export const usersRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const user = await ctx.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true, // Simple role
        definedRole: { select: { name: true, description: true } }, // Advanced role
        createdAt: true,
        // Do not select password or other sensitive fields
      },
    });
    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User profile not found." });
    }
    return user;
  }),

  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(1, "Name cannot be empty").optional(),
      image: z.string().url("Invalid image URL").nullable().optional(),
      // Add other updatable fields like bio, preferences etc.
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return ctx.db.user.update({
        where: { id: userId },
        data: {
          ...(input.name && { name: input.name }),
          // Handle image: if input.image is undefined, don't change; if null, clear it; if string, set it.
          ...(input.image !== undefined && { image: input.image }),
        },
        select: { id: true, name: true, email: true, image: true }, // Return updated, non-sensitive fields
      });
    }),

  // --- Address Management ---
  getAddresses: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.address.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: [{ isDefaultShipping: 'desc'}, { isDefaultBilling: 'desc'}, { id: 'asc' }],
    });
  }),

  addAddress: protectedProcedure
    .input(AddressInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      // If setting as default, unset other defaults for that type
      if (input.isDefaultShipping) {
        await ctx.db.address.updateMany({ where: { userId, isDefaultShipping: true }, data: { isDefaultShipping: false }});
      }
      if (input.isDefaultBilling) {
        await ctx.db.address.updateMany({ where: { userId, isDefaultBilling: true }, data: { isDefaultBilling: false }});
      }
      return ctx.db.address.create({ data: { ...input, userId } });
    }),

  updateAddress: protectedProcedure
    .input(AddressInputSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { id, ...addressData } = input;
      // If setting as default, unset other defaults for that type, excluding the current address being updated
      if (addressData.isDefaultShipping) {
        await ctx.db.address.updateMany({ where: { userId, isDefaultShipping: true, NOT: {id} }, data: { isDefaultShipping: false }});
      }
      if (addressData.isDefaultBilling) {
        await ctx.db.address.updateMany({ where: { userId, isDefaultBilling: true, NOT: {id} }, data: { isDefaultBilling: false }});
      }
      return ctx.db.address.updateMany({ // updateMany to ensure ownership
        where: { id, userId },
        data: addressData,
      });
    }),

  deleteAddress: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.address.deleteMany({ // deleteMany to ensure ownership
        where: { id: input.id, userId: ctx.session.user.id },
      });
      return { success: true };
    }),
    
  // Example: Get default shipping address (used in checkout)
  getDefaultShippingAddress: protectedProcedure
    .query(async ({ctx}) => {
        return ctx.db.address.findFirst({
            where: { userId: ctx.session.user.id, isDefaultShipping: true }
        });
    }),
    
  // TODO: Add procedures for password change, email change (with verification) if needed.
});
```

# src/server/api/routers/post.ts
```ts
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.post.create({
        data: {
          name: input.name,
          createdBy: { connect: { id: ctx.session.user.id } },
        },
      });
    }),

  getLatest: protectedProcedure.query(async ({ ctx }) => {
    const post = await ctx.db.post.findFirst({
      orderBy: { createdAt: "desc" },
      where: { createdBy: { id: ctx.session.user.id } },
    });

    return post ?? null;
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});

```

# src/server/api/routers/recommendations.ts
```ts
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

```

# src/server/auth.ts
```ts
// src/server/auth.ts
import NextAuth, { type DefaultSession, type User as NextAuthUser } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { db } from "~/server/db";
import { compare } from "bcryptjs";
import { env } from "~/env.js";
import type { Role as PrismaAppRole } from "@prisma/client";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: PrismaAppRole;
      roleDefinitionId?: string | null;
    } & DefaultSession["user"];
  }
  interface User extends NextAuthUser {
    role: PrismaAppRole;
    roleDefinitionId?: string | null;
  }
}

declare module "@auth/core/jwt" { // For NextAuth.js v5 beta, path might be this or 'next-auth/jwt'
  interface JWT {
    id: string;
    role: PrismaAppRole;
    roleDefinitionId?: string | null;
  }
}

// Define the configuration object. It's not strictly necessary to export this
// if only `handlers`, `auth`, `signIn`, `signOut` are needed externally.
const authConfigInternal = {
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID || "",
      clientSecret: env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email as string;
        const password = credentials.password as string;
        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;
        const isValid = await compare(password, user.password);
        if (!isValid) return null;
        return { 
            id: user.id, 
            name: user.name, 
            email: user.email, 
            image: user.image,
            role: user.role, 
            roleDefinitionId: user.roleDefinitionId 
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }: { token: any; user: any }) => { // Use `any` for broader compatibility with v5 beta variations
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.roleDefinitionId = user.roleDefinitionId;
        // OAuth providers usually add name, email, picture to token automatically
      }
      return token;
    },
    session: ({ session, token }: { session: any; token: any }) => {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.roleDefinitionId = token.roleDefinitionId;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    // newUser: "/auth/welcome", // Optional: redirect new OAuth users
  },
  trustHost: env.AUTH_TRUST_HOST,
  // secret: env.AUTH_SECRET, // Auth.js v5 uses AUTH_SECRET from env automatically
} satisfies Parameters<typeof NextAuth>[0];

// Export handlers, auth, signIn, signOut
export const { handlers, auth, signIn, signOut } = NextAuth(authConfigInternal);

// If you truly need to export the config itself for some other advanced reason:
// export const authConfig = authConfigInternal;
```

# src/contexts/NotificationsContext.tsx
```tsx
// src/contexts/NotificationsContext.tsx
"use client";

import React, { createContext, useContext, useState, type ReactNode, useCallback } from 'react';
import type { Notification as PrismaNotification } from "@prisma/client"; // Assuming Prisma type
import { api } from '~/utils/api'; // For tRPC calls

// Extend PrismaNotification if needed, e.g., for client-side state
export interface AppNotification extends Omit<PrismaNotification, 'createdAt' | 'readAt'> {
  createdAt: string; // Store dates as strings or Date objects client-side
  readAt?: string | null;
}

interface NotificationsContextType {
  notifications: AppNotification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  isLoading: boolean;
  // addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'userId' | 'isRead'>) => void; // For client-side adding (e.g. after an action)
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export const useNotifications = (): NotificationsContextType => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

interface NotificationsProviderProps {
  children: ReactNode;
}

export const NotificationsProvider = ({ children }: NotificationsProviderProps) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Example using tRPC query (actual query name might differ)
  // const getNotificationsQuery = api.notifications.getNotifications.useQuery(undefined, {
  //   enabled: false, // Manually fetch
  //   onSuccess: (data) => {
  //     const processedNotifications = data.items.map(n => ({
  //       ...n,
  //       createdAt: n.createdAt.toISOString(), // Convert Date to string
  //       readAt: n.readAt?.toISOString(),
  //     }))
  //     setNotifications(processedNotifications);
  //     setUnreadCount(data.unreadCount);
  //     setIsLoading(false);
  //   },
  //   onError: () => setIsLoading(false),
  // });

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    // await getNotificationsQuery.refetch();
    // Placeholder:
    console.log("Fetching notifications...");
    // Simulate API call
    setTimeout(() => {
        // Replace with actual API call: e.g. const data = await api.notifications.get.query();
        // setNotifications(data.items);
        // setUnreadCount(data.unreadCount);
        setIsLoading(false);
    }, 1000);
  }, [/* getNotificationsQuery */]);

  const markAsRead = useCallback(async (notificationId: string) => {
    // Placeholder: Call tRPC mutation
    // await api.notifications.markAsRead.mutate({ notificationId });
    setNotifications(prev => 
      prev.map(n => n.id === notificationId && !n.isRead ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
    );
    setUnreadCount(prev => (notifications.find(n => n.id === notificationId && !n.isRead) ? Math.max(0, prev - 1) : prev));
    console.log(`Notification ${notificationId} marked as read.`);
  }, [notifications]);

  const markAllAsRead = useCallback(async () => {
    // Placeholder: Call tRPC mutation
    // await api.notifications.markAllAsRead.mutate();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
    setUnreadCount(0);
    console.log("All notifications marked as read.");
  }, []);

  // Effect to fetch notifications on mount (if user is logged in)
  // This depends on how session is checked; often done after session is available.
  // useEffect(() => {
  //   fetchNotifications();
  // }, [fetchNotifications]);

  return (
    <NotificationsContext.Provider value={{ 
        notifications, 
        unreadCount, 
        fetchNotifications, 
        markAsRead, 
        markAllAsRead,
        isLoading 
    }}>
      {children}
    </NotificationsContext.Provider>
  );
};
```

# src/contexts/CartContext.tsx
```tsx
// src/contexts/CartContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useCallback,
} from "react";
import { toast } from "react-hot-toast"; // For user feedback

export interface CartItem {
  id: string; // Product ID
  variantId?: string | null; // ProductVariant ID
  name: string;
  price: number; // Price of the item (considering variant if applicable)
  imageUrl?: string | null;
  quantity: number;
  variantName?: string; // e.g., "Size L, Color Red"
  // Potentially add slug for linking back to product page easily
  slug?: string; 
}

interface CartContextType {
  items: CartItem[];
  addItem: (itemToAdd: Omit<CartItem, 'quantity'> & { quantity?: number }) => void; // Allow adding with specific quantity
  removeItem: (productId: string, variantId?: string | null) => void;
  updateQuantity: (productId: string, variantId: string | null | undefined, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  total: number;
  isCartOpen: boolean;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getItem: (productId: string, variantId?: string | null) => CartItem | undefined;
}

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

const CART_STORAGE_KEY = "the-scent-cart";

export const CartProvider = ({ children }: CartProviderProps) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false); // To prevent hydration issues

  // Load cart from localStorage on initial client-side render
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart) as CartItem[];
        // Basic validation for parsed cart items
        if (Array.isArray(parsedCart) && parsedCart.every(item => typeof item.id === 'string' && typeof item.quantity === 'number')) {
            setItems(parsedCart);
        } else {
            localStorage.removeItem(CART_STORAGE_KEY); // Clear invalid cart
        }
      } catch (error) {
        console.error("Failed to parse cart from localStorage:", error);
        localStorage.removeItem(CART_STORAGE_KEY); // Clear corrupted cart
      }
    }
    setIsInitialized(true);
  }, []);

  // Save cart to localStorage whenever it changes, only if initialized
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isInitialized]);

  const addItem = useCallback((itemToAdd: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems((prevItems) => {
      const quantityToAdd = itemToAdd.quantity ?? 1;
      const existingItemIndex = prevItems.findIndex(
        (i) => i.id === itemToAdd.id && i.variantId === itemToAdd.variantId
      );

      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        const existingItem = updatedItems[existingItemIndex]!;
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + quantityToAdd,
        };
        toast.success(`${itemToAdd.name} quantity updated in cart!`);
        return updatedItems;
      } else {
        toast.success(`${itemToAdd.name} added to cart!`);
        return [...prevItems, { ...itemToAdd, quantity: quantityToAdd }];
      }
    });
    openCart(); // Open cart sidebar/modal on add
  }, []);

  const removeItem = useCallback((productId: string, variantId?: string | null) => {
    setItems((prevItems) => {
      const itemToRemove = prevItems.find(item => item.id === productId && item.variantId === variantId);
      if (itemToRemove) {
        toast.error(`${itemToRemove.name} removed from cart.`);
      }
      return prevItems.filter(
        (item) => !(item.id === productId && item.variantId === variantId)
      );
    });
  }, []);

  const updateQuantity = useCallback((productId: string, variantId: string | null | undefined, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, variantId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId && item.variantId === variantId
          ? { ...item, quantity }
          : item
      )
    );
    // toast.info(`Quantity updated.`); // Can be a bit noisy
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    toast.success("Cart cleared!");
  }, []);

  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const toggleCart = useCallback(() => setIsCartOpen(prev => !prev), []);
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const getItem = useCallback((productId: string, variantId?: string | null) => {
    return items.find(item => item.id === productId && item.variantId === (variantId ?? undefined));
  }, [items]);


  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        total,
        isCartOpen,
        toggleCart,
        openCart,
        closeCart,
        getItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
```

# src/contexts/LocalizationContext.tsx
```tsx
// src/contexts/LocalizationContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useCallback,
} from "react";
import { useRouter } // Removed 'usePathname' as it might not be immediately necessary and adds complexity
  from "next/navigation"; // Use from next/navigation for App Router
import { useLocalStorage } from "~/hooks/useLocalStorage"; // Assuming this hook exists
import { toast } from "react-hot-toast";

// Define types for Currency and Language
export type Currency = {
  code: string; // e.g., "USD"
  symbol: string; // e.g., "$"
  name: string; // e.g., "US Dollar"
  // exchangeRate might be fetched dynamically in a real app
  // For simplicity, we can include a base rate if needed, or manage rates elsewhere
  exchangeRateToBase: number; // e.g., 1 for USD (base), 0.93 for EUR if USD is base
};

export type Language = {
  code: string; // e.g., "en"
  name: string; // e.g., "English"
  flag?: string; // Optional: e.g., "🇺🇸"
  // direction?: "ltr" | "rtl"; // Optional for RTL languages
};

// Define the shape of the context data
interface LocalizationContextType {
  language: string;
  setLanguage: (code: string) => void;
  currency: Currency;
  setCurrency: (currencyCode: string) => void;
  formatPrice: (priceInBaseCurrency: number, targetCurrencyCode?: string) => string;
  availableLanguages: Language[];
  availableCurrencies: Currency[];
  translations: Record<string, string>; // Simple key-value for translations
  t: (key: string, params?: Record<string, string | number>) => string; // Translation function
  isLoadingTranslations: boolean;
}

// --- Configuration Data (Ideally, this could come from SiteSettings or an API) ---
const DEFAULT_LANGUAGE_CODE = "en";
const DEFAULT_CURRENCY_CODE = "USD";

const AVAILABLE_LANGUAGES: Language[] = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  // Add more languages as needed
];

const AVAILABLE_CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", name: "US Dollar", exchangeRateToBase: 1 },
  { code: "EUR", symbol: "€", name: "Euro", exchangeRateToBase: 0.92 }, // Example rate
  { code: "GBP", symbol: "£", name: "British Pound", exchangeRateToBase: 0.79 }, // Example rate
  // Add more currencies as needed
];
// --- End Configuration Data ---

const LocalizationContext = createContext<LocalizationContextType | null>(null);

export const useLocalization = (): LocalizationContextType => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error("useLocalization must be used within a LocalizationProvider");
  }
  return context;
};

interface LocalizationProviderProps {
  children: ReactNode;
  // initialLocale?: string; // Could be passed from server component if detecting user locale
}

export const LocalizationProvider = ({ children }: LocalizationProviderProps) => {
  const router = useRouter();
  // const pathname = usePathname(); // For locale update in URL if using Next.js i18n routing

  const [storedLanguage, setStoredLanguage] = useLocalStorage<string>("appLanguage", DEFAULT_LANGUAGE_CODE);
  const [storedCurrencyCode, setStoredCurrencyCode] = useLocalStorage<string>("appCurrency", DEFAULT_CURRENCY_CODE);

  const [language, setLanguageState] = useState<string>(storedLanguage);
  const [currency, setCurrencyState] = useState<Currency>(
    AVAILABLE_CURRENCIES.find(c => c.code === storedCurrencyCode) || AVAILABLE_CURRENCIES[0]!
  );
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(true);

  // Load translations when language changes
  useEffect(() => {
    const loadTranslationsForLang = async (langCode: string) => {
      setIsLoadingTranslations(true);
      try {
        // Simulate fetching translations. In a real app, you'd fetch a JSON file or use an i18n library.
        // e.g., const response = await fetch(`/locales/${langCode}.json`);
        // const data = await response.json();
        let loadedTranslations: Record<string, string> = {};
        // This is a placeholder. Use a proper i18n solution like `next-intl` or `react-i18next`.
        if (langCode === "es") {
          loadedTranslations = { "welcomeMessage": "Bienvenido a The Scent!", "products": "Productos" };
        } else if (langCode === "fr") {
          loadedTranslations = { "welcomeMessage": "Bienvenue à The Scent!", "products": "Produits" };
        } else { // Default (en) or fallback
          loadedTranslations = { "welcomeMessage": "Welcome to The Scent!", "products": "Products" };
        }
        setTranslations(loadedTranslations);
      } catch (error) {
        console.error(`Failed to load translations for ${langCode}:`, error);
        setTranslations({}); // Fallback to empty or default keys
      } finally {
        setIsLoadingTranslations(false);
      }
    };
    loadTranslationsForLang(language).catch(console.error);
  }, [language]);

  const selectLanguage = useCallback((code: string) => {
    const selectedLang = AVAILABLE_LANGUAGES.find(lang => lang.code === code);
    if (selectedLang) {
      setLanguageState(selectedLang.code);
      setStoredLanguage(selectedLang.code);
      // Optional: Update HTML lang attribute
      document.documentElement.lang = selectedLang.code;
      // Optional: If using Next.js built-in i18n routing, navigate to the new locale path
      // router.push(pathname, { locale: selectedLang.code }); // This requires Next.js i18n setup
      toast.success(`Language changed to ${selectedLang.name}`);
    } else {
      console.warn(`Attempted to set unsupported language: ${code}`);
    }
  }, [setStoredLanguage, router /*, pathname (if using for i18n routing) */]);

  const selectCurrency = useCallback((currencyCode: string) => {
    const selectedCurr = AVAILABLE_CURRENCIES.find(c => c.code === currencyCode);
    if (selectedCurr) {
      setCurrencyState(selectedCurr);
      setStoredCurrencyCode(selectedCurr.code);
      toast.success(`Currency changed to ${selectedCurr.name} (${selectedCurr.symbol})`);
    } else {
      console.warn(`Attempted to set unsupported currency: ${currencyCode}`);
    }
  }, [setStoredCurrencyCode]);

  const formatPrice = useCallback((priceInBaseCurrency: number, targetCurrencyCode?: string): string => {
    const targetCurrency = targetCurrencyCode
      ? AVAILABLE_CURRENCIES.find(c => c.code === targetCurrencyCode) || currency
      : currency;
    
    const convertedPrice = priceInBaseCurrency * targetCurrency.exchangeRateToBase;

    try {
      return new Intl.NumberFormat(language, { // Use current language for formatting locale
        style: 'currency',
        currency: targetCurrency.code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(convertedPrice);
    } catch (error) {
      console.error("Error formatting price:", error);
      // Fallback formatting
      return `${targetCurrency.symbol}${convertedPrice.toFixed(2)}`;
    }
  }, [currency, language]);

  const translate = useCallback((key: string, params?: Record<string, string | number>): string => {
    let text = translations[key] || key; // Fallback to key if translation not found
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        text = text.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
      });
    }
    return text;
  }, [translations]);

  const contextValue: LocalizationContextType = {
    language,
    setLanguage: selectLanguage,
    currency,
    setCurrency: selectCurrency,
    formatPrice,
    availableLanguages: AVAILABLE_LANGUAGES,
    availableCurrencies: AVAILABLE_CURRENCIES,
    translations,
    t: translate,
    isLoadingTranslations,
  };

  return (
    <LocalizationContext.Provider value={contextValue}>
      {children}
    </LocalizationContext.Provider>
  );
};
```

# src/contexts/WishlistContext.tsx
```tsx
// src/contexts/WishlistContext.tsx
"use client";

import React, { 
    createContext, 
    useContext, 
    useState, 
    useEffect, 
    type ReactNode, 
    useCallback,
    useMemo // ADDED useMemo here
} from 'react';
import { toast } from 'react-hot-toast';
import { api } from '~/trpc/react'; // Corrected: Use api from trpc/react for client components
import { useSession } from 'next-auth/react';
import { useLocalStorage } from '~/hooks/useLocalStorage';

// Define the shape of a wishlist item
export interface WishlistItemClient {
  id: string; // Product ID
  variantId?: string | null; 
  name: string;
  price: number;
  imageUrl?: string | null;
  slug: string; 
}

interface WishlistContextType {
  items: WishlistItemClient[];
  addToWishlist: (item: WishlistItemClient) => void;
  removeFromWishlist: (productId: string, variantId?: string | null) => void;
  isInWishlist: (productId: string, variantId?: string | null) => boolean;
  clearWishlist: () => void; 
  isLoading: boolean; 
  itemCount: number;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

const WISHLIST_STORAGE_KEY = "the-scent-wishlist";

interface WishlistProviderProps {
  children: ReactNode;
}

export const WishlistProvider = ({ children }: WishlistProviderProps) => {
  const { data: session, status: sessionStatus } = useSession();
  const [localItems, setLocalItems] = useLocalStorage<WishlistItemClient[]>(WISHLIST_STORAGE_KEY, []);
  const [syncedItems, setSyncedItems] = useState<WishlistItemClient[]>([]); 
  const [isLoadingInitialDB, setIsLoadingInitialDB] = useState(true); 

  const getWishlistQuery = api.wishlist.getWishlist.useQuery(undefined, {
    enabled: sessionStatus === "authenticated",
    staleTime: 5 * 60 * 1000,
    onSuccess: (data) => {
      const mappedData = data.map(item => ({
        id: item.product.id,
        variantId: item.variantId, 
        name: item.product.name,
        price: parseFloat(item.product.price.toString()), 
        imageUrl: item.product.images?.[0]?.url ?? undefined,
        slug: item.product.slug,
      }));
      setSyncedItems(mappedData);
      setIsLoadingInitialDB(false);
    },
    onError: () => {
        setIsLoadingInitialDB(false);
        toast.error("Could not load wishlist from server.");
    }
  });

  const addItemMutation = api.wishlist.addToWishlist.useMutation({
    onSuccess: () => { getWishlistQuery.refetch().catch(console.error); },
    onError: (error) => { toast.error(`Failed to add to wishlist: ${error.message}`); }
  });
  const removeItemMutation = api.wishlist.removeFromWishlist.useMutation({
    onSuccess: () => { getWishlistQuery.refetch().catch(console.error); },
    onError: (error) => { toast.error(`Failed to remove from wishlist: ${error.message}`); }
  });
  const clearWishlistMutation = api.wishlist.clearWishlist.useMutation({
    onSuccess: () => { getWishlistQuery.refetch().catch(console.error); },
    onError: (error) => { toast.error(`Failed to clear wishlist: ${error.message}`); }
  });

  const items = useMemo(() => {
    return sessionStatus === "authenticated" ? syncedItems : localItems;
  }, [sessionStatus, localItems, syncedItems]);

  // Sync local to DB on login (basic version: add local items not in DB)
  useEffect(() => {
    if (sessionStatus === "authenticated" && !isLoadingInitialDB && localItems.length > 0) {
      const dbItemKeys = new Set(syncedItems.map(item => `${item.id}-${item.variantId ?? 'null'}`));
      const itemsToSync = localItems.filter(localItem => !dbItemKeys.has(`${localItem.id}-${localItem.variantId ?? 'null'}`));
      
      if (itemsToSync.length > 0) {
        Promise.all(itemsToSync.map(item => addItemMutation.mutateAsync({ productId: item.id, variantId: item.variantId })))
          .then(() => {
            console.log("Local wishlist items synced to DB.");
            setLocalItems([]); // Clear local items after successful sync
          })
          .catch(error => console.error("Error syncing local wishlist to DB:", error));
      } else {
        // If no items to sync from local, but local had items, it means they were already on server or cleared.
        // If user explicitly cleared local before login, this is fine.
        // If local was just old, this is also fine.
      }
    }
  }, [sessionStatus, isLoadingInitialDB, localItems, syncedItems, addItemMutation, setLocalItems]);


  const addToWishlist = useCallback((item: WishlistItemClient) => {
    const alreadyExists = items.some(i => i.id === item.id && i.variantId === item.variantId);
    if (alreadyExists) {
        toast.info(`${item.name} is already in your wishlist.`);
        return;
    }

    if (sessionStatus === "authenticated" && session?.user) {
      addItemMutation.mutate({ productId: item.id, variantId: item.variantId });
    } else {
      setLocalItems(prev => [...prev, item]);
    }
    toast.success(`${item.name} added to wishlist!`);
  }, [sessionStatus, session, addItemMutation, setLocalItems, items]);

  const removeFromWishlist = useCallback((productId: string, variantId?: string | null) => {
    const itemToRemove = items.find(item => item.id === productId && item.variantId === (variantId ?? undefined));
    
    if (sessionStatus === "authenticated" && session?.user) {
      removeItemMutation.mutate({ productId, variantId: variantId ?? undefined });
    } else {
      setLocalItems(prev => prev.filter(i => !(i.id === productId && i.variantId === (variantId ?? undefined))));
    }
    if (itemToRemove) {
      toast.success(`${itemToRemove.name} removed from wishlist.`);
    }
  }, [sessionStatus, session, removeItemMutation, setLocalItems, items]);

  const isInWishlist = useCallback((productId: string, variantId?: string | null): boolean => {
    return items.some(item => item.id === productId && item.variantId === (variantId ?? undefined));
  }, [items]);

  const clearWishlist = useCallback(() => {
    if (sessionStatus === "authenticated" && session?.user) {
      clearWishlistMutation.mutate();
    } else {
      setLocalItems([]);
    }
    toast.success("Wishlist cleared.");
  }, [sessionStatus, session, clearWishlistMutation, setLocalItems]);

  const isLoadingOverall = sessionStatus === "loading" || isLoadingInitialDB || addItemMutation.isPending || removeItemMutation.isPending || clearWishlistMutation.isPending;

  return (
    <WishlistContext.Provider value={{ 
        items, 
        addToWishlist, 
        removeFromWishlist, 
        isInWishlist, 
        clearWishlist,
        isLoading: isLoadingOverall,
        itemCount: items.length 
    }}>
      {children}
    </WishlistContext.Provider>
  );
};
```

# src/lib/utils.ts
```ts
// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names into a single string,
 * merging Tailwind CSS classes intelligently.
 * @param inputs - An array of class values (strings, objects, arrays).
 * @returns A string of combined and merged class names.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// You can add other general utility functions here.
// For example, a utility to generate slugs (if not using a library):
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-"); // Replace multiple - with single -
}

// Delay function (useful for simulating network latency or debouncing)
export const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

```

# src/trpc/query-client.ts
```ts
import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";
import SuperJSON from "superjson";

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 30 * 1000,
      },
      dehydrate: {
        serializeData: SuperJSON.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
    },
  });

```

# src/trpc/server.ts
```ts
// src/trpc/server.ts
import "server-only";
import { headers as nextHeaders } from "next/headers"; // Alias to avoid conflict if 'headers' is used as a var name
import { cache } from "react";

import { appRouter } from "~/server/api/root";
import { createInnerTRPCContext } from "~/server/api/trpc"; // The synchronous inner context creator
import { auth } from "~/server/auth"; // Your NextAuth.js v5 auth function

/**
 * Creates a tRPC context for React Server Components, ensuring it's request-scoped.
 * Uses React `cache` to memoize the context creation per request-render lifecycle.
 */
const createServerComponentContext = cache(async () => {
  const reqHeaders = nextHeaders(); // `headers()` is called here, inside the cached function
  const session = await auth();    // `auth()` is also called here, correctly scoped

  // Pass the Headers object from next/headers directly.
  // If createInnerTRPCContext or subsequent logic needs to *modify* headers
  // (which is rare for context), then it should clone it internally.
  // For setting x-trpc-source, that's usually for links; here it's implicit.
  return createInnerTRPCContext({
    session,
    headers: reqHeaders, // Pass the original Headers object
  });
});

/**
 * Asynchronous function to get a request-scoped tRPC API caller for Server Components.
 * Each call to this function (or rather, its awaited result) within the same
 * request-render cycle will use the same cached context.
 */
export const createServerActionClient = async () => {
  const context = await createServerComponentContext();
  return appRouter.createCaller(context);
};
```

# src/trpc/shared.ts
```ts
// src/trpc/shared.ts
import superjson from "superjson";

/**
 * Shared tRPC transformer.
 * Useful for ensuring client and server use the same data serialization.
 */
export const transformer = superjson;

// You can also define shared helper functions or constants related to tRPC here.
// For example, a function to construct the tRPC endpoint URL:
export function getBaseUrl() {
  if (typeof window !== "undefined") return ""; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
}

```

# src/trpc/react.tsx
```tsx
// src/trpc/react.tsx
"use client"; 

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, loggerLink, type TRPCLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { type ReactNode, useState } from "react";
import { type Observable, observable } from '@trpc/server/observable';
import { toast } from "react-hot-toast";

import { type AppRouter } from "~/server/api/root"; 
import { transformer, getBaseUrl } from "./shared"; // Import from shared.ts

export const api = createTRPCReact<AppRouter>();

const errorHandlingLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) => {
    return observable((observer) => {
      const unsubscribe = next(op).subscribe({
        next(value) { observer.next(value); },
        error(err) {
          observer.error(err);
          if (err.data?.code === 'UNAUTHORIZED' || err.data?.code === 'FORBIDDEN') {
            toast.error(err.message || "Access denied. Please try logging in.");
          } else if (err.data?.zodError) {
            const zodErrors = err.data.zodError.fieldErrors;
            let messages: string[] = [];
            for (const field in zodErrors) {
                if (zodErrors[field]) {
                    messages = messages.concat(zodErrors[field] as string[]);
                }
            }
            toast.error(`Input error: ${messages.join(', ')}`);
          } else {
            toast.error(err.message || "An unexpected error occurred.");
          }
        },
        complete() { observer.complete(); },
      });
      return unsubscribe;
    });
  };
};

interface TRPCReactProviderProps {
  children: ReactNode;
  headers?: Headers; 
}

export function TRPCReactProvider({ children, headers: passedHeaders }: TRPCReactProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, 
            refetchOnWindowFocus: true,
            retry: (failureCount, error: any) => {
              if (error.data?.code === 'UNAUTHORIZED' || error.data?.code === 'FORBIDDEN' || error.data?.code === 'NOT_FOUND') {
                return false;
              }
              return failureCount < 2;
            },
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    api.createClient({
      transformer, // Use shared transformer
      links: [
        errorHandlingLink,
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: getBaseUrl() + "/api/trpc", // Use shared getBaseUrl
          headers() {
            const heads = new Map(passedHeaders); 
            heads.set("x-trpc-source", "react-client"); 
            
            const headerObject: Record<string, string> = {};
            heads.forEach((value, key) => {
              headerObject[key] = value;
            });
            return headerObject;
          },
        }),
      ],
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {children}
      </api.Provider>
    </QueryClientProvider>
  );
}

```

# src/types/product.ts
```ts
// src/types/product.ts
import type { 
    Product as PrismaProduct, 
    ProductVariant as PrismaProductVariant, 
    ProductImage as PrismaProductImage, 
    Category as PrismaCategory, 
    Tag as PrismaTag, 
    Review as PrismaReview, 
    User as PrismaUser 
} from "@prisma/client";

// Processed variant type for client-side use (price as number)
export interface ProcessedProductVariant extends Omit<PrismaProductVariant, 'price' | 'stockQuantity'> {
  price: number | null;
  stockQuantity: number; // Ensuring it's always a number, defaulting to 0 from Prisma
}

// Processed review user type (subset of PrismaUser)
export interface ProcessedProductReviewUser extends Pick<PrismaUser, 'id' | 'name' | 'image'> {}

// Processed review type (dates as strings, user processed)
export interface ProcessedProductReview extends Omit<PrismaReview, 'createdAt' | 'updatedAt' | 'user'> {
    createdAt: string;
    updatedAt: string;
    user: ProcessedProductReviewUser;
}

// Main processed product type for detail pages and listings
export interface ProductWithRelations extends Omit<
    PrismaProduct, 
    'price' | 'compareAtPrice' | 'costPrice' | 'createdAt' | 'updatedAt' | 'publishedAt' | 'saleEndDate' | 'variants' | 'reviews' | 'stockQuantity'
> {
  images: PrismaProductImage[];
  variants: ProcessedProductVariant[];
  categories: Pick<PrismaCategory, 'id' | 'name' | 'slug'>[]; // Only pick necessary fields
  tags: Pick<PrismaTag, 'id' | 'name' | 'slug'>[]; // Only pick necessary fields
  reviews: ProcessedProductReview[]; // For initial load or full list
  avgRating: number;
  reviewCount: number;
  price: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  stockQuantity: number; // Ensuring it's always a number
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  saleEndDate: string | null;
}
```

# next-env.d.ts
```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
/// <reference types="next/navigation-types/compat/navigation" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.

```

# tailwind.config.ts
```ts
// tailwind.config.ts
import { type Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: { 
      center: true,
      padding: {
        DEFAULT: "1rem", 
        sm: "1.5rem",    
        lg: "2rem",      
      },
      screens: {
        sm: "640px", md: "768px", lg: "1024px", xl: "1180px", "2xl": "1440px",
      },
    },
    extend: {
      colors: { 
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        head: ["var(--font-head)", "ui-serif", "serif"],
        body: ["var(--font-body)", "ui-sans-serif", "sans-serif"],
        accent: ["var(--font-accent)", "ui-sans-serif", "sans-serif"],
        sans: ["var(--font-body)", "ui-sans-serif", "sans-serif"], 
      },
      keyframes: {
        "accordion-down": { from: { height: "0px" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0px" } },
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        shimmer: { "0%": { backgroundPosition: "-1000px 0" }, "100%": { backgroundPosition: "1000px 0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        fadeIn: "fadeIn 0.5s ease-in-out",
        shimmer: "shimmer 2s infinite linear",
      },
      typography: (theme: any) => ({ // Basic prose styling using theme colors
        DEFAULT: {
          css: {
            '--tw-prose-body': theme('colors.foreground / 1'),
            '--tw-prose-headings': theme('colors.foreground / 1'), // Or theme('colors.primary / 1')
            '--tw-prose-lead': theme('colors.muted.foreground / 1'),
            '--tw-prose-links': theme('colors.primary / 1'),
            '--tw-prose-bold': theme('colors.foreground / 1'),
            '--tw-prose-counters': theme('colors.muted.foreground / 1'),
            '--tw-prose-bullets': theme('colors.muted.foreground / 1'),
            '--tw-prose-hr': theme('colors.border / 1'),
            '--tw-prose-quotes': theme('colors.foreground / 1'),
            '--tw-prose-quote-borders': theme('colors.border / 1'),
            '--tw-prose-captions': theme('colors.muted.foreground / 1'),
            '--tw-prose-code': theme('colors.foreground / 1'),
            '--tw-prose-pre-code': theme('colors.foreground / 1'), // Text inside code block
            '--tw-prose-pre-bg': theme('colors.muted / 1'),         // Code block background
            '--tw-prose-th-borders': theme('colors.border / 1'),
            '--tw-prose-td-borders': theme('colors.border / 1'),
            // Dark mode prose variables
            '--tw-prose-invert-body': theme('colors.foreground / 1'), // Should use dark foreground
            '--tw-prose-invert-headings': theme('colors.foreground / 1'),
            '--tw-prose-invert-lead': theme('colors.muted.foreground / 1'),
            '--tw-prose-invert-links': theme('colors.primary / 1'),
            // ... and so on for all invert variables
             h1: { fontFamily: 'var(--font-head)'},
             h2: { fontFamily: 'var(--font-head)'},
             h3: { fontFamily: 'var(--font-head)'},
          },
        },
      }),
    },
  },
  plugins: [
    require("tailwindcss-animate"), 
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
} satisfies Config;
```

# eslint.config.js
```js
import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "typescript-eslint";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default tseslint.config(
  {
    ignores: [".next"],
  },
  ...compat.extends("next/core-web-vitals"),
  {
    files: ["**/*.ts", "**/*.tsx"],
    extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    rules: {
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
);

```

# next.config.js
```js
// next.config.js
/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.mjs"; // Updated to .mjs

/** @type {import("next").NextConfig} */
const config = {
  // Add any other Next.js specific configurations here if needed.
  // For example, if you have image domains, experimental features, etc.
  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: 'https',
  //       hostname: 'example.com', // Replace with actual image hostnames
  //     },
  //   ],
  // },
};

export default config;
```

# postcss.config.js
```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

```

# prettier.config.js
```js
/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
export default {
  plugins: ["prettier-plugin-tailwindcss"],
};

```

# package.json
```json
{
  "name": "the_scent",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "next build",
    "check": "next lint && tsc --noEmit",
    "db:generate": "prisma migrate dev",
    "db:migrate": "prisma migrate deploy",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:seed": "prisma db seed",
    "dev": "next dev",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,mdx}\" --cache",
    "format:write": "prettier --write \"**/*.{ts,tsx,js,jsx,mdx}\" --cache",
    "postinstall": "prisma generate",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "preview": "next build && next start",
    "start": "next start",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@auth/prisma-adapter": "^2.7.2",
    "@prisma/client": "^6.5.0",
    "@radix-ui/react-checkbox": "^1.3.1",
    "@radix-ui/react-label": "^2.1.6",
    "@radix-ui/react-progress": "^1.1.6",
    "@radix-ui/react-radio-group": "^1.3.6",
    "@radix-ui/react-slot": "^1.2.2",
    "@radix-ui/react-switch": "^1.2.4",
    "@t3-oss/env-nextjs": "^0.12.0",
    "@tailwindcss/forms": "^0.5.10",
    "@tailwindcss/typography": "^0.5.16",
    "@tanstack/react-query": "^5.69.0",
    "@trpc/client": "^11.0.0",
    "@trpc/react-query": "^11.0.0",
    "@trpc/server": "^11.0.0",
    "@vercel/analytics": "^1.5.0",
    "@vercel/speed-insights": "^1.2.0",
    "bcryptjs": "^3.0.2",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "framer-motion": "^12.12.1",
    "next": "^15.2.3",
    "next-auth": "5.0.0-beta.25",
    "next-themes": "^0.4.6",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-hot-toast": "^2.5.2",
    "react-icons": "^5.5.0",
    "server-only": "^0.0.1",
    "stripe": "^18.1.0",
    "superjson": "^2.2.1",
    "tailwind-merge": "^3.3.0",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@tailwindcss/postcss": "^4",
    "tailwindcss": "^4",
    "eslint": "^9",
    "eslint-config-next": "15.3.2",
    "@eslint/eslintrc": "^3",
    "@types/bcryptjs": "^2.4.6",
    "postcss": "^8.5.3",
    "prettier": "^3.5.3",
    "prettier-plugin-tailwindcss": "^0.6.11",
    "prisma": "^6.5.0",
    "ts-node": "^10.9.2",
    "typescript-eslint": "^8.27.0"
  },
  "prisma": {
    "seed": "node --loader ts-node/esm prisma/seed.ts"
  },
  "ct3aMetadata": {
    "initVersion": "7.39.3"
  },
  "packageManager": "npm@11.2.0"
}

```

# tsconfig.json
```json
{
  "compilerOptions": {
    /* Base Options: */
    "esModuleInterop": true,
    "skipLibCheck": true,
    "target": "es2022",
    "allowJs": true,
    "resolveJsonModule": true,
    "moduleDetection": "force",
    "isolatedModules": true,
    "verbatimModuleSyntax": true,

    /* Strictness */
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "checkJs": true,

    /* Bundled projects */
    "lib": ["dom", "dom.iterable", "ES2022"],
    "noEmit": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "preserve",
    "plugins": [{ "name": "next" }],
    "incremental": true,

    /* Path Aliases */
    "baseUrl": ".",
    "paths": {
      "~/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    "**/*.cjs",
    "**/*.js",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}

```

