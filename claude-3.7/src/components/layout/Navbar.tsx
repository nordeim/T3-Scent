// src/components/layout/Navbar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";
import { FaBars, FaTimes, FaShoppingCart, FaUserCircle } from "react-icons/fa";

import { Button } from "~/components/ui/Button";
import { ThemeToggle } from "~/components/ui/ThemeToggle";
import { useCart } from "~/contexts/CartContext";
import { cn } from "~/lib/utils";
// import { SearchBox } from "~/components/common/SearchBox"; // Assuming SearchBox component

const mainNavLinks = [
  { href: "/products", label: "All Products" },
  { href: "/collections/essential-oils", label: "Essential Oils" }, // Example collection
  { href: "/collections/diffusers", label: "Diffusers" },       // Example collection
  { href: "/quiz", label: "Scent Quiz" },
  { href: "/about", label: "About Us" },
];

const userNavLinks = [
    { href: "/account/profile", label: "My Profile" },
    { href: "/account/orders", label: "My Orders" },
    { href: "/account/subscriptions", label: "My Subscriptions" },
    { href: "/account/wishlist", label: "My Wishlist" },
    { href: "/account/loyalty", label: "Rewards" },
];


export const Navbar = () => {
  const { data: session, status } = useSession();
  const { itemCount: cartItemCount, toggleCart: openCartSidebar } = useCart(); // Assuming toggleCart opens a sidebar
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Mobile Menu Toggle - Appears first for small screens */}
        <div className="md:hidden">
          <Button variant="ghost" size="icon" onClick={toggleMobileMenu} aria-label="Toggle mobile menu">
            {isMobileMenuOpen ? <FaTimes className="h-5 w-5" /> : <FaBars className="h-5 w-5" />}
          </Button>
        </div>

        {/* Logo / Brand Name */}
        <div className="flex items-center md:mr-6"> {/* mr-6 to give space to nav items */}
          <Link href="/" className="flex items-center space-x-2" onClick={() => isMobileMenuOpen && toggleMobileMenu()}>
            {/* Replace with your actual logo component or Image */}
            {/* <Image src="/logo.png" alt="The Scent Logo" width={32} height={32} /> */}
            <span className="text-xl font-bold text-foreground">The Scent</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:flex-1 items-center gap-6 text-sm font-medium">
          {mainNavLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side icons and actions */}
        <div className="ml-auto flex items-center space-x-2 sm:space-x-3">
          {/* <div className="hidden lg:block"> <SearchBox /> </div> */}
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={openCartSidebar} aria-label="Open cart" className="relative">
            <FaShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {cartItemCount}
              </span>
            )}
          </Button>

          {status === "loading" && (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted"></div>
          )}

          {status === "unauthenticated" && (
            <Button onClick={() => signIn()} variant="outline" size="sm">
              Sign In
            </Button>
          )}

          {status === "authenticated" && session?.user && (
            <div className="relative group">
              <Button variant="ghost" size="icon" className="rounded-full">
                {session.user.image ? (
                  <Image src={session.user.image} alt={session.user.name || "User"} width={32} height={32} className="rounded-full" />
                ) : (
                  <FaUserCircle className="h-6 w-6 text-muted-foreground" />
                )}
              </Button>
              {/* User Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-popover shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 group-hover:opacity-100 focus:outline-none transition-opacity duration-150 ease-out invisible group-hover:visible"
                   role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button" tabIndex={-1}>
                <div className="py-1" role="none">
                  <div className="px-4 py-2 text-sm text-foreground border-b border-border">
                    <p className="font-medium truncate">{session.user.name || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                  </div>
                  {userNavLinks.map(link => (
                     <Link key={link.href} href={link.href} className="block px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground" role="menuitem" tabIndex={-1}>
                        {link.label}
                     </Link>
                  ))}
                  {session.user.role === "ADMIN" || session.user.role === "MANAGER" ? (
                    <Link href="/admin/dashboard" className="block px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground" role="menuitem" tabIndex={-1}>
                        Admin Dashboard
                    </Link>
                  ) : null}
                  <button
                    onClick={() => signOut()}
                    className="block w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
                    role="menuitem"
                    tabIndex={-1}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-background shadow-lg border-t border-border">
          <nav className="flex flex-col space-y-1 px-2 py-3">
            {mainNavLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="block rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={toggleMobileMenu}
              >
                {link.label}
              </Link>
            ))}
            {/* Optional: Add user links or Sign In/Out to mobile menu */}
            {status === "authenticated" && session?.user && (
                <>
                    <div className="my-2 border-t border-border"></div>
                     {userNavLinks.map(link => (
                         <Link key={link.href} href={link.href} className="block rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground" onClick={toggleMobileMenu}>
                            {link.label}
                         </Link>
                      ))}
                      {session.user.role === "ADMIN" || session.user.role === "MANAGER" ? (
                        <Link href="/admin/dashboard" className="block rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground" onClick={toggleMobileMenu}>
                            Admin Dashboard
                        </Link>
                      ) : null}
                     <button
                        onClick={() => { signOut(); toggleMobileMenu(); }}
                        className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-destructive hover:bg-destructive/10"
                      >
                        Sign Out
                      </button>
                </>
            )}
             {status === "unauthenticated" && (
                <Button onClick={() => { signIn(); toggleMobileMenu(); }} variant="outline" className="w-full mt-2">Sign In</Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};