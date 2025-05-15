# Deployment Guide: The Scent E-commerce Platform (Updated)

**Version:** 1.1
**Date:** October 27, 2023

## Table of Contents

1.  [Introduction](#1-introduction)
2.  [Prerequisites](#2-prerequisites)
    2.1. [Software](#21-software)
    2.2. [Accounts & Services](#22-accounts--services)
3.  [Environment Configuration](#3-environment-configuration)
    3.1. [`.env` File Overview](#31-env-file-overview)
    3.2. [Key Environment Variables](#32-key-environment-variables)
4.  [Database Setup](#4-database-setup)
    4.1. [Choosing a PostgreSQL Provider](#41-choosing-a-postgresql-provider)
    4.2. [Configuring `DATABASE_URL`](#42-configuring-database_url)
    4.3. [Running Migrations](#43-running-migrations)
    4.4. [Seeding Initial Data](#44-seeding-initial-data)
5.  [Application Build](#5-application-build)
6.  [Deployment Platform: Vercel (Recommended)](#6-deployment-platform-vercel-recommended)
    6.1. [Project Setup on Vercel](#61-project-setup-on-vercel)
    6.2. [Build & Output Settings](#62-build--output-settings)
    6.3. [Environment Variables on Vercel](#63-environment-variables-on-vercel)
    6.4. [Connecting Custom Domain](#64-connecting-custom-domain)
7.  [Alternative Deployment Platforms](#7-alternative-deployment-platforms)
    7.1. [Netlify](#71-netlify)
    7.2. [Docker & Self-Hosting (e.g., AWS EC2, DigitalOcean)](#72-docker--self-hosting-eg-aws-ec2-digitalocean)
8.  [Post-Deployment Steps](#8-post-deployment-steps)
    8.1. [Stripe Webhook Configuration](#81-stripe-webhook-configuration)
    8.2. [Google OAuth Configuration Update](#82-google-oauth-configuration-update)
    8.3. [Initial Admin User Setup](#83-initial-admin-user-setup)
    8.4. [DNS Configuration](#84-dns-configuration)
    8.5. [Site Settings Configuration](#85-site-settings-configuration)
    8.6. [Email Service Integration](#86-email-service-integration)
9.  [Scaling Considerations](#9-scaling-considerations)
    9.1. [Database Scaling](#91-database-scaling)
    9.2. [Application Server Scaling](#92-application-server-scaling)
    9.3. [Caching Strategies](#93-caching-strategies)
10. [Monitoring and Logging](#10-monitoring-and-logging)
    10.1. [Vercel Analytics & Logs](#101-vercel-analytics--logs)
    10.2. [External Monitoring Tools (Optional)](#102-external-monitoring-tools-optional)
11. [Troubleshooting Common Issues](#11-troubleshooting-common-issues)

---

## 1. Introduction

This guide provides comprehensive instructions for deploying "The Scent" e-commerce platform to a production environment. It covers prerequisites, environment configuration, database setup, application build, deployment to Vercel (recommended), and essential post-deployment steps.

## 2. Prerequisites

### 2.1. Software
*   **Git:** For version control.
*   **Node.js:** Version 18.x or later (as specified by the project's `package.json` or `.nvmrc`).
*   **npm or yarn:** Package manager.
*   **Prisma CLI:** Installed as a dev dependency (`npx prisma ...`).

### 2.2. Accounts & Services
*   **PostgreSQL Database Provider:** A managed PostgreSQL service (e.g., Supabase, Neon, Railway, AWS RDS, Google Cloud SQL, Aiven).
*   **Deployment Platform:** Vercel account (recommended) or alternative (Netlify, AWS, etc.).
*   **Stripe Account:** For payment processing. You'll need your Stripe Secret Key and Publishable Key.
*   **Google Cloud Platform Account:** For Google OAuth, you'll need a Client ID and Client Secret.
*   **Domain Name Registrar:** If using a custom domain.
*   **(Optional) Email Service Provider:** (e.g., Resend, SendGrid, AWS SES) for transactional and marketing emails.
*   **(Optional) Cloud Storage Provider:** (e.g., AWS S3, Vercel Blob, Cloudinary) if hosting images and 3D models externally.

## 3. Environment Configuration

The application relies on environment variables for configuration. These are managed in an `.env` file during local development and set directly on the deployment platform for production.

### 3.1. `.env` File Overview
A template file `.env.example` should be present in the repository. Copy this to `.env` for local development:
```bash
cp .env.example .env
```
For production, these variables will be set in your hosting provider's dashboard (e.g., Vercel Environment Variables).

### 3.2. Key Environment Variables
Refer to `src/env.mjs` for the full list and Zod schema. Critical variables for production include:

*   `DATABASE_URL`: The connection string for your production PostgreSQL database.
    *   Format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require` (SSL is highly recommended for production).
*   `NODE_ENV`: Set to `production`.
*   `NEXTAUTH_SECRET`: A strong, randomly generated secret string (at least 32 characters) used to sign session cookies and JWTs. Generate one using `openssl rand -base64 32`.
*   `NEXTAUTH_URL`: The canonical URL of your deployed application (e.g., `https://www.thescent.com`). This is crucial for NextAuth.js redirects and OAuth callbacks.
*   `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID.
*   `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret.
*   `STRIPE_SECRET_KEY`: Your Stripe API Secret Key (starts with `sk_live_`).
*   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Your Stripe API Publishable Key (starts with `pk_live_`).
*   `STRIPE_WEBHOOK_SECRET`: Secret for verifying Stripe webhook events (starts with `whsec_`). Generate this from your Stripe dashboard when setting up the webhook endpoint.
*   `NEXT_PUBLIC_SITE_URL`: Same as `NEXTAUTH_URL`, used for client-side utilities and SEO.
*   **(Optional but Recommended) Email Variables:** `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`, `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_FROM` if self-hosting email sending or for specific providers.
*   **(Optional) Cloud Storage Variables:** Credentials for AWS S3, Vercel Blob, etc., if used for asset hosting.

**Security Note:** Never commit your production `.env` file or hardcode secrets directly into your codebase. Use your deployment platform's system for managing environment variables.

## 4. Database Setup

### 4.1. Choosing a PostgreSQL Provider
Select a managed PostgreSQL provider that suits your needs regarding scalability, backups, and cost. Popular options include:
*   Supabase
*   Neon (Serverless PostgreSQL)
*   Railway
*   Aiven
*   AWS RDS for PostgreSQL
*   Google Cloud SQL for PostgreSQL
*   DigitalOcean Managed Databases

### 4.2. Configuring `DATABASE_URL`
Once your PostgreSQL instance is provisioned, obtain the connection string. This will be set as the `DATABASE_URL` environment variable. Ensure you configure network access rules (firewalls) on your database provider to allow connections from your deployment platform (e.g., Vercel's IP ranges if necessary, though direct DB connections from serverless functions are common).

### 4.3. Running Migrations
Prisma Migrate handles database schema changes.
1.  **Locally (during development):**
    ```bash
    npx prisma migrate dev --name your_migration_name
    ```
    This creates a new migration file and applies it to your local development database. Commit these migration files to your Git repository.
2.  **Production:**
    When deploying new code that includes schema changes (new migration files), you must run the migrations against your production database.
    ```bash
    npx prisma migrate deploy
    ```
    This command applies all pending migration files. It should be run in your CI/CD pipeline or as a pre-deployment step. **Do not run `prisma db push` or `prisma migrate dev` against a production database as it can lead to data loss.**
    *   **Vercel Build Command:** You can add `npx prisma migrate deploy && npm run build` (or `yarn prisma migrate deploy && yarn build`) to your Vercel build command in project settings. Ensure your Vercel deployment has access to the `DATABASE_URL`.

### 4.4. Seeding Initial Data
If you have a `prisma/seed.ts` file for initial data (e.g., default site settings, admin user, core roles):
```bash
npx prisma db seed
```
This is typically run once after the initial database setup and migrations. For subsequent data additions, consider custom scripts or admin interface functionality.

## 5. Application Build

To prepare your application for deployment, run the build command:
```bash
npm run build
# or
yarn build
```
This command typically does the following:
*   Compiles TypeScript to JavaScript.
*   Generates the Prisma Client (`npx prisma generate` is often part of the `postinstall` script or build process).
*   Builds the Next.js application, creating optimized static assets, serverless functions, and page bundles in the `.next` directory.

## 6. Deployment Platform: Vercel (Recommended)

Vercel is highly recommended for T3 Stack applications due to its seamless integration with Next.js.

### 6.1. Project Setup on Vercel
1.  **Sign Up/Log In:** Create or log in to your Vercel account.
2.  **Import Project:**
    *   Click "Add New..." -> "Project".
    *   Import your Git repository (GitHub, GitLab, Bitbucket).
3.  **Configure Project:**
    *   Vercel usually auto-detects Next.js settings.
    *   **Root Directory:** Should typically be the root of your repository.
    *   **Framework Preset:** Should be "Next.js".

### 6.2. Build & Output Settings
Vercel's default Next.js settings are usually sufficient.
*   **Build Command:** `npm run build` or `yarn build` (or `yarn prisma migrate deploy && yarn build` if handling migrations here).
*   **Output Directory:** `.next` (default for Next.js).
*   **Install Command:** `npm install` or `yarn install`.
*   **Node.js Version:** Select a version compatible with your project (e.g., 18.x).

### 6.3. Environment Variables on Vercel
Navigate to your project's "Settings" -> "Environment Variables" on Vercel.
*   Add all the necessary production environment variables (see Section 3.2).
*   Mark sensitive variables (like `DATABASE_URL`, `NEXTAUTH_SECRET`, `STRIPE_SECRET_KEY`) appropriately.
*   Choose the environments (Production, Preview, Development) for each variable.

### 6.4. Connecting Custom Domain
1.  Navigate to your project's "Settings" -> "Domains".
2.  Add your custom domain(s).
3.  Follow Vercel's instructions to update DNS records (A, CNAME, or ALIAS records) at your domain registrar.

## 7. Alternative Deployment Platforms

### 7.1. Netlify
Netlify also supports Next.js. You'll need to configure build settings and environment variables similarly. The `@netlify/plugin-nextjs` plugin is typically used.

### 7.2. Docker & Self-Hosting (e.g., AWS EC2, DigitalOcean)
For more control or specific infrastructure requirements:
1.  **Create a `Dockerfile`:**
    ```dockerfile
    # Dockerfile for Next.js T3 App
    FROM node:18-alpine AS base
    WORKDIR /app

    # 1. Install dependencies
    FROM base AS deps
    COPY package.json yarn.lock* ./
    RUN yarn install --frozen-lockfile

    # 2. Copy prisma schema and generate client
    FROM base AS prisma_generate
    COPY --from=deps /app/node_modules ./node_modules
    COPY package.json .
    COPY prisma ./prisma
    RUN yarn prisma generate

    # 3. Build the application
    FROM base AS builder
    COPY --from=deps /app/node_modules ./node_modules
    COPY --from=prisma_generate /app/prisma ./prisma
    COPY --from=prisma_generate /app/node_modules/.prisma ./node_modules/.prisma # Ensure generated client is copied
    COPY . .
    # Ensure DATABASE_URL is available at build time if migrations are run here,
    # or ensure it's available for the entrypoint if migrations run at startup.
    # RUN yarn prisma migrate deploy # Optional: run migrations during build
    RUN yarn build

    # 4. Production image
    FROM base AS runner
    ENV NODE_ENV production
    # Optionally set a non-root user
    # USER node
    COPY --from=builder /app/.next ./.next
    COPY --from=builder /app/node_modules ./node_modules
    COPY --from=builder /app/package.json ./package.json
    COPY --from=builder /app/public ./public

    # Expose port and start command
    EXPOSE 3000
    CMD ["yarn", "start"] # Assumes `next start` is your start script
    ```
2.  **Build and Push Docker Image:** To a container registry (Docker Hub, AWS ECR, GCR).
3.  **Deploy Container:** On your chosen IaaS/PaaS platform. This requires managing the server, database connections, reverse proxies (e.g., Nginx), SSL certificates, and environment variables.

## 8. Post-Deployment Steps

### 8.1. Stripe Webhook Configuration
1.  **In your Stripe Dashboard:** Go to "Developers" -> "Webhooks".
2.  **Add Endpoint:**
    *   **Endpoint URL:** `https://yourdomain.com/api/webhooks/stripe` (This API route needs to be created in your Next.js app to handle Stripe events).
    *   **Events to listen for:** Select relevant events, such as:
        *   `payment_intent.succeeded`
        *   `payment_intent.payment_failed`
        *   `charge.refunded`
        *   `invoice.payment_succeeded` (for subscriptions)
        *   `customer.subscription.updated`, `customer.subscription.deleted` (for subscriptions)
3.  **Signing Secret:** Copy the Webhook Signing Secret provided by Stripe and add it as `STRIPE_WEBHOOK_SECRET` in your production environment variables. Your webhook handler must use this to verify events.

### 8.2. Google OAuth Configuration Update
1.  **In Google Cloud Console:** Go to your project's "APIs & Services" -> "Credentials".
2.  Select your OAuth 2.0 Client ID.
3.  **Update Authorized JavaScript origins:** Add `https://yourdomain.com`.
4.  **Update Authorized redirect URIs:** Add `https://yourdomain.com/api/auth/callback/google`.

### 8.3. Initial Admin User Setup
If not handled by database seeding:
1.  Register a new user through the application's signup form.
2.  Manually update this user's `role` (and/or `roleDefinitionId`) in the database to `ADMIN` (or assign to an admin `RoleDefinition`). This might require direct database access or a one-time script.
    ```sql
    -- Example SQL:
    -- UPDATE "users" SET "role" = 'ADMIN' WHERE "email" = 'your_admin_email@example.com';
    -- Or if using RoleDefinition:
    -- UPDATE "users" SET "roleDefinitionId" = (SELECT "id" FROM "role_definitions" WHERE "name" = 'Administrator') WHERE "email" = 'your_admin_email@example.com';
    ```

### 8.4. DNS Configuration
Ensure your domain's DNS records (A, CNAME, MX for email, etc.) are correctly pointing to your deployment platform (e.g., Vercel IPs/aliases). Propagation can take some time.

### 8.5. Site Settings Configuration
Log in as an admin and navigate to the admin settings page (e.g., `/admin/settings`). Configure:
*   Site name, logo, colors.
*   Contact information.
*   Social media links.
*   Shipping methods and tax rates (if managed through the UI and `SiteSettings` model).
*   Default SEO metadata.

### 8.6. Email Service Integration
*   Configure your chosen email service provider (e.g., API keys for Resend/SendGrid) in your production environment variables.
*   Test transactional emails (order confirmations, password resets).

## 9. Scaling Considerations

### 9.1. Database Scaling
*   **Managed Services:** Most cloud PostgreSQL providers offer easy scaling (CPU, RAM, storage upgrades).
*   **Read Replicas:** For read-heavy workloads, configure read replicas to offload read queries. Your application code (Prisma setup) might need adjustments to route reads to replicas.
*   **Connection Pooling:** Use a connection pooler (like PgBouncer, often provided by managed services) to efficiently manage database connections, especially with serverless functions.
*   **Query Optimization:** Regularly analyze and optimize slow database queries. Use Prisma's logging or database-native tools.

### 9.2. Application Server Scaling
*   **Vercel/Serverless:** Vercel automatically scales serverless functions based on demand. Be mindful of concurrency limits and cold start times.
*   **Containerized Deployments:** Use orchestrators like Kubernetes or managed container services (AWS ECS, Google Cloud Run) for auto-scaling based on CPU/memory usage or request count.

### 9.3. Caching Strategies
*   **CDN for Static Assets:** Vercel and other platforms provide this by default.
*   **API Response Caching (Client-Side):** React Query (via tRPC) handles this effectively.
*   **Server-Side Caching (Optional):** For frequently accessed, computationally expensive data that doesn't change often, consider using Redis or an in-memory cache on the server. This is more relevant for non-serverless deployments or specific tRPC procedures.
*   **Database Query Caching:** Some data can be cached at the database level or application layer if it's non-volatile.

## 10. Monitoring and Logging

### 10.1. Vercel Analytics & Logs
*   **Vercel Analytics:** Provides insights into website traffic, page views, and performance (Core Web Vitals).
*   **Vercel Logs:** Access real-time logs for serverless functions (API routes) and build processes directly from the Vercel dashboard.

### 10.2. External Monitoring Tools (Optional)
For more in-depth monitoring and alerting:
*   **Sentry, LogRocket, Highlight.io:** For frontend and backend error tracking and session replay.
*   **New Relic, Datadog:** Application Performance Monitoring (APM).
*   **Prometheus/Grafana:** For self-hosted infrastructure.
*   **CloudWatch (AWS), Google Cloud Operations (GCP):** Platform-specific logging and monitoring.

## 11. Troubleshooting Common Issues
*   **Environment Variable Mismatches:** Double-check that all required environment variables are correctly set in the production environment and match the expected format/values.
*   **Database Connection Issues:** Verify `DATABASE_URL`, firewall rules, SSL configuration.
*   **Migration Failures:** Ensure `prisma migrate deploy` is run correctly. Check migration history (`prisma migrate status`).
*   **Authentication Problems (`NEXTAUTH_URL`, `NEXTAUTH_SECRET`):** Ensure these are correctly set for the production domain. Check OAuth provider redirect URIs.
*   **CORS Issues:** Usually not an issue with tRPC in a Next.js monorepo setup, but can occur if accessing APIs from different domains without proper configuration.
*   **Serverless Function Timeouts/Memory Limits:** Optimize long-running tRPC procedures. Consider background jobs for intensive tasks.
*   **Stripe Webhook Failures:** Check webhook endpoint URL, event types, and signature verification. Use Stripe's dashboard to inspect event logs.

This deployment guide provides a solid foundation for launching "The Scent." Remember to adapt specific steps based on your chosen hosting provider and services.
