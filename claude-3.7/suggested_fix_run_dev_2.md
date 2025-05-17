<think>
The user is encountering a new set of "Module not found" errors and one "Export doesn't exist" error. This indicates that some files I previously stubbed or mentioned were either not created with the correct exports, or new dependencies on uncreated files have emerged.

Let's analyze the errors:

**Error Group 1: Missing UI/Hook Files (`Module not found: Can't resolve '~/path/to/module'`)**

1.  `Module not found: Can't resolve '~/components/ui/Rating'` (in `src/components/common/ProductCard.tsx`)
    *   **Issue:** The `Rating` component stub was not created in the previous round.
    *   **Fix:** Create `src/components/ui/Rating.tsx` with a basic functional component structure.

2.  `Module not found: Can't resolve '~/hooks/useLocalStorage'` (in `src/contexts/LocalizationContext.tsx` and `src/contexts/WishlistContext.tsx`)
    *   **Issue:** The `useLocalStorage` custom hook was assumed but not created.
    *   **Fix:** Create `src/hooks/useLocalStorage.ts` with a standard implementation for this common hook.

**Error Group 2: Export Doesn't Exist in Target Module**

1.  `Export getServerAuthSession doesn't exist in target module ... Did you mean to import auth?` (in `src/server/api/trpc.ts` trying to import from `~/server/auth.ts`)
    *   **File:** `src/server/api/trpc.ts`
    *   **Import:** `import { getServerAuthSession } from "~/server/auth";`
    *   **Previous `src/server/auth.ts` refactor:** In the previous step, I refactored `src/server/auth.ts` for NextAuth.js v5 and App Router. The main exports became `handlers`, `auth`, `signIn`, `signOut`. The `getServerAuthSession` helper (which was a Pages Router pattern wrapping `next-auth/getServerSession`) was removed or commented out.
    *   **Issue:** `createTRPCContext` in `src/server/api/trpc.ts` (the one for the *route handler* `app/api/trpc/[trpc]/route.ts`) was still trying to use the old `getServerAuthSession` helper.
    *   **Fix for `src/server/api/trpc.ts` (`createTRPCContext` for route handlers):**
        *   This context is called by `fetchRequestHandler`. It needs to get the session. With NextAuth.js v5, you usually get the session in Route Handlers using the `auth()` function exported from your `src/server/auth.ts`.
        *   The `createTRPCContext` that is passed to `initTRPC.context<typeof createTRPCContext>()` needs to be adapted to correctly use `auth()`.
        *   The `createTRPCContext` in `src/trpc/server.ts` (for Server Components) also uses `await auth()`. The two context creation functions (one for RSC, one for route handlers) might need to be slightly different or share a common inner part.

    *   **Revised `createTRPCContext` in `src/server/api/trpc.ts`:**
        It's typically defined as:
        ```typescript
        // src/server/api/trpc.ts
        import { auth } from "~/server/auth"; // Import the new auth method

        // ... createInnerTRPCContext remains the same ...

        export const createTRPCContext = async (opts: { headers: Headers; req?: NextRequest }) => {
          const session = await auth(); // Call auth() to get the session
          return createInnerTRPCContext({
            session, // This will be Session | null
            headers: opts.headers,
          });
        };
        ```
        This requires that `auth()` can be called in the context of a Route Handler (it should be able to read cookies from the request implicitly or via passed headers).

**Plan:**

1.  **Create `src/components/ui/Rating.tsx`:** A client component for displaying stars.
2.  **Create `src/hooks/useLocalStorage.ts`:** A standard `useLocalStorage` hook implementation.
3.  **Refactor `src/server/api/trpc.ts`:**
    *   Modify `createTRPCContext` (the one used by the route handler `app/api/trpc/[trpc]/route.ts`) to use `await auth()` from the refactored `src/server/auth.ts` to get the session.
4.  **Review other files:** Double-check that the tRPC client setup (`src/utils/api.ts` and `src/app/providers.tsx`) and the server-side tRPC caller (`src/trpc/server.ts`) are correctly aligned with these changes. The key is consistent session handling and context creation.

Let's implement these fixes.
</think>

You're doing an excellent job debugging these build errors! These "Module not found" and "Export doesn't exist" issues are common when setting up a new structure or refactoring. Let's address them:

---
**1. Create Missing UI Component: `src/components/ui/Rating.tsx`**

This component will display star ratings. It's often interactive for input but can be read-only for display.

