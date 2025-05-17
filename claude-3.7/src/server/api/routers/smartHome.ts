// src/server/api/routers/smartHome.ts
import { protectedProcedure, createTRPCRouter } from "~/server/api/trpc";
import { z } from "zod";
import { SmartHomeDeviceType, AutomationTriggerType } from "@prisma/client";

// Placeholder types, should match Prisma schema for JSON fields if possible
const ScentScheduleEntrySchema = z.object({
    id: z.string().cuid(),
    scentProductId: z.string(),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format HH:mm"), // HH:mm
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format HH:mm"),
    daysOfWeek: z.array(z.number().int().min(0).max(6)), // 0=Sun, 6=Sat
    intensity: z.number().int().min(1).max(10).optional(),
});

export const smartHomeRouter = createTRPCRouter({
  getConnectedPlatforms: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      console.log("User: Fetching connected smart home platforms for:", userId);
      return ctx.db.smartHomePlatformConnection.findMany({ where: { userId } });
    }),

  connectPlatform: protectedProcedure // This would typically involve an OAuth flow start
    .input(z.object({ platformKey: z.string(), authCodeOrTokens: z.any() /* Depends on platform */ }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      console.log("User: Connecting smart home platform:", input.platformKey, "for user:", userId);
      // Placeholder: Implement OAuth token exchange and store connection
      // const platform = await ctx.db.smartHomePlatformConnection.create({ data: { ... } });
      return { success: true, message: `${input.platformKey} connected (placeholder).` };
    }),
  
  disconnectPlatform: protectedProcedure
    .input(z.object({ connectionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
        // Placeholder: Remove platform connection, revoke tokens if possible
        await ctx.db.smartHomePlatformConnection.deleteMany({where: {id: input.connectionId, userId: ctx.session.user.id}});
        return { success: true };
    }),

  getConnectedDevices: protectedProcedure
    .input(z.object({ platformConnectionId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      console.log("User: Fetching connected devices for user:", userId);
      return ctx.db.smartHomeDevice.findMany({
        where: { connection: { userId, id: input.platformConnectionId } },
        include: { currentScent: { select: {name: true, images: {take: 1, select: {url: true}}}}}
      });
    }),
    
  toggleDeviceState: protectedProcedure
    .input(z.object({ deviceId: z.string(), isActive: z.boolean() }))
    .mutation(async ({ctx, input}) => {
        console.log("User: Toggling device state for:", input.deviceId);
        // Placeholder: Call actual smart home API to toggle device, then update local DB
        const device = await ctx.db.smartHomeDevice.findFirst({where: {id: input.deviceId, connection: {userId: ctx.session.user.id}}});
        if(!device) throw new Error("Device not found or not owned by user");
        // Simulate API call
        return ctx.db.smartHomeDevice.update({where: {id: input.deviceId}, data: {isActive: input.isActive, lastActivityAt: new Date()}});
    }),

  getAutomations: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      console.log("User: Fetching automations for user:", userId);
      return ctx.db.automationRule.findMany({ 
          where: { userId },
          include: { actions: { include: { device: {select: {name: true}}}}}
      });
    }),

  addAutomation: protectedProcedure
    .input(z.object({
        name: z.string(),
        triggerType: z.nativeEnum(AutomationTriggerType),
        triggerConfig: z.record(z.any()), // JSON
        actions: z.array(z.object({
            deviceId: z.string(),
            actionType: z.string(),
            parameters: z.record(z.any()).optional()
        }))
    }))
    .mutation(async ({ctx, input}) => {
        console.log("User: Adding automation for user:", ctx.session.user.id);
        // Placeholder: Create automation rule and actions
        return ctx.db.automationRule.create({
            data: {
                userId: ctx.session.user.id,
                name: input.name,
                triggerType: input.triggerType,
                triggerConfig: input.triggerConfig,
                actions: { create: input.actions }
            }
        });
    }),
    
  toggleAutomation: protectedProcedure
    .input(z.object({ automationId: z.string(), enabled: z.boolean() }))
    .mutation(async ({ctx, input}) => {
        console.log("User: Toggling automation:", input.automationId);
        return ctx.db.automationRule.updateMany({
            where: {id: input.automationId, userId: ctx.session.user.id}, 
            data: {enabled: input.enabled}
        });
    }),

  removeAutomation: protectedProcedure
    .input(z.object({ automationId: z.string() }))
    .mutation(async ({ctx, input}) => {
        await ctx.db.automationRule.deleteMany({where: {id: input.automationId, userId: ctx.session.user.id}});
        return {success: true};
    }),

  getScentSchedules: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      console.log("User: Fetching scent schedules for user:", userId);
      return ctx.db.scentSchedule.findMany({ 
          where: { userId },
          include: { device: {select: {name: true}} } // Include device name for display
      });
    }),
    
  addScentSchedule: protectedProcedure
    .input(z.object({
        name: z.string(),
        deviceId: z.string(),
        entries: z.array(ScentScheduleEntrySchema),
        enabled: z.boolean().default(true)
    }))
    .mutation(async ({ctx, input}) => {
        console.log("User: Adding scent schedule for user:", ctx.session.user.id);
        return ctx.db.scentSchedule.create({
            data: {
                userId: ctx.session.user.id,
                name: input.name,
                deviceId: input.deviceId,
                entries: input.entries,
                enabled: input.enabled
            }
        });
    }),

  toggleScentSchedule: protectedProcedure
    .input(z.object({ scheduleId: z.string(), enabled: z.boolean() }))
    .mutation(async ({ctx, input}) => {
        console.log("User: Toggling scent schedule:", input.scheduleId);
        return ctx.db.scentSchedule.updateMany({
            where: {id: input.scheduleId, userId: ctx.session.user.id}, 
            data: {enabled: input.enabled}
        });
    }),
    
  removeScentSchedule: protectedProcedure
    .input(z.object({ scheduleId: z.string() }))
    .mutation(async ({ctx, input}) => {
        await ctx.db.scentSchedule.deleteMany({where: {id: input.scheduleId, userId: ctx.session.user.id}});
        return {success: true};
    }),
});