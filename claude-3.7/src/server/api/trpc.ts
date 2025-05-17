// src/server/api/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next"; // Still relevant if old type was used.
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch"; // More relevant for fetchRequestHandler
import { type Session } from "next-auth";
import superjson from "superjson";
import { ZodError } from "zod";

import { auth } from "~/server/auth"; // Import the `auth` function from NextAuth.js v5 setup
import { db } from "~/server/db";
import type { Role as PrismaAppRole } from "@prisma/client";
import type { NextRequest } from "next/server"; // For Route Handler context

// This is the inner context that both RSC and Route Handler contexts can create
type CreateInnerContextOptions = {
  session: Session | null;
  headers: Headers; // Pass headers for potential use
  // db is implicitly available via import
};

export const createInnerTRPCContext = (opts: CreateInnerContextOptions) => {
  return {
    session: opts.session,
    db,
    headers: opts.headers,
  };
};

/**
 * This is the actual context you will use in your router. It will be used to process every request
 * that goes through your tRPC endpoint for API Route Handlers.
 */
export const createTRPCContext = async (opts: {
  req: NextRequest; // The NextRequest object from the Route Handler
  // resHeaders?: Headers; // If you need to set response headers from context
}) => {
  const session = await auth(); // `auth()` gets the session using cookies from the request
  
  return createInnerTRPCContext({
    session,
    headers: opts.req.headers, // Pass request headers
  });
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated." });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

const enforceUserIsAdminOrManager = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
     throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated." });
  }
  const userRole = ctx.session.user.role;
  if (userRole !== PrismaAppRole.ADMIN && userRole !== PrismaAppRole.MANAGER) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not have sufficient permissions for this action." });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const adminProcedure = t.procedure.use(enforceUserIsAdminOrManager);

export const roleProtectedProcedure = (allowedRoles: PrismaAppRole[]) =>
  t.procedure.use(
    t.middleware(async ({ ctx, next }) => {
      if (!ctx.session?.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: "Not authenticated." });
      }
      if (!allowedRoles.includes(ctx.session.user.role)) {
        // TODO: Add more granular check based on ctx.session.user.roleDefinitionId and associated permissions
        throw new TRPCError({ code: 'FORBIDDEN', message: "You do not have the required role for this action." });
      }
      return next({
        ctx: {
          session: { ...ctx.session, user: ctx.session.user },
        },
      });
    })
  );