```tsx
// src/components/ui/Rating.tsx
"use client";

import React, { useState } from 'react';
import { FaStar, FaRegStar, FaStarHalfAlt } from 'react-icons/fa';
import { cn } from '~/lib/utils';

interface RatingProps {
  value: number; // The current rating value (e.g., 3.5)
  count?: number; // Total number of stars (e.g., 5)
  size?: 'sm' | 'md' | 'lg'; // Size of the stars
  color?: string; // Tailwind color class for filled stars (e.g., 'text-yellow-400')
  readOnly?: boolean;
  onChange?: (value: number) => void;
  className?: string;
  showValue?: boolean; // Whether to show the numeric value next to stars
}

export const Rating: React.FC<RatingProps> = ({
  value,
  count = 5,
  size = 'md',
  color = 'text-yellow-400', // Default star color
  readOnly = true,
  onChange,
  className,
  showValue = false,
}) => {
  const [hoverValue, setHoverValue] = useState<number | undefined>(undefined);

  const stars = Array.from({ length: count }, (_, i) => i + 1);

  const handleClick = (newValue: number) => {
    if (!readOnly && onChange) {
      onChange(newValue);
    }
  };

  const handleMouseEnter = (newValue: number) => {
    if (!readOnly) {
      setHoverValue(newValue);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverValue(undefined);
    }
  };

  const starSizeClass = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }[size];

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {stars.map((starValue) => {
        const effectiveValue = hoverValue ?? value;
        let StarComponent = FaRegStar; // Default to empty star

        if (effectiveValue >= starValue) {
          StarComponent = FaStar; // Full star
        } else if (effectiveValue >= starValue - 0.5) {
          StarComponent = FaStarHalfAlt; // Half star
        }

        return (
          <StarComponent
            key={starValue}
            className={cn(
              starSizeClass,
              effectiveValue >= starValue - 0.5 ? color : 'text-gray-300 dark:text-gray-600',
              !readOnly && 'cursor-pointer transition-transform hover:scale-110'
            )}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            aria-hidden="true" // Individual stars are decorative, overall rating conveyed by value/aria-label
          />
        );
      })}
      {showValue && <span className="ml-2 text-sm font-medium text-muted-foreground">{value.toFixed(1)}</span>}
    </div>
  );
};
```

---
**2. Create Missing Custom Hook: `src/hooks/useLocalStorage.ts`**

This is a common custom hook to manage state that persists in `localStorage`.

```ts
// src/hooks/useLocalStorage.ts
"use client"; // This hook uses browser APIs (localStorage) and useState/useEffect

import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';

// Type for the return value of useLocalStorage
type UseLocalStorageReturn<T> = [T, Dispatch<SetStateAction<T>>, () => void];

/**
 * A custom React hook to manage state that persists in localStorage.
 * @param key The key to use in localStorage.
 * @param initialValue The initial value if nothing is found in localStorage.
 * @returns A stateful value, a function to update it, and a function to remove it from localStorage.
 */
export function useLocalStorage<T>(key: string, initialValue: T): UseLocalStorageReturn<T> {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      // Prevent errors during SSR or build when window is not available
      return initialValue;
    }
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // useEffect to update local storage when the state changes
  // This only runs on the client-side after hydration
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      if (storedValue === undefined) {
        // If value is undefined, remove item from localStorage (optional behavior)
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Function to remove the item from localStorage and reset state
  const removeValue = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue); // Reset state to initial value
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setStoredValue, removeValue];
}
```

---
**3. Refactor `src/server/api/trpc.ts` for Session Handling in `createTRPCContext`**

The error `Export getServerAuthSession doesn't exist in target module` means that `src/server/auth.ts` no longer exports `getServerAuthSession` after we refactored it for NextAuth.js v5 (it now exports `auth`, `handlers`, etc.). The `createTRPCContext` function, which is used by the tRPC route handler (`src/app/api/trpc/[trpc]/route.ts`), needs to get the session using the new `auth()` method.

```ts
// src/server/api/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next"; // Still relevant if old type was used.
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch"; // More relevant for fetchRequestHandler
import { type Session } from "next-auth";
import superjson from "superjson";
import { ZodError } from "zod";

import { auth } from "~/server/auth"; // Import the `auth` function from NextAuth.js v5 setup
import { db } from "~/server/db";
import type { Role as PrismaAppRole } from "@prisma/client";
import type { NextRequest } from "next/server"; // For Route Handler context

// This is the inner context that both RSC and Route Handler contexts can create
type CreateInnerContextOptions = {
  session: Session | null;
  headers: Headers; // Pass headers for potential use
  // db is implicitly available via import
};

export const createInnerTRPCContext = (opts: CreateInnerContextOptions) => {
  return {
    session: opts.session,
    db,
    headers: opts.headers,
  };
};

/**
 * This is the actual context you will use in your router. It will be used to process every request
 * that goes through your tRPC endpoint for API Route Handlers.
 */
export const createTRPCContext = async (opts: {
  req: NextRequest; // The NextRequest object from the Route Handler
  // resHeaders?: Headers; // If you need to set response headers from context
}) => {
  const session = await auth(); // `auth()` gets the session using cookies from the request
  
  return createInnerTRPCContext({
    session,
    headers: opts.req.headers, // Pass request headers
  });
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated." });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

const enforceUserIsAdminOrManager = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
     throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated." });
  }
  const userRole = ctx.session.user.role;
  if (userRole !== PrismaAppRole.ADMIN && userRole !== PrismaAppRole.MANAGER) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not have sufficient permissions for this action." });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const adminProcedure = t.procedure.use(enforceUserIsAdminOrManager);

export const roleProtectedProcedure = (allowedRoles: PrismaAppRole[]) =>
  t.procedure.use(
    t.middleware(async ({ ctx, next }) => {
      if (!ctx.session?.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: "Not authenticated." });
      }
      if (!allowedRoles.includes(ctx.session.user.role)) {
        // TODO: Add more granular check based on ctx.session.user.roleDefinitionId and associated permissions
        throw new TRPCError({ code: 'FORBIDDEN', message: "You do not have the required role for this action." });
      }
      return next({
        ctx: {
          session: { ...ctx.session, user: ctx.session.user },
        },
      });
    })
  );
```

