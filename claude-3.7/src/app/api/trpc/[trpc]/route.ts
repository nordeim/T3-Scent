// src/app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";

import { env } from "~/env.mjs";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request via fetch.
 */
const createContext = async (req: NextRequest) => {
  return createTRPCContext({
    headers: req.headers,
    // Note: In App Router Route Handlers, `req` is a NextRequest, not Node's http.IncomingMessage.
    // `createTRPCContext` from Pages Router expected `req` and `res` from `CreateNextContextOptions`.
    // This needs to be adapted if `createTRPCContext` specifically uses Node.js req/res properties not available here.
    // For session, `getServerAuthSession` should work if cookies are forwarded correctly.
    // A common pattern for App Router tRPC context:
    // req: req as any, // Cast if createTRPCContext expects Node req/res
    // res: undefined as any, 
  });
};

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req), // Pass the NextRequest to the context creator
    onError:
      env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };