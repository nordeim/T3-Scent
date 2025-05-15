// src/app/providers.tsx
"use client"; // This whole file is a client component boundary

import { type ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes"; // Renamed to avoid conflict if you have a custom ThemeProvider
import { CartProvider } from "~/contexts/CartContext";
import { WishlistProvider } from "~/contexts/WishlistContext"; // Assuming this is created
import { LocalizationProvider } from "~/contexts/LocalizationContext"; // Assuming this is created
import { NotificationsProvider } from "~/contexts/NotificationsContext"; // Assuming this is created
import { api } from "~/utils/api"; // For tRPC Provider (TRPCReactProvider)

// This is the tRPC provider setup with App Router
// Usually create-t3-app sets this up slightly differently if you select App Router.
// You'd import TRPCReactProvider from `~/trpc/react` or similar.
// For now, I'll assume the api object needs to be available for client components.
// The QueryClientProvider is usually part of the tRPC client setup.

// If `api.withTRPC` was used in _app.tsx, you'd typically have a TRPCProvider here.
// Let's assume `create-t3-app` would set up `TRPCReactProvider` like this:
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { useState } from "react"; // For QueryClient instantiation

// This setup for tRPC provider is more typical for App Router with `create-t3-app`
// If your `api` object isn't already wrapping a provider.
// Otherwise, if `api.withTRPC` was from Pages Router, that logic moves here.

// Simplified: The `api` object from `~/utils/api` is already configured
// to work with React Query. We just need the SessionProvider for NextAuth.
// For client-side tRPC, components will use `api.xxx.useQuery()`.
// For server-side tRPC in Server Components, you'd typically create a server-side caller.

export function Providers({ children }: { children: ReactNode }) {
  // For tRPC Query Client if not handled by api object itself (which it usually is in create-t3-app)
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: true,
      },
    },
  }));
  
  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc", // Ensure this path matches your tRPC route handler
        }),
      ],
      transformer: superjson,
    })
  );


  return (
    <SessionProvider>
      <api.Provider client={trpcClient} queryClient={queryClient}> {/* tRPC Provider */}
        <QueryClientProvider client={queryClient}> {/* React Query Provider */}
          <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <LocalizationProvider>
              <CartProvider>
                <WishlistProvider>
                  <NotificationsProvider>
                    {children}
                  </NotificationsProvider>
                </WishlistProvider>
              </CartProvider>
            </LocalizationProvider>
          </NextThemesProvider>
        </QueryClientProvider>
      </api.Provider>
    </SessionProvider>
  );
}