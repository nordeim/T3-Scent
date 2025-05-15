// src/utils/api.ts (Largely same as before, client-side focused)
// This is primarily for Client Components. Server Components might use a direct server client.

import { httpBatchLink, loggerLink, TRPCLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query"; // Changed from createTRPCNext
import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";
import superjson from "superjson";
import { type Observable, observable } from '@trpc/server/observable';
import { type AppRouter } from "~/server/api/root";
import { toast } from "react-hot-toast";

const getBaseUrl = () => {
  if (typeof window !== "undefined") return ""; 
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; 
  return `http://localhost:${process.env.PORT ?? 3000}`; 
};

// Custom link to handle errors globally
const errorHandlingLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) => {
    return observable((observer) => {
      const unsubscribe = next(op).subscribe({
        next(value) { observer.next(value); },
        error(err) {
          observer.error(err);
          if (err.data?.code === 'UNAUTHORIZED' || err.data?.code === 'FORBIDDEN') {
            toast.error(err.message || "Access denied. Please try logging in.");
            // Potentially trigger a redirect to sign-in if on client-side
            if (typeof window !== 'undefined') {
              // window.location.href = '/auth/signin'; 
            }
          } else if (err.data?.zodError) {
            const zodErrors = err.data.zodError.fieldErrors;
            let messages: string[] = [];
            for (const field in zodErrors) {
                if (zodErrors[field]) {
                    messages = messages.concat(zodErrors[field] as string[]);
                }
            }
            toast.error(`Input error: ${messages.join(', ')}`);
          } else {
            toast.error(err.message || "An unexpected error occurred.");
          }
        },
        complete() { observer.complete(); },
      });
      return unsubscribe;
    });
  };
};

// This is the primary client for React components (Client Components)
export const api = createTRPCReact<AppRouter>();

// You might also have a server-side caller for use in Server Components / Route Handlers
// Example (often provided by create-t3-app in `src/trpc/server.ts` or similar):
/*
import { appRouter } from '~/server/api/root';
import { createTRPCContext } from '~/server/api/trpc'; // The one for server-side execution
import { createServerSideHelpers } from '@trpc/react-query/server';
import superjson from 'superjson';

export const serverApi = async () => {
  // This context creation might need to be adapted if it expects req/res from Pages Router.
  // For server components, you might not have a full req/res.
  // Often, you'd get the session differently here for server-side calls.
  const context = await createTRPCContext({ // This context needs to be callable without req/res
    headers: new Headers(), // Dummy headers for server-side calls
  });
  return appRouter.createCaller(context);
}

export const helpers = createServerSideHelpers({
  router: appRouter,
  ctx: {} // Provide a minimal context or a way to create one server-side
  transformer: superjson,
});
*/


export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
