<think>
The user is encountering a series of "Module not found" errors and some export-related errors after running `npm run dev`. This usually points to missing dependencies or incorrect import paths/exports.

Let's break down the errors and plan fixes:

**Error Group 1: Missing Dependencies (`Module not found: Can't resolve 'package-name'`)**

These errors indicate that the listed packages are used in the code but are not declared in `package.json` or haven't been installed correctly.

1.  `@next-auth/prisma-adapter`: Used in `src/server/auth.ts`.
    *   **Package.json check:** It *is* listed: `"@auth/prisma-adapter": "^2.7.2"`.
    *   **Issue:** The import path in `auth.ts` is `@next-auth/prisma-adapter`, but the installed package name (from `package.json`) is `@auth/prisma-adapter`. This is a common change with NextAuth.js v5. `create-t3-app` likely uses the newer `@auth/` scoped packages.
    *   **Fix:** Change the import in `src/server/auth.ts`.

2.  `@tailwindcss/forms`: Used in `tailwind.config.ts`.
    *   **Package.json check:** Not listed in dependencies or devDependencies.
    *   **Fix:** Install `npm install -D @tailwindcss/forms` and ensure the `require` path is correct.

3.  `@tailwindcss/typography`: Used in `tailwind.config.ts`.
    *   **Package.json check:** Not listed.
    *   **Fix:** Install `npm install -D @tailwindcss/typography`.

4.  `@vercel/analytics/react`: Used in `src/app/layout.tsx`.
    *   **Package.json check:** Not listed.
    *   **Fix:** Install `npm install @vercel/analytics`. The import path should be `@vercel/analytics/react`.

5.  `@vercel/speed-insights/next`: Used in `src/app/layout.tsx`.
    *   **Package.json check:** Not listed.
    *   **Fix:** Install `npm install @vercel/speed-insights`. The import path should be `@vercel/speed-insights/next`.

6.  `bcryptjs`: Used in `src/server/auth.ts`.
    *   **Package.json check:** Not listed.
    *   **Fix:** Install `npm install bcryptjs` and `npm install -D @types/bcryptjs`.

7.  `next-themes`: Used in `src/app/providers.tsx`.
    *   **Package.json check:** Not listed.
    *   **Fix:** Install `npm install next-themes`.

8.  `react-hot-toast`: Used in `src/components/ui/AudioToggle.tsx`, `src/contexts/CartContext.tsx`, `src/utils/api.ts`.
    *   **Package.json check:** Not listed.
    *   **Fix:** Install `npm install react-hot-toast`.

9.  `react-icons/fa`: Used in `src/components/ui/AudioToggle.tsx` and `ThemeToggle.tsx` (and many others I generated).
    *   **Package.json check:** Not listed.
    *   **Fix:** Install `npm install react-icons`.

10. `stripe`: Used in `src/server/api/routers/orders.ts`.
    *   **Package.json check:** Not listed.
    *   **Fix:** Install `npm install stripe`.

11. `tailwindcss-animate`: Used in `tailwind.config.ts`.
    *   **Package.json check:** Not listed.
    *   **Fix:** Install `npm install -D tailwindcss-animate`.

**Error Group 2: Missing Files (`Module not found: Can't resolve '~/path/to/module'`)**

These indicate that files are being imported that do not exist at the specified path, or the import alias `~` is not configured correctly (though `create-t3-app` usually handles this). Given the number of these, it's likely due to the placeholder/stubbed files I mentioned I would create. I need to provide these stubbed files.

