// src/server/api/routers/loyalty.ts
import { protectedProcedure, createTRPCRouter } from "~/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

// Placeholder types, align with Prisma schema
type LoyaltyData = {
  points: number;
  lifetimePoints: number;
  tier: string; // Tier name
  benefits: string[];
  nextTierName?: string;
  pointsToNextTier?: number;
  nextTierBenefits?: string[];
};
type AvailableReward = { id: string; name: string; description?: string | null; pointsCost: number; type: string; value: any; requiredTierId?: string | null; imageUrl?: string | null, expiresAt?: Date | null, tier?: {name: string} | null };
type PointHistoryEntry = { id: string; createdAt: Date; description: string; points: number; type: string; };
type RedemptionHistoryEntry = { id: string; createdAt: Date; reward: { name: string, pointsCost: number, type: string }; status: string; couponCode?: string | null, expiresAt?: Date | null };


export const loyaltyRouter = createTRPCRouter({
  getUserLoyalty: protectedProcedure
    .query(async ({ ctx }): Promise<LoyaltyData> => {
      const userId = ctx.session.user.id;
      console.log("User: Fetching loyalty data for user:", userId);
      // Placeholder: Implement logic to calculate points, determine tier, and fetch benefits
      // This involves querying LoyaltyPointLog, LoyaltyTier, etc.
      // Example structure:
      const currentPoints = await ctx.db.loyaltyPointLog.aggregate({
        _sum: { points: true },
        where: { userId, OR: [{expiresAt: null}, {expiresAt: {gte: new Date()}}] }, // Sum only non-expired points
      });
      const lifetimePoints = await ctx.db.loyaltyPointLog.aggregate({
        _sum: { points: true },
        where: { userId, type: {notIn: ['ADJUST_ADMIN_DEBIT', 'EXPIRE_POINTS', 'REFUND_POINTS', 'REDEEM_REWARD']} }, // Sum only earned points
      });
      
      const tiers = await ctx.db.loyaltyTier.findMany({ orderBy: { minPoints: 'asc' }});
      let currentTier = tiers[0] || { name: "Basic", benefits: [], minPoints: 0 }; // Fallback
      for (const tier of tiers) {
          if ((lifetimePoints._sum.points || 0) >= tier.minPoints) {
              currentTier = tier;
          } else break;
      }
      
      // This is a simplified placeholder:
      return {
        points: currentPoints._sum.points || 0,
        lifetimePoints: lifetimePoints._sum.points || 0,
        tier: currentTier.name,
        benefits: currentTier.benefits as string[] || ["Standard Rewards"],
        nextTierName: "Gold", // Example
        pointsToNextTier: 500, // Example
        nextTierBenefits: ["10% off next purchase"], // Example
      };
    }),

  getAvailableRewards: protectedProcedure
    .query(async ({ ctx }): Promise<AvailableReward[]> => {
      const userId = ctx.session.user.id;
      console.log("User: Fetching available rewards for user:", userId);
      // Placeholder: Fetch rewards, filter by user's tier and points balance
      const rewards = await ctx.db.reward.findMany({
        where: { 
            isActive: true, 
            OR: [ {validUntil: null}, {validUntil: {gte: new Date()}} ],
            // Add tier check based on user's current tier
        },
        include: { tier: { select: { name: true }}},
        orderBy: { pointsCost: 'asc' },
      });
      return rewards.map(r => ({...r, value: r.value as any, description: r.description}));
    }),

  getPointHistory: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(20), cursor: z.string().optional()}))
    .query(async ({ ctx, input }): Promise<{items: PointHistoryEntry[], nextCursor?: string}> => {
      const userId = ctx.session.user.id;
      console.log("User: Fetching point history for user:", userId);
      const logs = await ctx.db.loyaltyPointLog.findMany({
        where: { userId },
        take: input.limit + 1,
        cursor: input.cursor ? {id: input.cursor} : undefined,
        orderBy: { createdAt: 'desc' },
      });
      // ... (implement pagination and return structure)
      return { items: logs.map(l => ({...l, type: l.type.toString()})), nextCursor: undefined };
    }),

  getRedemptionHistory: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(20), cursor: z.string().optional()}))
    .query(async ({ ctx, input }): Promise<{items: RedemptionHistoryEntry[], nextCursor?: string}> => {
      const userId = ctx.session.user.id;
      console.log("User: Fetching redemption history for user:", userId);
      const redemptions = await ctx.db.userReward.findMany({
        where: { userId },
        take: input.limit + 1,
        cursor: input.cursor ? {id: input.cursor} : undefined,
        orderBy: { redeemedAt: 'desc' },
        include: { reward: {select: { name: true, pointsCost: true, type: true }} },
      });
      // ... (implement pagination and return structure)
      return { items: redemptions.map(r => ({...r, status: r.status.toString(), reward: {...r.reward, type: r.reward.type.toString()}})), nextCursor: undefined };
    }),

  redeemReward: protectedProcedure
    .input(z.object({ rewardId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      console.log("User: Redeeming reward:", input.rewardId, "for user:", userId);
      // Placeholder:
      // 1. Fetch reward details (pointsCost, availability, tier requirement)
      // 2. Fetch user's current points and tier
      // 3. Validate if user can redeem (enough points, correct tier, reward active, redemption limits)
      // 4. Start a transaction:
      //    a. Deduct points (create LoyaltyPointLog with negative points)
      //    b. Create UserReward entry
      //    c. If reward type is VOUCHER_CODE, generate and store unique code.
      // 5. Commit transaction
      const reward = await ctx.db.reward.findUnique({ where: {id: input.rewardId }});
      if (!reward) throw new TRPCError({ code: "NOT_FOUND", message: "Reward not found." });
      // ... (add full validation logic)
      
      // This is highly simplified:
      await ctx.db.loyaltyPointLog.create({
        data: { userId, points: -reward.pointsCost, type: "REDEEM_REWARD", description: `Redeemed: ${reward.name}`, userRewardId: "dummy_user_reward_id_link_later" }
      });
      const userReward = await ctx.db.userReward.create({
          data: { userId, rewardId: reward.id, status: "AVAILABLE" /* ... other fields */ }
      });
      // Link back if possible (userRewardId in LoyaltyPointLog)
      return { success: true, message: "Reward redeemed successfully!", redeemedReward: userReward };
    }),
});