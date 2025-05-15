// src/server/api/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import { type Session } from "next-auth"; // Ensure this is the augmented Session type
import superjson from "superjson";
import { ZodError } from "zod";

import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";
import type { Role as PrismaAppRole } from "@prisma/client";

type CreateContextOptions = {
  session: Session | null; // Session from next-auth
  // Add other context properties if needed, e.g., IP address, headers
  // req?: CreateNextContextOptions['req'];
  // res?: CreateNextContextOptions['res'];
};

/**
 * This helper generates the "internals" for a tRPC context. If you need to use it, you can export
 * it from here.
 *
 * Examples of things you may need it for:
 * - testing, so we don't have to mock Next.js' req/res
 * - Infers part of the context value, so we don't need to repeat the type definition
 *
 * @see https://create.t3.gg/en/usage/trpc#-serverapitrpcts
 */
const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    db,
    // req: opts.req,
    // res: opts.res,
  };
};

/**
 * This is the actual context you will use in your router. It will be used to process every request
 * that goes through your tRPC endpoint.
 *
 * @see https://trpc.io/docs/context
 */
export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts;

  // Get the session from the server using the getServerSession wrapper function
  const session = await getServerAuthSession({ req, res });

  return createInnerTRPCContext({
    session,
    // req,
    // res,
  });
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
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

/**
 * 3. ROUTER & PROCEDURE (Reusable Components)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying Procedures created PUBLICLY are actually signed in.
 */
export const publicProcedure = t.procedure;

/**
 * Reusable middleware that enforces users are logged in before running the procedure.
 */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated." });
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);


/**
 * Middleware for admin-only procedures (ADMIN or MANAGER roles).
 * In a more complex system, this would check specific permissions based on `roleDefinitionId`.
 */
const enforceUserIsAdminOrManager = t.middleware(({ ctx, next }) => {
  // Authentication is already enforced by `protectedProcedure` if this is chained.
  // If used directly, uncomment the auth check.
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

/**
 * Middleware to enforce specific roles.
 * For a more granular system, you'd check against permissions tied to `RoleDefinition`.
 */
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
