// src/components/ui/Breadcrumbs.tsx
"use client"; // If using usePathname or client-side logic, otherwise can be server component

import Link from "next/link";
import { FaChevronRight } from "react-icons/fa";
import { cn } from "~/lib/utils";

export interface BreadcrumbItem {
  name: string;
  href: string;
  isCurrent?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  separator?: React.ReactNode;
}

export const Breadcrumbs = ({ items, className, separator = <FaChevronRight className="h-3 w-3" /> }: BreadcrumbsProps) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm text-muted-foreground", className)}>
      <ol role="list" className="flex items-center space-x-1.5 md:space-x-2">
        {items.map((item, index) => (
          <li key={item.name}>
            <div className="flex items-center">
              {index > 0 && (
                <span className="mx-1.5 md:mx-2 text-muted-foreground/70" aria-hidden="true">
                  {separator}
                </span>
              )}
              {item.isCurrent || index === items.length - 1 ? (
                <span className="font-medium text-foreground" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-primary"
                >
                  {item.name}
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};