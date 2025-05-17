// src/server/api/routers/admin/users.ts
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { z } from "zod";
import { Role as PrismaRole, type Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
// import { hash } from "bcryptjs"; // If allowing admin to set/reset passwords

export const adminUsersRouter = createTRPCRouter({
  getAdminUsers: adminProcedure // Or a more specific role check if MANAGERS can't see all admins
    .input(z.object({
        limit: z.number().optional().default(20),
        cursor: z.string().optional(),
        search: z.string().optional(),
        roleId: z.string().optional(), // Filter by RoleDefinition ID
    }))
    .query(async ({ ctx, input }) => {
      console.log("Admin: Fetching admin users with input:", input);
      const { limit, cursor, search, roleId } = input;
      const where: Prisma.UserWhereInput = {
        // Filter for users who are ADMIN or MANAGER or have a roleDefinitionId
        OR: [
            { role: { in: [PrismaRole.ADMIN, PrismaRole.MANAGER] } },
            { roleDefinitionId: { not: null } }
        ]
      };
      if (search) {
        where.AND = [
            ...(where.AND as Prisma.UserWhereInput[] || []), // Keep existing AND conditions
            { OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ]}
        ];
      }
      if (roleId) {
        where.AND = [
            ...(where.AND as Prisma.UserWhereInput[] || []),
            { roleDefinitionId: roleId }
        ];
      }

      const users = await ctx.db.user.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where,
        orderBy: { createdAt: 'desc' },
        include: { definedRole: { select: { id: true, name: true } } },
      });
      
      let nextCursor: string | undefined = undefined;
      if (users.length > limit) {
        const nextItem = users.pop();
        nextCursor = nextItem?.id;
      }
      return { items: users, nextCursor };
    }),

  createAdminUser: adminProcedure // Only super ADMIN should do this typically
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
      role: z.nativeEnum(PrismaRole).optional(), // Simple role
      roleDefinitionId: z.string().optional(), // Advanced role
      // password: z.string().min(8).optional(), // If admin sets initial password
      sendInvite: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("Admin: Creating admin user:", input.email);
      const existingUser = await ctx.db.user.findUnique({ where: { email: input.email }});
      if (existingUser) throw new TRPCError({ code: "BAD_REQUEST", message: "User with this email already exists."});

      // const hashedPassword = input.password ? await hash(input.password, 12) : undefined;

      const newUser = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          emailVerified: input.sendInvite ? null : new Date(), // Mark as verified if not sending invite
          // password: hashedPassword,
          role: input.roleDefinitionId ? PrismaRole.MANAGER : (input.role || PrismaRole.MANAGER), // Assign default if using simple roles
          roleDefinitionId: input.roleDefinitionId,
        },
      });
      if (input.sendInvite) {
        // TODO: Implement email invitation logic (e.g., send verification token or temporary password)
        console.log(`Placeholder: Send invite to ${newUser.email}`);
      }
      return newUser;
    }),

  updateUserRoleOrDetails: adminProcedure
    .input(z.object({
      userId: z.string(),
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      role: z.nativeEnum(PrismaRole).optional(),
      roleDefinitionId: z.string().nullable().optional(), // Allow unsetting advanced role
      // isActive: z.boolean().optional(), // For activate/deactivate - handle via toggleUserStatus
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId, ...updateData } = input;
      console.log("Admin: Updating user details/role for:", userId);
      
      // Prevent self-role modification to avoid lockout, or demoting last admin
      if (userId === ctx.session.user.id && (updateData.role || updateData.roleDefinitionId !== undefined)) {
          // Add more checks if this is the only admin user
          // throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot modify your own role." });
      }

      return ctx.db.user.update({
        where: { id: userId },
        data: {
            ...updateData,
            roleDefinitionId: updateData.roleDefinitionId // Handles null to unset
        },
      });
    }),
    
  toggleUserStatus: adminProcedure // Placeholder for activate/deactivate (needs an 'isActive' field on User model)
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ctx, input}) => {
        console.log("Admin: Toggling user status for:", input.userId);
        // const user = await ctx.db.user.findUnique({where: {id: input.userId}});
        // if (!user) throw new TRPCError({code: 'NOT_FOUND'});
        // return ctx.db.user.update({ where: {id: input.userId}, data: { isActive: !user.isActive }});
        return { success: true, message: "User status toggled (placeholder - needs isActive field)." };
    }),

  getAllCustomers: adminProcedure // For general customer listing if needed
    .input(z.object({
        limit: z.number().optional().default(20),
        cursor: z.string().optional(),
        search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
        // Similar to getAdminUsers but filters for CUSTOMER role
        // ... implementation ...
        return { items: [], nextCursor: undefined, message: "Customer listing not fully implemented." };
    })
});