// src/server/auth.ts
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
  type User as NextAuthUserInternal,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { db } from "~/server/db";
import { compare } from "bcryptjs";
import { env } from "~/env.mjs";
import type { Role as PrismaAppRole } from "@prisma/client"; // Renamed to avoid conflict

// Define a more specific User type for NextAuth that includes roleId
interface AppInternalUser extends NextAuthUserInternal {
  id: string;
  role: PrismaAppRole;
  roleDefinitionId?: string | null; // For advanced RBAC
}

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: AppInternalUser & DefaultSession["user"];
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface User extends AppInternalUser {}
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: PrismaAppRole;
    roleDefinitionId?: string | null;
    // Add any other properties you want to persist in the JWT
    name?: string | null;
    email?: string | null;
    picture?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  callbacks: {
    jwt: async ({ token, user, account, profile }) => {
      // `user` is available on first sign-in (credentials or OAuth)
      if (user) {
        token.id = user.id;
        token.role = user.role; // This is AppInternalUser from authorize or OAuth profile mapping
        token.roleDefinitionId = user.roleDefinitionId;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image; // NextAuth User type uses 'image'
      }
      // `account` & `profile` are available on OAuth sign-in
      // Can use these to update user profile, e.g., fetch more details from Google
      return token;
    },
    session: ({ session, token }) => {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.roleDefinitionId = token.roleDefinitionId;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture; // Map from JWT's 'picture' to session's 'image'
      }
      return session;
    },
  },
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      // Optional: customize profile to ensure role is handled if needed
      // profile(profile) {
      //   return {
      //     id: profile.sub,
      //     name: profile.name,
      //     email: profile.email,
      //     image: profile.picture,
      //     role: "CUSTOMER", // Default role for new OAuth users
      //     // roleDefinitionId: null, // Or fetch/assign a default RoleDefinition
      //   };
      // },
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

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          console.error("Auth: No user found with email:", credentials.email);
          return null;
        }
        if (!user.password) {
          console.error("Auth: User found but no password set (e.g. OAuth user):", credentials.email);
          return null;
        }

        const isValidPassword = await compare(credentials.password, user.password);

        if (!isValidPassword) {
          console.error("Auth: Invalid password for user:", credentials.email);
          return null;
        }
        
        console.log("Auth: Credentials successful for:", user.email);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role, // from Prisma schema
          roleDefinitionId: user.roleDefinitionId,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    signOut: '/auth/signout',
    error: '/auth/error', 
    verifyRequest: '/auth/verify-request',
    newUser: "/auth/welcome", // Redirect new OAuth users to a welcome/profile completion page
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    // secret: env.NEXTAUTH_SECRET, // Automatically handled by NextAuth if NEXTAUTH_SECRET is set
    maxAge: 30 * 24 * 60 * 60,
  },
  // debug: env.NODE_ENV === "development",
  // secret: env.NEXTAUTH_SECRET, // Redundant if NEXTAUTH_SECRET is in env
};

export const getServerAuthSession = async (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};

// HOC for protecting pages server-side
export const withAuthProtection = <
  P extends { [key: string]: unknown } = { [key: string]: unknown },
>(
  handler?: (
    context: GetServerSidePropsContext,
    session: Session // Pass session to handler
  ) => Promise<{ props: P } | { redirect: { destination: string; permanent: boolean } }>,
  requiredRoles?: PrismaAppRole[],
) => {
  return async (
    context: GetServerSidePropsContext,
  ): Promise<{ props: P } | { redirect: { destination: string; permanent: boolean } }> => {
    const session = await getServerAuthSession(context);

    if (!session) {
      return {
        redirect: {
          destination: `/auth/signin?callbackUrl=${encodeURIComponent(context.resolvedUrl)}`,
          permanent: false,
        },
      };
    }

    if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(session.user.role)) {
      // Here you might also check advanced RBAC using session.user.roleDefinitionId and its permissions
      return {
        redirect: {
          destination: "/unauthorized", // A generic unauthorized page
          permanent: false,
        },
      };
    }

    if (handler) {
      return handler(context, session);
    }

    // If no specific handler, pass session as a prop (useful for client-side checks or display)
    return { props: { session } as P & { session: Session } };
  };
};

export const withAdminAuth = <
  P extends { [key: string]: unknown } = { [key: string]: unknown },
>(
  handler?: (
    context: GetServerSidePropsContext,
    session: Session
  ) => Promise<{ props: P } | { redirect: { destination: string; permanent: boolean } }>,
) => {
  // Ensure ADMIN and MANAGER roles are correctly typed from Prisma
  const adminRoles: PrismaAppRole[] = [PrismaAppRole.ADMIN, PrismaAppRole.MANAGER];
  return withAuthProtection(handler, adminRoles);
};
