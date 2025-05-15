// src/trpc/server.ts
import "server-only"; // Ensures this is only run on the server

import { headers } from "next/headers";
import { cache } from "react";

import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(() => {
  const heads = new Headers(headers());
  heads.set("x-trpc-source", "rsc");

  // Note: `createTRPCContext` from Pages Router expects `req` and `res`.
  // This needs to be adapted for App Router server-side context creation.
  // A common pattern is to pass minimal info or derive session from cookies/headers.
  // The one used in `src/app/api/trpc/[trpc]/route.ts` is for fetch requests.
  // This one is for direct calls within the server.
  
  // Assuming createTRPCContext can be called like this for server components:
  // (This might need adjustment based on how session is obtained server-side without full req/res)
  return createTRPCContext({
    session: null, // Placeholder: Real session fetching needed here. `getServerAuthSession` is usually called directly.
                    // Or, if `createTRPCContext` uses `opts.headers` to get session, then:
    headers: heads,
    // req: undefined, // if your context expects these
    // res: undefined,
  });
});

// This is the server-side tRPC caller
// It's important that this is NOT a React hook, as it's used in Server Components.
// The `api` object from `~/utils/api.ts` is for Client Components (`createTRPCReact`).

// To use this in a Server Component:
// import { api as serverApi } from "~/trpc/server";
// const data = await serverApi.someProcedure.query();

export const api = createCaller(createContext);