// src/components/layout/Navbar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, type ReactNode } from "react";
import { FaBars, FaTimes, FaShoppingCart, FaUserCircle, FaMoon, FaSun, FaSignOutAlt } from "react-icons/fa";
import { Button } from "~/components/ui/Button";
import { ThemeToggle } from "~/components/ui/ThemeToggle";
import { useCart } from "~/contexts/CartContext";
import { cn } from "~/lib/utils";

const mainNavLinks = [
  { href: "/products", label: "All Products" },
  { href: "/collections/essential-oils", label: "Essential Oils" },
  { href: "/collections/diffusers", label: "Diffusers" },
  { href: "/quiz", label: "Scent Quiz" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact"},
];

interface UserNavLink {
    href: string;
    label: string;
    icon?: ReactNode;
}

const userNavLinks: UserNavLink[] = [
    { href: "/account/profile", label: "My Profile" },
    { href: "/account/orders", label: "My Orders" },
    { href: "/account/subscriptions", label: "My Subscriptions" },
    { href: "/account/wishlist", label: "My Wishlist" },
    { href: "/account/loyalty", label: "Rewards & Loyalty" },
];

export const Navbar = () => {
  const { data: session, status } = useSession();
  const { itemCount: cartItemCount, toggleCart } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/20 bg-background/80 shadow-sm backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 dark:bg-card/80 dark:border-border/30">
      <div className="container flex h-16 items-center sm:h-20">
        <div className="mr-4 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle mobile menu">
            {isMobileMenuOpen ? <FaTimes className="h-5 w-5" /> : <FaBars className="h-5 w-5" />}
          </Button>
        </div>

        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
            <span className="text-2xl font-bold text-foreground font-head">The Scent</span>
          </Link>
        </div>

        <nav className="hidden md:flex flex-1 items-center justify-center gap-6 lg:gap-8 text-sm">
          {mainNavLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="font-accent font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary text-[0.9rem]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className={cn("flex items-center space-x-2 sm:space-x-3", {"md:ml-auto": true } )}>
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={toggleCart} aria-label="Open cart" className="relative">
            <FaShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {cartItemCount}
              </span>
            )}
          </Button>

          {status === "loading" && ( <div className="h-9 w-20 rounded-md bg-muted animate-pulse"></div> )}
          {status === "unauthenticated" && ( <Button onClick={() => signIn()} variant="outline" size="sm">Sign In</Button> )}
          {status === "authenticated" && session?.user && (
            <div className="relative group">
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 sm:h-10 sm:w-10">
                {session.user.image ? (
                  <Image src={session.user.image} alt={session.user.name || "User"} width={36} height={36} className="rounded-full" />
                ) : ( <FaUserCircle className="h-6 w-6 text-muted-foreground" /> )}
              </Button>
              <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-popover text-popover-foreground shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible focus-within:opacity-100 focus-within:visible transition-all duration-150 ease-out"
                   role="menu" aria-orientation="vertical">
                <div className="py-1" role="none">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold truncate">{session.user.name || "Valued Customer"}</p>
                    <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                  </div>
                  {userNavLinks.map(link => (
                     <Link key={link.href} href={link.href} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted" role="menuitem" onClick={closeMobileMenu}>
                        {link.icon && <span className="w-4 h-4">{link.icon}</span>} {link.label}
                     </Link>
                  ))}
                  {(session.user.role === "ADMIN" || session.user.role === "MANAGER") && (
                    <Link href="/admin/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted" role="menuitem" onClick={closeMobileMenu}>
                        Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => { signOut({ callbackUrl: '/' }); closeMobileMenu(); }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-destructive hover:bg-destructive/10"
                    role="menuitem"
                  >
                    <FaSignOutAlt /> Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-background shadow-lg border-t border-border z-40">
          <nav className="flex flex-col space-y-1 px-3 py-4">
            {mainNavLinks.map((link) => (
              <Link key={link.label} href={link.href} onClick={closeMobileMenu}
                className="block rounded-md px-3 py-2.5 text-base font-medium text-muted-foreground hover:bg-muted hover:text-primary">
                {link.label}
              </Link>
            ))}
            <div className="my-3 border-t border-border"></div>
            {status === "authenticated" && session?.user ? (
                <>
                     {userNavLinks.map(link => (
                         <Link key={link.href} href={link.href} onClick={closeMobileMenu}
                            className="block rounded-md px-3 py-2.5 text-base font-medium text-muted-foreground hover:bg-muted hover:text-primary">
                            {link.label}
                         </Link>
                      ))}
                      {(session.user.role === "ADMIN" || session.user.role === "MANAGER") && (
                        <Link href="/admin/dashboard" onClick={closeMobileMenu}
                            className="block rounded-md px-3 py-2.5 text-base font-medium text-muted-foreground hover:bg-muted hover:text-primary">
                            Admin Dashboard
                        </Link>
                      )}
                     <button onClick={() => { signOut({ callbackUrl: '/' }); closeMobileMenu(); }}
                        className="block w-full rounded-md px-3 py-2.5 text-left text-base font-medium text-destructive hover:bg-destructive/10">
                        Sign Out
                      </button>
                </>
            ) : status === "unauthenticated" ? (
                <Button onClick={() => { signIn(); closeMobileMenu(); }} variant="default" className="w-full mt-2">Sign In</Button>
            ) : null}
          </nav>
        </div>
      )}
    </header>
  );
};