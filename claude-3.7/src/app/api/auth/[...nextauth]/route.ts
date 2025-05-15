// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "~/server/auth"; // Your existing authOptions

// NextAuth() returns a handler function
const handler = NextAuth(authOptions);

// Exporting GET and POST handlers for the App Router
export { handler as GET, handler as POST };