*   `~/components/layout/Footer`
*   `~/components/layout/Navbar`
*   `~/components/products/ProductGrid`
*   `~/components/ui/Toaster`
*   `~/contexts/LocalizationContext` (I *did* provide this, so this might be a path issue or a subtle naming mismatch if `src/env.js` implies a different `src` root than `~/` implies)
*   `~/contexts/NotificationsContext`
*   `~/contexts/WishlistContext`
*   `~/lib/utils` (Often for `cn` function used with Shadcn/ui)
*   `~/server/api/routers/admin/analytics`
*   `~/server/api/routers/admin/inventory`
*   `~/server/api/routers/admin/orders`
*   `~/server/api/routers/admin/roles`
*   `~/server/api/routers/admin/settings`
*   `~/server/api/routers/admin/users`
*   `~/server/api/routers/loyalty`
*   `~/server/api/routers/notifications`
*   `~/server/api/routers/quiz`
*   `~/server/api/routers/reviews`
*   `~/server/api/routers/smartHome`
*   `~/server/api/routers/subscriptions`
*   `~/server/api/routers/users`
*   `~/server/api/routers/wishlist`

**Fix for Missing Files:** Create basic stub/placeholder files for each of these. The content of these stubs will be minimal, just enough to resolve the import and export something plausible. For routers, they'll export an empty `createTRPCRouter({})`. For components, a simple functional component. For contexts, a basic context structure.

**Error Group 3: Export Doesn't Exist in Target Module**

1.  `./src/trpc/server.ts:7:1 Export createCaller doesn't exist in target module ... Did you mean to import appRouter?`
    *   **File:** `src/trpc/server.ts`
    *   **Import:** `import { createCaller } from "~/server/api/root";`
    *   **File `~/server/api/root.ts` contents:**
        ```typescript
        // src/server/api/root.ts
        // ...
        export const appRouter = createTRPCRouter({ /* ... */ });
        export type AppRouter = typeof appRouter;
        ```
    *   **Issue:** `createCaller` is not exported from `~/server/api/root.ts`. `createCaller` is a method *on* the `appRouter` object itself.
    *   **Fix:** In `src/trpc/server.ts`, change to `import { appRouter } from "~/server/api/root";` and then use `appRouter.createCaller(...)`.

2.  `./tailwind.config.ts:3:1 Export fontFamily doesn't exist in target module ... Did you mean to import default?`
    *   **File:** `tailwind.config.ts`
    *   **Import:** `import { fontFamily } from "tailwindcss/defaultTheme";`
    *   **Issue:** The `tailwindcss/defaultTheme` module likely exports the theme object as a default export, or `fontFamily` is a direct key on that default export.
    *   **Fix:** Change the import to `import defaultTheme from "tailwindcss/defaultTheme";` and then access `defaultTheme.fontFamily`. Or, if `fontFamily` is a named export from a different path within `tailwindcss`, adjust. Checking `tailwindcss` docs, `defaultTheme.fontFamily` is correct if `defaultTheme` is imported.

3.  `./src/server/auth.ts:4:1 Export getServerSession doesn't exist in target module ... Did you mean to import CredentialsSignin?`
    *   **File:** `src/server/auth.ts`
    *   **Import:**
        ```typescript
        import {
          getServerSession,
          type DefaultSession,
          type NextAuthOptions,
          type User as NextAuthUserInternal,
        } from "next-auth";
        ```
    *   **Issue:** For NextAuth.js v5, `getServerSession` is still the way to get session server-side, but `create-t3-app` with NextAuth v5 might set up auth differently, often by exporting `auth` and `handlers` from an `auth.ts` file that uses `NextAuth(authOptions)`. The `getServerAuthSession` wrapper I made might be redundant or need to use a different base call if the T3 scaffold with Auth.js v5 provides its own way.
        *   Looking at NextAuth.js v5 (`auth-core`), `getServerSession` is still a valid export. This might be an intermittent issue or a problem with how `next-auth` types are being resolved with beta versions.
        *   The `package.json` shows `"next-auth": "5.0.0-beta.25"`.
        *   The `auth.ts` I provided exports `getServerAuthSession` which itself calls `getServerSession` from `next-auth`. The error seems to be about the direct import *from* `next-auth`.
        *   **Let's check the `next-auth` v5 documentation for App Router:** In App Router, you typically get the session using `await auth()` (from `next-auth`) in Server Components or Route Handlers if you export `auth` from your `auth.ts` (e.g., `export const { handlers, auth, signIn, signOut } = NextAuth(authOptions)`).
        *   The `getServerAuthSession` helper is more of a Pages Router pattern.
    *   **Fix for `auth.ts` for App Router:**
        *   The main export from `src/server/auth.ts` should be the result of `NextAuth(authOptions)`.
        *   For Server Components and Route Handlers, they should import `auth` from this file and use `await auth()`.
        *   The `getServerAuthSession` *wrapper* might no longer be needed or structured this way.
        *   The `withAuthProtection` and `withAdminAuth` HOCs are for Pages Router `getServerSideProps`. For App Router, protection is done via middleware, layout checks, or checks within Server Components.
    *   **This requires a significant refactor of `src/server/auth.ts` to align with NextAuth.js v5 App Router patterns.**

