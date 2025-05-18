// src/trpc/react.tsx
"use client"; 

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, loggerLink, type TRPCLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { type ReactNode, useState } from "react";
import { type Observable, observable } from '@trpc/server/observable';
import { toast } from "react-hot-toast";

import { type AppRouter } from "~/server/api/root"; 
import { transformer, getBaseUrl } from "./shared"; // Import from shared.ts

export const api = createTRPCReact<AppRouter>();

const errorHandlingLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) => {
    return observable((observer) => {
      const unsubscribe = next(op).subscribe({
        next(value) { observer.next(value); },
        error(err) {
          observer.error(err);
          if (err.data?.code === 'UNAUTHORIZED' || err.data?.code === 'FORBIDDEN') {
            toast.error(err.message || "Access denied. Please try logging in.");
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

interface TRPCReactProviderProps {
  children: ReactNode;
  headers?: Headers; 
}

export function TRPCReactProvider({ children, headers: passedHeaders }: TRPCReactProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, 
            refetchOnWindowFocus: true,
            retry: (failureCount, error: any) => {
              if (error.data?.code === 'UNAUTHORIZED' || error.data?.code === 'FORBIDDEN' || error.data?.code === 'NOT_FOUND') {
                return false;
              }
              return failureCount < 2;
            },
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    api.createClient({
      transformer, // Use shared transformer
      links: [
        errorHandlingLink,
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: getBaseUrl() + "/api/trpc", // Use shared getBaseUrl
          headers() {
            const heads = new Map(passedHeaders); 
            heads.set("x-trpc-source", "react-client"); 
            
            const headerObject: Record<string, string> = {};
            heads.forEach((value, key) => {
              headerObject[key] = value;
            });
            return headerObject;
          },
        }),
      ],
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {children}
      </api.Provider>
    </QueryClientProvider>
  );
}
