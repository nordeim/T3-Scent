// src/trpc/shared.ts
import superjson from "superjson";

/**
 * Shared tRPC transformer.
 * Useful for ensuring client and server use the same data serialization.
 */
export const transformer = superjson;

// You can also define shared helper functions or constants related to tRPC here.
// For example, a function to construct the tRPC endpoint URL:
export function getBaseUrl() {
  if (typeof window !== "undefined") return ""; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
}
