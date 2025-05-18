// src/server/api/trpc.ts
// (Content from previous response - already updated to use `auth()`)
import { initTRPC, TRPCError } from "@trpc/server";
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { type Session } from "next-auth";
import superjson from "superjson";
import { ZodError } from "zod";

import { auth } from "~/server/auth"; 
import { db } from "~/server/db";
import type { Role as PrismaAppRole } from "@prisma/client";
import type { NextRequest } from "next/server";

type CreateInnerContextOptions = {
  session: Session | null;
  headers: Headers; 
};

export const createInnerTRPCContext = (opts: CreateInnerContextOptions) => {
  return {
    session: opts.session,
    db,
    headers: opts.headers,
  };
};

// Context for tRPC Route Handler (e.g., /api/trpc/[trpc]/route.ts)
export const createTRPCContext = async (opts: {
  req: NextRequest; // From Route Handler
  // resHeaders?: Headers; // For setting response headers from context if needed
}) => {
  const session = await auth(); // Uses cookies from NextRequest implicitly
  return createInnerTRPCContext({
    session,
    headers: opts.req.headers,
  });
};

const t = initTRPC.context<Awaited<ReturnType<typeof createTRPCContext>>>().create({ // Ensure context type matches
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

// ... rest of the file (createTRPCRouter, procedures) remains the same
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
        throw new TRPCError({ code: 'FORBIDDEN', message: "You do not have the required role for this action." });
      }
      return next({
        ctx: {
          session: { ...ctx.session, user: ctx.session.user },
        },
      });
    })
  );