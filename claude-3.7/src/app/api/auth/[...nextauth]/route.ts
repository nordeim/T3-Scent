// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "~/server/auth"; // Import the handlers

// Export the handlers for GET and POST requests as required by NextAuth.js v5 with App Router
export const { GET, POST } = handlers;