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