**Consolidated Plan:**

1.  **Dependencies:**
    *   First, I will list all `npm install` commands for the missing dependencies.
    *   Correct the import path for `@auth/prisma-adapter` in `src/server/auth.ts`.
2.  **Tailwind Config:**
    *   Fix the `fontFamily` import in `tailwind.config.ts`.
3.  **`src/server/auth.ts` Refactor for NextAuth.js v5 and App Router:**
    *   Modify `src/server/auth.ts` to export `handlers`, `auth`, `signIn`, `signOut` from `NextAuth(authOptions)`.
    *   Remove the `getServerAuthSession` HOC wrapper and `withAuthProtection`/`withAdminAuth` HOCs as they are Pages Router patterns. Route/page protection in App Router is handled differently (middleware, layout checks, direct `await auth()` in server components).
    *   Adjust type declarations if needed to match NextAuth.js v5 structures.
4.  **tRPC Server Caller (`src/trpc/server.ts`):**
    *   Fix the `createCaller` import.
    *   Adapt `createTRPCContext` inside `src/trpc/server.ts` to correctly fetch the session using `await auth()` from the refactored `src/server/auth.ts`.
5.  **Create Stub Files:** Generate minimal placeholder files for all the "Module not found" errors related to local project files (`~/components/...`, `~/contexts/...`, etc.) to satisfy the imports.
6.  **Review and Output:** Provide the updated files.

This is a multi-step process. I'll start with dependency installations and small fixes, then tackle the `auth.ts` refactor, and finally the stub files.
</think>

You've hit a common phase in setting up a complex project: dependency mismatches and adapting to new framework paradigms (like Next.js App Router with NextAuth.js v5). Let's address these issues systematically.

**1. Install Missing Dependencies and Fix Import Paths:**

First, you'll need to install the missing packages. Open your terminal in the project root and run:

```bash
npm install @tailwindcss/forms @tailwindcss/typography @vercel/analytics @vercel/speed-insights bcryptjs next-themes react-hot-toast react-icons stripe tailwindcss-animate
npm install -D @types/bcryptjs
```

Then, in `src/server/auth.ts`, the import for PrismaAdapter needs to be corrected due to NextAuth.js v5 changes:

Change:
`import { PrismaAdapter } from "@next-auth/prisma-adapter";`
To:
`import { PrismaAdapter } from "@auth/prisma-adapter";`

**2. Update `tailwind.config.ts` for `fontFamily` import:**

The `fontFamily` export from `tailwindcss/defaultTheme` should be accessed via the default import.

