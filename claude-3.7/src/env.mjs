// src/env.mjs
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url("Invalid DATABASE_URL format"),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    
    // NextAuth.js v5 variables
    AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string().min(32, "AUTH_SECRET must be at least 32 characters long in production")
        : z.string().min(1, "AUTH_SECRET is required"), // Required even in dev, though can be simpler
    AUTH_URL: z.preprocess(
      // Ensure AUTH_URL is set for Vercel deployments; NextAuth.js might infer it.
      (str) => process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : str,
      process.env.VERCEL ? z.string().min(1) : z.string().url().optional()
    ),
    AUTH_TRUST_HOST: z.preprocess(
        (str) => str === "true" || str === "1", // Convert string "true" to boolean
        z.boolean().optional().default(false) // Default to false for production unless specified
    ), // Set to true for Vercel, Docker, or non-HTTPS localhost.

    // OAuth Providers (add if you use them)
    GOOGLE_CLIENT_ID: z.string().optional(), // Optional if not using Google provider
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    // AUTH_DISCORD_ID: z.string().optional(),
    // AUTH_DISCORD_SECRET: z.string().optional(),

    // Stripe
    STRIPE_SECRET_KEY: z.string().startsWith("sk_").min(1, "Stripe secret key is required"),
    STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),

    // Optional: Email Service
    // RESEND_API_KEY: z.string().optional(),
    // EMAIL_FROM: z.string().email().optional(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_").min(1, "Stripe publishable key is required"),
    NEXT_PUBLIC_SITE_URL: z.string().url("Invalid NEXT_PUBLIC_SITE_URL format"),
    // NEXT_PUBLIC_VERCEL_ANALYTICS_ID: z.string().optional(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    // AUTH_DISCORD_ID: process.env.AUTH_DISCORD_ID,
    // AUTH_DISCORD_SECRET: process.env.AUTH_DISCORD_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    // RESEND_API_KEY: process.env.RESEND_API_KEY,
    // EMAIL_FROM: process.env.EMAIL_FROM,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION || process.env.CI === "true",
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
