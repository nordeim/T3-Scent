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
