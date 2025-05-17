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
