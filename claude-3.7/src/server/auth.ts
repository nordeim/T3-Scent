// src/server/auth.ts
import NextAuth, { type DefaultSession, type User as NextAuthUser } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { db } from "~/server/db";
import { compare } from "bcryptjs";
import { env } from "~/env.js";
import type { Role as PrismaAppRole } from "@prisma/client";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: PrismaAppRole;
      roleDefinitionId?: string | null;
    } & DefaultSession["user"];
  }
  interface User extends NextAuthUser {
    role: PrismaAppRole;
    roleDefinitionId?: string | null;
  }
}

declare module "@auth/core/jwt" { // For NextAuth.js v5 beta, path might be this or 'next-auth/jwt'
  interface JWT {
    id: string;
    role: PrismaAppRole;
    roleDefinitionId?: string | null;
  }
}

// Define the configuration object. It's not strictly necessary to export this
// if only `handlers`, `auth`, `signIn`, `signOut` are needed externally.
const authConfigInternal = {
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID || "",
      clientSecret: env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email as string;
        const password = credentials.password as string;
        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;
        const isValid = await compare(password, user.password);
        if (!isValid) return null;
        return { 
            id: user.id, 
            name: user.name, 
            email: user.email, 
            image: user.image,
            role: user.role, 
            roleDefinitionId: user.roleDefinitionId 
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }: { token: any; user: any }) => { // Use `any` for broader compatibility with v5 beta variations
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.roleDefinitionId = user.roleDefinitionId;
        // OAuth providers usually add name, email, picture to token automatically
      }
      return token;
    },
    session: ({ session, token }: { session: any; token: any }) => {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.roleDefinitionId = token.roleDefinitionId;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    // newUser: "/auth/welcome", // Optional: redirect new OAuth users
  },
  trustHost: env.AUTH_TRUST_HOST,
  // secret: env.AUTH_SECRET, // Auth.js v5 uses AUTH_SECRET from env automatically
} satisfies Parameters<typeof NextAuth>[0];

// Export handlers, auth, signIn, signOut
export const { handlers, auth, signIn, signOut } = NextAuth(authConfigInternal);

// If you truly need to export the config itself for some other advanced reason:
// export const authConfig = authConfigInternal;