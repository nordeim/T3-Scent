// src/server/auth.ts
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
  type User as NextAuthUser, // Renamed to avoid conflict with Prisma User
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { db } from "~/server/db";
import { compare } from "bcryptjs"; // Make sure bcryptjs is installed
import { env } from "~/env.mjs";
import type { Role as PrismaRole } from "@prisma/client"; // Import Prisma Role type

// Define a more specific User type for NextAuth that includes roleId
interface AppUser extends NextAuthUser {
  id: string;
  role: PrismaRole; // Use Prisma's Role enum
  roleId?: string | null; // For advanced RBAC
}

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: AppUser & DefaultSession["user"];
  }

  // This is the type that `useSession().data.user` and `authOptions.callbacks.session({ user })` will have
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface User extends AppUser {}
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: PrismaRole;
    roleId?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        // On sign in, user object is available. This is the `AppUser` type.
        token.id = user.id;
        token.role = user.role;
        token.roleId = user.roleId;
      }
      return token;
    },
    session: ({ session, token }) => {
      // Token object is available here, which contains data from jwt callback
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.roleId = token.roleId;
      }
      return session;
    },
  },
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "john.doe@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          console.log("No user found with email:", credentials.email);
          return null;
        }
        if (!user.password) {
          console.log("User found but no password set (e.g. OAuth user)");
          return null; // Or handle as an error: "Please sign in with your original method"
        }

        const isValidPassword = await compare(credentials.password, user.password);

        if (!isValidPassword) {
          console.log("Invalid password for user:", credentials.email);
          return null;
        }

        // Return the user object that will be used by JWT and session callbacks
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role, // Ensure this is PrismaRole type
          roleId: user.roleId,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin", // Default T3 path, can be customized
    // signOut: '/auth/signout',
    // error: '/auth/error', // Error code passed in query string as ?error=
    // verifyRequest: '/auth/verify-request', // (used for check email message)
    newUser: "/auth/signup", // Redirect new OAuth users here to complete profile or use a welcome page
  },
  session: {
    strategy: "jwt", // Using JWT for session management
  },
  // debug: env.NODE_ENV === "development", // Enable debug messages in development
};

export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};

// Helper to protect admin routes/API procedures
export const withAdminAuth = <
  P extends { [key: string]: unknown } = { [key: string]: unknown },
>(
  handler?: (
    context: GetServerSidePropsContext
  ) => Promise<{ props: P } | { redirect: { destination: string; permanent: boolean } }>,
) => {
  return async (
    context: GetServerSidePropsContext,
  ): Promise<{ props: P } | { redirect: { destination: string; permanent: boolean } }> => {
    const session = await getServerAuthSession(context);

    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) { // Or check specific permissions from roleId if advanced RBAC is used
      return {
        redirect: {
          destination: session ? "/unauthorized" : `/auth/signin?callbackUrl=${encodeURIComponent(context.resolvedUrl)}`,
          permanent: false,
        },
      };
    }

    if (handler) {
      return handler(context);
    }

    return { props: {} as P }; // Return empty props if no handler is provided, or pass session as prop
  };
};
