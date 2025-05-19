// src/app/account/AccountSidebarNavClient.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "~/components/ui/Button";
import { cn } from "~/lib/utils";
import { FaSignOutAlt } from "react-icons/fa";
import { type ReactNode } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

interface AccountSidebarNavClientProps {
  navItems: NavItem[];
}

export default function AccountSidebarNavClient({ navItems }: AccountSidebarNavClientProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col space-y-1 rounded-md border border-border bg-card p-4 shadow-sm">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-primary",
            pathname === item.href
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground"
          )}
        >
          <span className="w-5 h-5">{item.icon}</span>
          {item.label}
        </Link>
      ))}
      <div className="!mt-4 pt-4 border-t border-border">
        <Button
          variant="ghost"
          onClick={() => signOut({ callbackUrl: '/' })} // Redirect to home after sign out
          className="w-full justify-start gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <FaSignOutAlt className="w-5 h-5" />
          Sign Out
        </Button>
      </div>
    </nav>
  );
}