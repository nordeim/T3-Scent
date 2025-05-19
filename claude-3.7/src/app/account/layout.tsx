// src/app/account/layout.tsx
import { type ReactNode, Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "~/server/auth"; // NextAuth.js v5 auth function
import { FaUser, FaBoxOpen, FaHeart, FaGift, FaCreditCard, FaCog, FaSignOutAlt } from "react-icons/fa"; // Example icons
import AccountSidebarNavClient from "./AccountSidebarNavClient"; // Client component for interactive sidebar

export const metadata = {
  title: "My Account - The Scent",
  description: "Manage your account, orders, subscriptions, and preferences at The Scent.",
};

const accountNavItems = [
  { href: "/account/profile", label: "Profile", icon: <FaUser /> },
  { href: "/account/orders", label: "Orders", icon: <FaBoxOpen /> },
  { href: "/account/subscriptions", label: "Subscriptions", icon: <FaCog /> }, // Using FaCog for subscriptions
  { href: "/account/wishlist", label: "Wishlist", icon: <FaHeart /> },
  { href: "/account/loyalty", label: "Loyalty & Rewards", icon: <FaGift /> },
  { href: "/account/payment-methods", label: "Payment Methods", icon: <FaCreditCard /> }, // Example new page
  { href: "/account/addresses", label: "Addresses", icon: <FaCog /> }, // Example new page
  // Add more account links as needed
];

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    // Construct the callbackUrl dynamically based on the current path
    // This requires access to the path, which is not directly available here.
    // Middleware is a better place for dynamic callbackUrls or use a fixed one.
    redirect(`/auth/signin?callbackUrl=/account/profile`); // Redirect to profile after sign-in
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">My Account</h1>
        <p className="text-muted-foreground">Welcome back, {session.user.name || "Scent Lover"}!</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        <aside className="w-full md:w-64 lg:w-72 flex-shrink-0">
          <AccountSidebarNavClient navItems={accountNavItems} />
        </aside>
        <main className="flex-1 min-w-0"> {/* min-w-0 is important for flex children to shrink correctly */}
          <Suspense fallback={<div className="p-8 text-center">Loading account details...</div>}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}