**Note on `createTRPCContext` in `src/server/api/trpc.ts`:**
The `createTRPCContext` function here is now tailored for the `fetchRequestHandler` used in `src/app/api/trpc/[trpc]/route.ts`. It expects a `NextRequest` object (or at least its headers) and uses the NextAuth.js v5 `auth()` function to retrieve the session.

**Note on `src/trpc/server.ts` (Server Component tRPC Caller):**
The `createContext` function inside `src/trpc/server.ts` also needs to align with this. It should also use `await auth()` to get the session.
```ts
// src/trpc/server.ts
import "server-only";
import { headers } from "next/headers";
import { cache } from "react";
import { appRouter, type AppRouter } from "~/server/api/root"; // Ensure AppRouter type is exported
import { createInnerTRPCContext } from "~/server/api/trpc"; // Use the inner context
import { auth } from "~/server/auth"; // Import the new auth method

const createContext = cache(async () => {
  const heads = new Headers(headers());
  heads.set("x-trpc-source", "rsc");
  const session = await auth();
  return createInnerTRPCContext({
    session,
    headers: heads,
  });
});

// This export name 'api' should be distinct if you also have `export const api` in `~/utils/api.ts`
// Conventionally, this might be `serverApi` or similar.
// Or ensure imports are aliased correctly in components.
// For now, keeping as `api` as per the T3 scaffold.
const caller = appRouter.createCaller(await createContext());
export { caller as api }; // Exporting as `api` for consistency with `create-t3-app` pattern if it does this
```

---

**Summary and Conclusion:**

1.  **Missing Component (`Rating.tsx`):** A functional stub for `Rating.tsx` has been provided. You'll need to implement its visual styling and full interactivity.
2.  **Missing Hook (`useLocalStorage.ts`):** A standard implementation for `useLocalStorage` has been provided.
3.  **`src/server/api/trpc.ts` (`createTRPCContext`):** This file has been updated so its `createTRPCContext` function (used by the tRPC route handler) correctly obtains the session using the `auth()` function from the NextAuth.js v5 setup in `src/server/auth.ts`. This resolves the "Export getServerAuthSession doesn't exist" error.
4.  **`src/trpc/server.ts`:** This file (for Server Component tRPC calls) has also been updated to use `await auth()` within its context creation.

**Next Steps for You:**
1.  Create the new files `src/components/ui/Rating.tsx` and `src/hooks/useLocalStorage.ts` with the provided content.
2.  Replace the contents of `src/server/api/trpc.ts` and `src/trpc/server.ts` with the updated versions above.
3.  Run `npm install` if you haven't already for any newly added dependencies from previous steps (like `clsx`, `tailwind-merge`, etc.).
4.  Try `npm run dev` again.

These changes should resolve the current set of errors. You may encounter further "Module not found" errors for other UI components that are used but not yet created (like specific admin dashboard widgets or layout parts like `Navbar`). You would continue to create stubs for those as they appear, gradually building out the UI.

---
https://drive.google.com/file/d/10qxhCB7k2c3G73SUaEIfKVKSqgWSjkQo/view?usp=sharing, https://drive.google.com/file/d/19R6AOLUeAYzo73Zkt5WTqLrdQLvjfEq9/view?usp=sharing, https://drive.google.com/file/d/1M29mvmeDZQQ5X72Yfx2_0-vycXBG5pF8/view?usp=sharing, https://drive.google.com/file/d/1NC4s3DVR1LDzX-LCZlMMd5NrShFBidnd/view?usp=sharing, https://aistudio.google.com/app/prompts?state=%7B%22ids%22:%5B%221QNYodene0vrlxMvFDFKJ0CSSeS2lX2t2%22%5D,%22action%22:%22open%22,%22userId%22:%22103961307342447084491%22,%22resourceKeys%22:%7B%7D%7D&usp=sharing, https://drive.google.com/file/d/1qxPDWhlmzq9-R3H1YDAVwCyPjpwQ4ZJO/view?usp=sharing

