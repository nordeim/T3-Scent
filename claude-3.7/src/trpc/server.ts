// src/trpc/server.ts
import "server-only";
import { headers as nextHeaders } from "next/headers"; // Alias to avoid conflict if 'headers' is used as a var name
import { cache } from "react";

import { appRouter } from "~/server/api/root";
import { createInnerTRPCContext } from "~/server/api/trpc"; // The synchronous inner context creator
import { auth } from "~/server/auth"; // Your NextAuth.js v5 auth function

/**
 * Creates a tRPC context for React Server Components, ensuring it's request-scoped.
 * Uses React `cache` to memoize the context creation per request-render lifecycle.
 */
const createServerComponentContext = cache(async () => {
  const reqHeaders = nextHeaders(); // `headers()` is called here, inside the cached function
  const session = await auth();    // `auth()` is also called here, correctly scoped

  // Pass the Headers object from next/headers directly.
  // If createInnerTRPCContext or subsequent logic needs to *modify* headers
  // (which is rare for context), then it should clone it internally.
  // For setting x-trpc-source, that's usually for links; here it's implicit.
  return createInnerTRPCContext({
    session,
    headers: reqHeaders, // Pass the original Headers object
  });
});

/**
 * Asynchronous function to get a request-scoped tRPC API caller for Server Components.
 * Each call to this function (or rather, its awaited result) within the same
 * request-render cycle will use the same cached context.
 */
export const createServerActionClient = async () => {
  const context = await createServerComponentContext();
  return appRouter.createCaller(context);
};