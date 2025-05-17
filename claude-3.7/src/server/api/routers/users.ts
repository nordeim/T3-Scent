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