```ts
// tailwind.config.ts
import { type Config } from "tailwindcss";
// import { fontFamily } from "tailwindcss/defaultTheme"; // Old
import defaultTheme from "tailwindcss/defaultTheme"; // New

export default {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}", // Keep if you have any Pages Router structure left (e.g. for some API routes not in app/api)
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          light: "#4fd1c5",
          dark: "#1a5b68", 
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          light: "#f6ad55",
          dark: "#c67c3e",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          light: "#ff8c69",
          dark: "#e25c39",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans], // Corrected usage
        // display: ["var(--font-display)", ...defaultTheme.fontFamily.sans],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        fadeOut: { "0%": { opacity: "1" }, "100%": { opacity: "0" } },
        slideInRight: { "0%": { transform: "translateX(100%)", opacity: "0" }, "100%": { transform: "translateX(0)", opacity: "1" } },
        slideInLeft: { "0%": { transform: "translateX(-100%)", opacity: "0" }, "100%": { transform: "translateX(0)", opacity: "1" } },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        fadeIn: "fadeIn 0.5s ease-in-out",
        fadeOut: "fadeOut 0.5s ease-in-out",
        slideInRight: "slideInRight 0.5s ease-in-out",
        slideInLeft: "slideInLeft 0.5s ease-in-out",
        shimmer: "shimmer 2s infinite linear",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
} satisfies Config;
```

**3. Refactor `src/server/auth.ts` for NextAuth.js v5 and App Router:**

NextAuth.js v5 introduces a more streamlined way to handle auth, especially with the App Router. The `getServerSession` wrapper and HOCs are less common. Instead, you export handlers and an `auth` function.

```ts
// src/server/auth.ts
import NextAuth, { type DefaultSession, type User as NextAuthUser } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter"; // Corrected import
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { db } from "~/server/db";
import { compare } from "bcryptjs";
import { env } from "~/env.js"; // Assuming your env file is .js based on error logs
import type { Role as PrismaAppRole } from "@prisma/client";

// Define your extended User and Session types for NextAuth.js v5
// The 'User' type from next-auth here refers to the shape of the user object
// that providers return and that is available in callbacks.
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: PrismaAppRole;
      roleDefinitionId?: string | null;
    } & DefaultSession["user"]; // Includes name, email, image from DefaultSession["user"]
  }

  // This is the user object passed to JWT and session callbacks, and returned by `auth()`
  interface User extends NextAuthUser { // Extends the base NextAuthUser
    role: PrismaAppRole;
    roleDefinitionId?: string | null;
  }
}

// If using JWT strategy, extend the JWT type
declare module "@auth/core/jwt" { // Note: path for JWT type in v5 might be different, check docs if issue
  interface JWT {
    id: string;
    role: PrismaAppRole;
    roleDefinitionId?: string | null;
    // name, email, picture are often included by default with OAuth
  }
}

export const authConfig = { // Renamed to authConfig for clarity, can still be authOptions
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID || "", // Provide default empty string if optional
      clientSecret: env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "john.doe@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error("Auth: Missing credentials");
          return null;
        }
        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await db.user.findUnique({
          where: { email: email },
        });

        if (!user) {
          console.error("Auth: No user found with email:", email);
          return null;
        }
        if (!user.password) {
          console.error("Auth: User found but no password set:", email);
          return null;
        }

        const isValidPassword = await compare(password, user.password);
        if (!isValidPassword) {
          console.error("Auth: Invalid password for user:", email);
          return null;
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          roleDefinitionId: user.roleDefinitionId,
        }; // This object must match the NextAuth `User` interface structure
      },
    }),
  ],
  callbacks: {
    // The `user` param here is the object returned from `authorize` or OAuth profile
    jwt: async ({ token, user }) => {
      if (user) {
        // Persist these properties to the JWT
        token.id = user.id;
        token.role = user.role; // user.role comes from authorize() or OAuth profile mapping
        token.roleDefinitionId = user.roleDefinitionId;
        // Standard OAuth claims like name, email, picture are often automatically added to token
        // token.name = user.name;
        // token.email = user.email;
        // token.picture = user.image;
      }
      return token;
    },
    // The `token` param here is the JWT from the `jwt` callback
    session: ({ session, token }) => {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as PrismaAppRole;
        session.user.roleDefinitionId = token.roleDefinitionId as string | undefined | null;
        // session.user.name = token.name; // Already part of DefaultSession["user"]
        // session.user.email = token.email; // Already part of DefaultSession["user"]
        // session.user.image = token.picture; // Already part of DefaultSession["user"]
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    // newUser: "/auth/welcome", // If you have a specific page for new OAuth users
  },
  // secret: env.AUTH_SECRET, // Auth.js v5 uses AUTH_SECRET from env by default
  trustHost: env.AUTH_TRUST_HOST, // From env.js
  // basePath: "/api/auth", // Default, usually not needed to set explicitly
} satisfies Parameters<typeof NextAuth>[0]; // Type assertion for config

// Export handlers and auth function for App Router
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// You can still create a helper to get session in server components for convenience
// if you don't want to call `await auth()` everywhere.
// However, `await auth()` is the idiomatic way in App Router Server Components.
// export const getServerActionAuthSession = async () => {
//   const session = await auth(); // auth() can be called directly in Server Components/Actions
//   if (!session?.user) return null;
//   return session;
// };
```
**Note on `auth.ts`:**
*   The HOCs `withAuthProtection` and `withAdminAuth` are Pages Router patterns for `getServerSideProps`. In App Router, route protection is typically handled with Next.js Middleware (`src/middleware.ts`) or by checking the session directly in layouts or Server Components using `await auth()`.

