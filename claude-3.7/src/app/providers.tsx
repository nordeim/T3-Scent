// src/app/providers.tsx
"use client";

import { type ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { CartProvider } from "~/contexts/CartContext";
import { WishlistProvider } from "~/contexts/WishlistContext";
import { LocalizationProvider } from "~/contexts/LocalizationContext";
import { NotificationsProvider } from "~/contexts/NotificationsContext";
import { TRPCReactProvider } from "~/trpc/react";
// DO NOT import { headers } from "next/headers" here; it's server-only.

interface ProvidersProps {
  children: ReactNode;
  requestHeaders?: Headers; // Accept headers as a prop
}

export function Providers({ children, requestHeaders }: ProvidersProps) {
  return (
    <SessionProvider>
      <TRPCReactProvider headers={requestHeaders}> {/* Pass headers to TRPCReactProvider */}
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
      </TRPCReactProvider>
    </SessionProvider>
  );
}