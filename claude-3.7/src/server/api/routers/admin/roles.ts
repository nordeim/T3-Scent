// src/server/api/routers/admin/roles.ts
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

const RoleInputSchema = z.object({
  name: z.string().min(2, "Role name must be at least 2 characters"),
  description: z.string().optional(),
  permissionIds: z.array(z.string()), // Array of Permission IDs
});

export const adminRolesRouter = createTRPCRouter({
  getAllRoles: adminProcedure
    .query(async ({ ctx }) => {
      console.log("Admin: Fetching all role definitions");
      return ctx.db.roleDefinition.findMany({
        include: {
          _count: { select: { users: true, permissions: true } },
        },
        orderBy: { name: 'asc' },
      });
    }),

  getAllPermissions: adminProcedure
    .query(async ({ ctx }) => {
      console.log("Admin: Fetching all permissions");
      return ctx.db.permission.findMany({
        orderBy: [{ category: 'asc' }, { subject: 'asc' }, { action: 'asc' }],
      });
    }),

  createRole: adminProcedure
    .input(RoleInputSchema)
    .mutation(async ({ ctx, input }) => {
      console.log("Admin: Creating role:", input.name);
      const existingRole = await ctx.db.roleDefinition.findUnique({ where: { name: input.name }});
      if (existingRole) throw new TRPCError({ code: "BAD_REQUEST", message: "Role name already exists."});

      return ctx.db.roleDefinition.create({
        data: {
          name: input.name,
          description: input.description,
          permissions: {
            create: input.permissionIds.map(pid => ({ permissionId: pid })),
          },
        },
      });
    }),

  updateRole: adminProcedure
    .input(RoleInputSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, name, description, permissionIds } = input;
      console.log("Admin: Updating role:", id);

      const role = await ctx.db.roleDefinition.findUnique({ where: {id} });
      if (!role) throw new TRPCError({ code: "NOT_FOUND", message: "Role not found." });
      if (role.isSystemRole) throw new TRPCError({ code: "BAD_REQUEST", message: "System roles cannot be modified." });

      // Handle permissions: disconnect all old, connect all new.
      // More sophisticated would be to diff and only connect/disconnect changed ones.
      return ctx.db.roleDefinition.update({
        where: { id },
        data: {
          name,
          description,
          permissions: {
            deleteMany: {}, // Delete all existing permission assignments for this role
            create: permissionIds.map(pid => ({ permissionId: pid })), // Create new ones
          },
        },
      });
    }),

  deleteRole: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      console.log("Admin: Deleting role:", input.id);
      const role = await ctx.db.roleDefinition.findUnique({ where: {id}, include: {_count: {select: {users: true}}}});
      if (!role) throw new TRPCError({ code: "NOT_FOUND", message: "Role not found." });
      if (role.isSystemRole) throw new TRPCError({ code: "BAD_REQUEST", message: "System roles cannot be deleted." });
      if (role._count.users > 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot delete role, users are still assigned to it." });

      // Permissions are cascade deleted due to relation if RoleDefinition is deleted
      return ctx.db.roleDefinition.delete({ where: { id: input.id } });
    }),
});