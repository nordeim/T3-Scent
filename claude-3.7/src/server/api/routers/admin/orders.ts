// src/server/api/routers/admin/orders.ts
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { z } from "zod";
import { OrderStatus, type Prisma } from "@prisma/client"; // Import OrderStatus enum
import { TRPCError } from "@trpc/server";

export const adminOrdersRouter = createTRPCRouter({
  getAllOrders: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).optional().default(20),
      cursor: z.string().optional(), // Order ID for cursor
      status: z.nativeEnum(OrderStatus).optional(),
      searchQuery: z.string().optional(), // Search by order number, customer name/email
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { limit, cursor, status, searchQuery, dateFrom, dateTo } = input;
      console.log("Admin: Fetching all orders with input:", input);
      
      const where: Prisma.OrderWhereInput = {};
      if (status) where.status = status;
      if (searchQuery) {
        where.OR = [
          { orderNumber: { contains: searchQuery, mode: 'insensitive' } },
          { user: { name: { contains: searchQuery, mode: 'insensitive' } } },
          { user: { email: { contains: searchQuery, mode: 'insensitive' } } },
        ];
      }
      if (dateFrom) where.createdAt = { ...where.createdAt, gte: new Date(dateFrom) };
      if (dateTo) where.createdAt = { ...where.createdAt, lte: new Date(dateTo) };

      const orders = await ctx.db.order.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where,
        orderBy: { createdAt: 'desc' },
        include: { 
            user: { select: { id: true, name: true, email: true } },
            orderItems: { take: 1, select: { name: true, quantity: true }} // Minimal include for list view
        },
      });

      let nextCursor: string | undefined = undefined;
      if (orders.length > limit) {
        const nextItem = orders.pop();
        nextCursor = nextItem?.id;
      }
      
      return { 
        items: orders.map(o => ({ // Convert Decimals
            ...o,
            subtotal: parseFloat(o.subtotal.toString()),
            shippingCost: parseFloat(o.shippingCost.toString()),
            tax: parseFloat(o.tax.toString()),
            discountAmount: parseFloat(o.discountAmount.toString()),
            total: parseFloat(o.total.toString()),
        })), 
        nextCursor 
      };
    }),

  getOrderDetails: adminProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      console.log("Admin: Fetching order details for ID:", input.orderId);
      const order = await ctx.db.order.findUnique({
        where: { id: input.orderId },
        include: {
          user: true,
          orderItems: { include: { product: {select: {name: true, slug: true}}, variant: {select: {name: true}} } },
          history: { orderBy: { createdAt: 'desc' } },
        },
      });
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
      
      return { // Convert Decimals
        ...order,
        subtotal: parseFloat(order.subtotal.toString()),
        shippingCost: parseFloat(order.shippingCost.toString()),
        tax: parseFloat(order.tax.toString()),
        discountAmount: parseFloat(order.discountAmount.toString()),
        total: parseFloat(order.total.toString()),
        orderItems: order.orderItems.map(item => ({
            ...item,
            price: parseFloat(item.price.toString()),
            subtotal: parseFloat(item.subtotal.toString()),
        }))
      };
    }),

  updateOrderStatus: adminProcedure
    .input(z.object({
      orderId: z.string(),
      status: z.nativeEnum(OrderStatus),
      trackingNumber: z.string().optional().nullable(),
      notes: z.string().optional().nullable(), // Admin notes for this status update
      notifyCustomer: z.boolean().optional().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("Admin: Updating order status:", input);
      const { orderId, status, trackingNumber, notes, notifyCustomer } = input;

      const updatedOrder = await ctx.db.order.update({
        where: { id: orderId },
        data: {
          status,
          trackingNumber: trackingNumber, // Only update if provided
          history: {
            create: {
              status,
              comment: `Status updated to ${status} by admin. ${notes || ''}`,
              createdBy: ctx.session.user.id,
            },
          },
        },
      });

      if (notifyCustomer) {
        // TODO: Implement actual notification logic (email, in-app)
        console.log(`Notification to customer for order ${orderId}: status changed to ${status}`);
        await ctx.db.notification.create({
            data: {
                userId: updatedOrder.userId,
                type: "ORDER_STATUS_UPDATE",
                title: `Your Order #${updatedOrder.orderNumber} Updated`,
                message: `Your order status is now: ${status}.${trackingNumber ? ` Tracking: ${trackingNumber}` : ''}`,
                link: `/account/orders/${orderId}`,
                data: { orderId, newStatus: status }
            }
        })
      }
      return updatedOrder;
    }),
    
  processRefund: adminProcedure
    .input(z.object({
        orderId: z.string(),
        amount: z.number().positive("Refund amount must be positive."),
        reason: z.string().optional(),
        // itemsToRefund: z.array(z.object({ orderItemId: z.string(), quantity: z.number().int().positive() })).optional(), // For partial refunds
    }))
    .mutation(async ({ctx, input}) => {
        console.log("Admin: Processing refund for order:", input.orderId);
        // Placeholder: Implement Stripe refund logic and update order/inventory
        // const order = await ctx.db.order.findUnique(...);
        // if (!order || !order.paymentIntentId) throw new TRPCError...
        // await stripe.refunds.create({ payment_intent: order.paymentIntentId, amount: input.amount * 100 });
        // await ctx.db.order.update(... status: REFUNDED/PARTIALLY_REFUNDED, refundAmount ...);
        return { success: true, message: "Refund processed (placeholder)." };
    })
});