**4. Fix `src/trpc/server.ts`:**

This file provides a way to call tRPC procedures from Server Components.

```ts
// src/trpc/server.ts
import "server-only";

import { cache } from "react";
import { headers } from "next/headers"; // For App Router to get request headers

import { appRouter } from "~/server/api/root"; // Correctly import the appRouter
import { createTRPCContext as createInnerContext } from "~/server/api/trpc"; // The inner context creator
import { auth } from "~/server/auth"; // Import the auth function from your refactored auth.ts

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(async () => {
  // `cache` is used to memoize the context creation per request.
  const heads = new Headers(headers());
  heads.set("x-trpc-source", "rsc"); // Identify request source

  // Get session using the new `auth()` helper from NextAuth.js v5
  const session = await auth();

  // Pass the session to your inner context creator
  return createInnerContext({
    session, // This is the NextAuth.js Session object
    headers: heads, // Pass headers if your context needs them
  });
});

// Create the server-side tRPC caller using the appRouter
export const api = appRouter.createCaller(await createContext());
```
**Note for `createTRPCContext` in `src/server/api/trpc.ts`:**
Your `createInnerTRPCContext` in `src/server/api/trpc.ts` takes `opts: { session: Session | null; headers?: Headers }`.
The `createTRPCContext` (for route handlers) needs to be adapted to this or a new one for server components created.
The one I had for route handlers:
```typescript
// src/server/api/trpc.ts
// ...
// This is the one used by fetchRequestHandler in app/api/trpc/[trpc]/route.ts
export const createTRPCContext = async (opts: { headers: Headers, req?: NextRequest }) => { // req can be added if needed
  const session = await auth(); // auth() should work here if cookies are forwarded
  return createInnerTRPCContext({
    session,
    headers: opts.headers,
  });
};
// ...
```
The `createCaller` in `src/trpc/server.ts` should use a context that makes sense for server-side execution (usually involves getting session via `await auth()`).

**5. Create Placeholder/Stub Files:**

You have many "Module not found" errors for local files. This means these files need to be created. Here are examples. You'll need to create all of them.

**Example: `src/components/layout/Navbar.tsx`**
```tsx
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
```

**Example: `src/server/api/routers/users.ts` (Stub)**
```ts
// src/server/api/routers/users.ts
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { z } from "zod";

export const usersRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    // Placeholder: Fetch user profile
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      // select necessary fields
    });
    return user;
  }),
  // Add other user-related procedures here
});
```

