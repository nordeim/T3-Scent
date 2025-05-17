// src/components/layout/Navbar.tsx
"use client"; // Navbar often has client-side logic (dropdowns, theme toggle, session state)

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { ThemeToggle } from "~/components/ui/ThemeToggle";
import { Button } from "~/components/ui/Button";
// import { SearchBox } from "./SearchBox"; // Assuming SearchBox component
// import { CartIcon } from "../cart/CartIcon"; // Assuming CartIcon component

export const Navbar = () => {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            {/* <YourLogoComponent /> */}
            <span className="inline-block font-bold">The Scent</span>
          </Link>
          <nav className="hidden gap-6 md:flex">
            <Link href="/products" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Products
            </Link>
            <Link href="/quiz" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Scent Quiz
            </Link>
            {/* Add other nav links */}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          {/* <div className="hidden lg:flex flex-1 justify-center px-4">
            <SearchBox />
          </div> */}
          <ThemeToggle />
          {/* <CartIcon /> */}
          {status === "loading" && (
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted"></div>
          )}
          {status === "unauthenticated" && (
            <Button onClick={() => signIn()} variant="outline">Sign In</Button>
          )}
          {status === "authenticated" && session?.user && (
            <div className="flex items-center gap-2">
              <span className="text-sm hidden sm:inline">Hi, {session.user.name?.split(' ')[0]}</span>
              <Button onClick={() => signOut()} variant="ghost" size="sm">Sign Out</Button>
              <Link href="/account/profile"> {/* Placeholder for account page */}
                <Image src={session.user.image || "/images/default-avatar.png"} alt="User avatar" width={32} height={32} className="rounded-full" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
