// src/utils/api.ts

import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "~/server/api/root";

/**
 * A client-side tRPC API client instance.
 * This is an instance of `createTRPCReact<AppRouter>()`.
 *
 * This object is primarily used in **Client Components** to call tRPC procedures.
 * For **Server Components**, you should use the server-side tRPC caller
 * typically defined in `~/trpc/server.ts` (e.g., `import { api as serverApi } from '~/trpc/server';`).
 * 
 * This file re-exports the client `api` object from `~/trpc/react.tsx` for convenience
 * or if existing code relies on this path. New Client Components should ideally import
 * directly from `~/trpc/react`.
 */
export { api } from "~/trpc/react";

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;

// You can also export other tRPC related utilities or types from here if needed.
// For example, if you had specific error handling helpers for tRPC errors
// that are used across multiple client components.
