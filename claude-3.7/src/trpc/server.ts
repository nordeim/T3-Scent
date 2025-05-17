// src/trpc/server.ts
import "server-only";
import { headers } from "next/headers";
import { cache } from "react";
import { appRouter, type AppRouter } from "~/server/api/root"; // Ensure AppRouter type is exported
import { createInnerTRPCContext } from "~/server/api/trpc"; // Use the inner context
import { auth } from "~/server/auth"; // Import the new auth method

const createContext = cache(async () => {
  const heads = new Headers(headers());
  heads.set("x-trpc-source", "rsc");
  const session = await auth();
  return createInnerTRPCContext({
    session,
    headers: heads,
  });
});

// This export name 'api' should be distinct if you also have `export const api` in `~/utils/api.ts`
// Conventionally, this might be `serverApi` or similar.
// Or ensure imports are aliased correctly in components.
// For now, keeping as `api` as per the T3 scaffold.
const caller = appRouter.createCaller(await createContext());
export { caller as api }; // Exporting as `api` for consistency with `create-t3-app` pattern if it does this