You will need to create similar stubs for *all* the missing local files:
*   `Footer.tsx`, `ProductGrid.tsx`, `Toaster.tsx` (this is usually `react-hot-toast`'s `<Toaster/>` component placed in root layout)
*   All missing context files (`LocalizationContext.tsx`, `NotificationsContext.tsx`, `WishlistContext.tsx`) - I provided these earlier, ensure they are correctly placed.
*   `lib/utils.ts` (often contains a `cn` function for Tailwind class merging).
*   All missing tRPC router files (admin and user-facing). For each, create a file that exports an empty router:
    ```ts
    // Example: src/server/api/routers/quiz.ts
    import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
    export const quizRouter = createTRPCRouter({
        // getAdvancedQuizQuestions: publicProcedure.query... (add stubs for procedures if known)
    });
    ```

**`src/lib/utils.ts` (Commonly used with Shadcn/ui for class names)**
```ts
// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add other general utility functions here if needed
```

**`src/components/ui/Toaster.tsx` (If you are using `react-hot-toast` directly)**
If you're using `react-hot-toast`, you usually just import and render its `<Toaster />` component in your root layout. If `~/components/ui/Toaster` is a custom wrapper or from Shadcn/ui, it would look different. Assuming direct use:
```tsx
// This might not be a separate file if you directly use react-hot-toast's Toaster in layout.
// If it's a Shadcn/ui style toaster, it would be different.
// For now, this assumes you might have a wrapper, but often it's direct.
// For react-hot-toast, you would add `<Toaster />` in your RootLayout or Providers.
// No specific component ~/components/ui/Toaster is strictly needed for react-hot-toast itself.
// The error might be because your layout.tsx tries to import it.
// Let's assume it's just a re-export or a placeholder for now.

// src/components/ui/Toaster.tsx
export { Toaster } from 'react-hot-toast'; // Simplest case: re-export

// Or, if it's a custom component (unlikely needed for basic use):
// "use client";
// import { Toaster as HotToaster } from "react-hot-toast";
// export const Toaster = () => {
//   return <HotToaster position="top-right" reverseOrder={false} />;
// };
```
In `src/app/layout.tsx`, ensure `Toaster` is correctly imported, likely directly from `react-hot-toast`.

**Summary of Actions:**

1.  **Install all missing dependencies** listed above.
2.  **Correct the import path** in `src/server/auth.ts` from `@next-auth/prisma-adapter` to `@auth/prisma-adapter`.
3.  **Update `tailwind.config.ts`** to correctly import and use `defaultTheme.fontFamily`.
4.  **Refactor `src/server/auth.ts`** for NextAuth.js v5 App Router patterns (exporting `handlers`, `auth`, `signIn`, `signOut`).
5.  **Update `src/trpc/server.ts`** to use `appRouter.createCaller` and the refactored `auth()` for session in context.
6.  **Create all missing stub files** for components, contexts, libraries, and tRPC routers to resolve "Module not found" errors. Place them in the correct directories (e.g., `src/components/layout/Navbar.tsx`, `src/server/api/routers/quiz.ts`).

After these changes, run `npm install` again (if you haven't after adding packages) and then `npm run dev`. This should clear up the majority, if not all, of these build errors. The remaining work would be to implement the logic within the stubbed files.

---
https://drive.google.com/file/d/10qxhCB7k2c3G73SUaEIfKVKSqgWSjkQo/view?usp=sharing, https://drive.google.com/file/d/19R6AOLUeAYzo73Zkt5WTqLrdQLvjfEq9/view?usp=sharing, https://drive.google.com/file/d/1M29mvmeDZQQ5X72Yfx2_0-vycXBG5pF8/view?usp=sharing, https://drive.google.com/file/d/1NC4s3DVR1LDzX-LCZlMMd5NrShFBidnd/view?usp=sharing, https://aistudio.google.com/app/prompts?state=%7B%22ids%22:%5B%221QNYodene0vrlxMvFDFKJ0CSSeS2lX2t2%22%5D,%22action%22:%22open%22,%22userId%22:%22103961307342447084491%22,%22resourceKeys%22:%7B%7D%7D&usp=sharing, https://drive.google.com/file/d/1qxPDWhlmzq9-R3H1YDAVwCyPjpwQ4ZJO/view?usp=sharing
