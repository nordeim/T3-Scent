// src/env.mjs
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    NEXTAUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters long in production")
        : z.string().min(1).optional(), // Optional in dev for easier setup
    NEXTAUTH_URL: z.preprocess(
      (str) => process.env.VERCEL_URL ?? str,
      process.env.VERCEL ? z.string().min(1) : z.string().url().optional() // Optional for local dev if not using NEXTAUTH_URL
    ),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
    STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(), // Webhook secret is crucial for production
    // EMAIL_SERVER_USER: z.string().optional(),
    // EMAIL_SERVER_PASSWORD: z.string().optional(),
    // EMAIL_SERVER_HOST: z.string().optional(),
    // EMAIL_SERVER_PORT: z.string().optional(),
    // EMAIL_FROM: z.string().email().optional(),
    // S3_BUCKET_NAME: z.string().optional(), // For image/model uploads
    // AWS_ACCESS_KEY_ID: z.string().optional(),
    // AWS_SECRET_ACCESS_KEY: z.string().optional(),
    // AWS_REGION: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_SITE_URL: z.string().url(),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_"),
    NEXT_PUBLIC_VERCEL_ANALYTICS_ID: z.string().optional(), // If using Vercel Analytics
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_VERCEL_ANALYTICS_ID: process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID,
    // EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER,
    // EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD,
    // EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST,
    // EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT,
    // EMAIL_FROM: process.env.EMAIL_FROM,
    // S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    // AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    // AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    // AWS_REGION: process.env.AWS_REGION,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION || process.env.CI === "true",
  emptyStringAsUndefined: true,
});
