# Technical Design Specification: The Scent E-commerce Platform

## Table of Contents

1.  [Introduction](#1-introduction)
    1.1. [Project Overview](#11-project-overview)
    1.2. [Purpose of this Document](#12-purpose-of-this-document)
    1.3. [Goals of the Application](#13-goals-of-the-application)
    1.4. [Target Audience](#14-target-audience)
    1.5. [Assumptions and Constraints](#15-assumptions-and-constraints)
2.  [System Architecture](#2-system-architecture)
    2.1. [High-Level Overview](#21-high-level-overview)
    2.2. [Technology Stack](#22-technology-stack)
    2.3. [Frontend Architecture](#23-frontend-architecture)
    2.4. [Backend Architecture (tRPC)](#24-backend-architecture-trpc)
    2.5. [Database Architecture](#25-database-architecture)
    2.6. [Authentication and Authorization](#26-authentication-and-authorization)
    2.7. [Third-Party Integrations](#27-third-party-integrations)
3.  [Data Models (Database Schema)](#3-data-models-database-schema)
    3.1. [Prisma Schema Overview](#31-prisma-schema-overview)
    3.2. [Core Models](#32-core-models)
        3.2.1. [`User`](#321-user)
        3.2.2. [`Account`](#322-account)
        3.2.3. [`Session`](#323-session)
        3.2.4. [`VerificationToken`](#324-verificationtoken)
    3.3. [Product Catalog Models](#33-product-catalog-models)
        3.3.1. [`Product`](#331-product)
        3.3.2. [`ProductImage`](#332-productimage)
        3.3.3. [`ProductVariant`](#333-productvariant)
        3.3.4. [`Category`](#334-category)
        3.3.5. [`Tag`](#335-tag)
        3.3.6. [`Collection`](#336-collection)
    3.4. [Order Management Models](#34-order-management-models)
        3.4.1. [`Order`](#341-order)
        3.4.2. [`OrderItem`](#342-orderitem)
        3.4.3. [`OrderHistory`](#343-orderhistory)
    3.5. [Customer Interaction Models](#35-customer-interaction-models)
        3.5.1. [`Address`](#351-address)
        3.5.2. [`Review`](#352-review)
        3.5.3. [`QuizQuestion`](#353-quizquestion)
        3.5.4. [`QuizResponse`](#354-quizresponse)
        3.5.5. [`NewsletterSubscriber`](#355-newslettersubscriber)
        3.5.6. [`CartItem`](#356-cartitem)
        3.5.7. [`WishlistItem`](#357-wishlistitem)
    3.6. [Subscription & Loyalty Models](#36-subscription--loyalty-models)
        3.6.1. [`ProductSubscription`](#361-productsubscription)
        3.6.2.  (Conceptual Loyalty Models: `LoyaltyTier`, `LoyaltyPointLog`, `Reward`, `UserReward`)
    3.7. [Operational Models](#37-operational-models)
        3.7.1. [`Notification`](#371-notification)
        3.7.2. [`SiteSettings`](#372-sitesettings)
        3.7.3.  (Conceptual Smart Home Models: `SmartHomePlatformConnection`, `SmartHomeDevice`, `AutomationRule`, `ScentSchedule`)
        3.7.4.  (Conceptual Inventory Models: `Supplier`, `PurchaseOrder`, `PurchaseOrderItem`)
    3.8. [Enums](#38-enums)
4.  [API Design (tRPC Routers)](#4-api-design-trpc-routers)
    4.1. [Overview](#41-overview)
    4.2. [Core Routers](#42-core-routers)
        4.2.1. [`productsRouter`](#421-productsrouter)
        4.2.2. [`ordersRouter`](#422-ordersrouter)
        4.2.3. [`usersRouter`](#423-usersrouter)
        4.2.4. [`cartRouter`](#424-cartrouter)
        4.2.5. [`wishlistRouter`](#425-wishlistrouter)
        4.2.6. [`reviewsRouter`](#426-reviewsrouter)
    4.3. [Advanced Feature Routers](#43-advanced-feature-routers)
        4.3.1. [`quizRouter`](#431-quizrouter)
        4.3.2. [`recommendationsRouter`](#432-recommendationsrouter)
        4.3.3. [`subscriptionsRouter`](#433-subscriptionsrouter)
        4.3.4. [`loyaltyRouter`](#434-loyaltyrouter) (Conceptual)
        4.3.5. [`smartHomeRouter`](#435-smarthomerouter) (Conceptual)
        4.3.6. [`notificationsRouter`](#436-notificationsrouter) (Conceptual)
    4.4. [Admin Routers](#44-admin-routers)
        4.4.1. [`admin.productsRouter`](#441-adminproductsrouter)
        4.4.2. [`admin.ordersRouter`](#442-adminordersrouter)
        4.4.3. [`admin.usersRouter`](#443-adminusersrouter)
        4.4.4. [`admin.rolesRouter`](#444-adminrolesrouter)
        4.4.5. [`admin.analyticsRouter`](#445-adminanalyticsrouter) (Conceptual)
        4.4.6. [`admin.inventoryRouter`](#446-admininventoryrouter) (Conceptual)
        4.4.7. [`admin.settingsRouter`](#447-adminsettingsrouter) (Conceptual)
5.  [Frontend Design](#5-frontend-design)
    5.1. [Overall Structure & Layout](#51-overall-structure--layout)
    5.2. [State Management](#52-state-management)
    5.3. [Styling](#53-styling)
    5.4. [Key UI Components](#54-key-ui-components)
        5.4.1. [Shared UI Components (`src/components/ui/`)](#541-shared-ui-components-srccomponentsui)
        5.4.2. [Layout Components (`src/components/layout/`)](#542-layout-components-srccomponentslayout)
        5.4.3. [Feature-Specific Components](#543-feature-specific-components)
    5.5. [Key Pages (`src/pages/`)](#55-key-pages-srcpages)
6.  [Detailed Feature Design](#6-detailed-feature-design)
    6.1. [User Authentication & Profile](#61-user-authentication--profile)
    6.2. [Product Catalog & Discovery](#62-product-catalog--discovery)
    6.3. [Product Detail Page](#63-product-detail-page)
    6.4. [Shopping Cart](#64-shopping-cart)
    6.5. [Checkout Process](#65-checkout-process)
    6.6. [Order Management (User)](#66-order-management-user)
    6.7. [Advanced Scent Quiz](#67-advanced-scent-quiz)
    6.8. [Wishlist Management](#68-wishlist-management)
    6.9. [Subscription System](#69-subscription-system)
    6.10. [Loyalty Program](#610-loyalty-program)
    6.11. [AR Product Visualization](#611-ar-product-visualization)
    6.12. [Multi-language & Multi-currency](#612-multi-language--multi-currency)
    6.13. [Smart Home Integration](#613-smart-home-integration)
    6.14. [Admin Dashboard Features](#614-admin-dashboard-features)
        6.14.1. [Admin Dashboard Overview](#6141-admin-dashboard-overview)
        6.14.2. [Admin Product Management](#6142-admin-product-management)
        6.14.3. [Admin Order Management](#6143-admin-order-management)
        6.14.4. [Role-Based Access Control (RBAC) Management](#6144-role-based-access-control-rbac-management)
        6.14.5. [Advanced Analytics Dashboard](#6145-advanced-analytics-dashboard)
        6.14.6. [Inventory Forecasting System](#6146-inventory-forecasting-system)
7.  [Non-Functional Requirements](#7-non-functional-requirements)
    7.1. [Performance](#71-performance)
    7.2. [Scalability](#72-scalability)
    7.3. [Security](#73-security)
    7.4. [Accessibility (A11y)](#74-accessibility-a11y)
    7.5. [Maintainability](#75-maintainability)
8.  [Deployment](#8-deployment)
    8.1. [Environment Variables](#81-environment-variables)
    8.2. [Build Process](#82-build-process)
    8.3. [Deployment Strategy](#83-deployment-strategy)
    8.4. [Database Migrations & Seeding](#84-database-migrations--seeding)
9.  [Development Setup & Guidelines](#9-development-setup--guidelines)
    9.1. [Prerequisites](#91-prerequisites)
    9.2. [Installation](#92-installation)
    9.3. [Running the Application](#93-running-the-application)
    9.4. [Coding Standards & Conventions](#94-coding-standards--conventions)
    9.5. [Testing Strategy](#95-testing-strategy)
10. [Future Enhancements](#10-future-enhancements)
11. [Glossary](#11-glossary)

---

## 1. Introduction

### 1.1. Project Overview
"The Scent" is a sophisticated, feature-rich e-commerce platform designed specifically for selling aromatherapy and wellness products. It aims to provide a premium, engaging, and personalized shopping experience for customers, while offering robust management and analytics tools for administrators. The platform leverages the T3 Stack (Next.js, TypeScript, tRPC, Prisma, NextAuth.js) along with PostgreSQL to deliver a modern, typesafe, and performant application. Key features include an AI-powered scent quiz, AR product visualization, subscription management, a loyalty program, advanced analytics, inventory forecasting, and smart home integration capabilities.

### 1.2. Purpose of this Document
This Technical Design Specification (TDS) serves as a comprehensive blueprint for "The Scent" e-commerce platform. Its primary purposes are:
*   **Onboarding:** To provide new developers with a thorough understanding of the system's architecture, design principles, and core functionalities.
*   **Development Guide:** To act as a reference for the development team during implementation, ensuring consistency and adherence to the planned design.
*   **Future Enhancements:** To lay a foundation for future development, making it easier to plan and integrate new features.
*   **Stakeholder Communication:** To offer a detailed view of the technical aspects of the platform for technical stakeholders.

This document details the system's architecture, data models, API design, frontend components, core features, and non-functional requirements.

### 1.3. Goals of the Application
The primary goals of "The Scent" e-commerce platform are:
*   **Provide an Exceptional User Experience:** Offer a seamless, intuitive, and aesthetically pleasing interface for customers.
*   **Drive Sales and Customer Engagement:** Implement features like personalized recommendations, loyalty programs, and subscriptions to increase conversions and customer retention.
*   **Enable Efficient Store Management:** Equip administrators with powerful tools for product management, order processing, inventory control, and customer support.
*   **Deliver Actionable Insights:** Provide advanced analytics and reporting to help administrators make data-driven business decisions.
*   **Ensure Scalability and Performance:** Build a robust platform capable of handling growth in traffic, product catalog, and order volume.
*   **Maintain High Security Standards:** Protect user data and ensure secure transactions.
*   **Offer Innovative Features:** Differentiate the platform with unique functionalities like AR product visualization and smart home integration.
*   **Facilitate Personalization:** Tailor the shopping experience to individual customer preferences through features like the AI-powered scent quiz.

### 1.4. Target Audience
The application caters to two primary groups of users:
*   **Customers:** Individuals seeking aromatherapy and wellness products. They will interact with the storefront, browse products, take quizzes, make purchases, manage their accounts, subscriptions, and loyalty rewards.
*   **Administrators & Staff (Admin Users):**
    *   **Admins:** Users with full access to the admin dashboard, responsible for overall store management, analytics, user roles, and system settings.
    *   **Managers/Staff:** Users with specific roles and permissions (e.g., product management, order fulfillment, customer service) who will use the admin dashboard for their designated tasks.

### 1.5. Assumptions and Constraints
*   **Technology Stack:** The T3 stack is pre-decided.
*   **Database:** PostgreSQL is the chosen relational database.
*   **Initial Deployment:** The platform will likely be deployed on a modern cloud platform like Vercel (implied by Vercel Analytics).
*   **Payment Gateway:** Stripe is the primary payment gateway.
*   **Development Resources:** Assumes a team familiar with TypeScript, React, Next.js, and the T3 ecosystem.
*   **AR/3D Models:** Assumes 3D models for products (e.g., in `.glb` or `.usdz` format) will be available for the AR visualization feature.
*   **AI for Quiz/Recommendations:** The "AI-powered" aspect implies an underlying logic or model for recommendations. This document will focus on the integration points and data flow rather than the AI model's internal workings, which may be a separate system or service.
*   **Smart Home Integration:** Initial integration will focus on establishing the framework. Deep integration with specific smart home APIs (e.g., Philips Hue, HomeKit) will require separate, detailed specifications for each platform.

## 2. System Architecture

### 2.1. High-Level Overview
"The Scent" is a full-stack web application built using the T3 Stack. It follows a monolithic repository structure (monorepo) where frontend and backend code coexist. The architecture emphasizes end-to-end typesafety, developer experience, and rapid iteration.

*   **Client-Side (Browser):** Users interact with a Next.js frontend, built with React and styled with TailwindCSS. Client-side state management is handled via React Context and component-level state.
*   **Server-Side (Next.js):** The Next.js server handles API requests (via tRPC), server-side rendering (SSR) or static site generation (SSG) for pages, authentication logic (via NextAuth.js), and database interactions (via Prisma).
*   **API Layer (tRPC):** tRPC provides a typesafe API layer, eliminating the need for manual API contract management between frontend and backend.
*   **Database (PostgreSQL):** A PostgreSQL database stores all persistent data, managed and accessed through the Prisma ORM.

```mermaid
graph TD
    Client[Client Browser - Next.js/React] -->|HTTPS (tRPC Calls)| ServerAPI[Next.js Server / tRPC API]
    ServerAPI -->|NextAuth.js| AuthProvider[Authentication Provider e.g., Google]
    ServerAPI -->|Prisma Client| Database[(PostgreSQL Database)]
    ServerAPI -->|Stripe API| Stripe[Stripe Payment Gateway]
    ServerAPI -->|External APIs| SmartHome[Smart Home APIs e.g., Hue]
    ServerAPI -->|External APIs| AnalyticsService[Analytics Services]

    AdminClient[Admin Browser - Next.js/React] -->|HTTPS (tRPC Calls)| ServerAPI

    subgraph "Application Server (Vercel or similar)"
        ServerAPI
    end
```

### 2.2. Technology Stack
| Category          | Technology                                    | Purpose                                                                 |
|-------------------|-----------------------------------------------|-------------------------------------------------------------------------|
| **Framework**     | Next.js 14+ (Pages Router primarily used)     | Full-stack React framework for frontend and backend development.          |
| **Language**      | TypeScript                                    | Superset of JavaScript for static typing and improved code quality.     |
| **API Layer**     | tRPC                                          | End-to-end typesafe APIs without schema/contract generation.            |
| **ORM**           | Prisma                                        | Next-generation ORM for Node.js and TypeScript, database client.        |
| **Database**      | PostgreSQL                                    | Robust, open-source relational database.                                |
| **Styling**       | TailwindCSS                                   | Utility-first CSS framework for rapid UI development.                   |
| **Authentication**| NextAuth.js                                   | Authentication solution for Next.js applications.                       |
| **Payments**      | Stripe                                        | Online payment processing.                                              |
| **Animations**    | Framer Motion                                 | Production-ready motion library for React.                              |
| **Charting**      | Recharts                                      | Composable charting library for React.                                  |
| **Form Handling** | React Hook Form (Recommended)                 | Performant, flexible, and extensible forms with easy-to-use validation. |
| **State Management**| React Context API, Zustand (Recommended for complex global state) | For managing global and shared state.                                   |
| **UI Components** | Shadcn/ui (Recommended, based on Radix UI & Tailwind) | Re-usable, accessible UI components.                                    |
| **Linting/Formatting**| ESLint, Prettier                          | Code quality and consistency.                                           |
| **Analytics**     | Vercel Analytics                              | Website analytics.                                                      |
| **SEO**           | `next-seo`                                    | Manage SEO metadata in Next.js applications.                            |

### 2.3. Frontend Architecture
The frontend is built with Next.js and React.
*   **Routing:** Next.js Pages Router is used for defining application routes (e.g., `/products/[slug].tsx`, `/admin/dashboard.tsx`).
*   **Components:** The UI is structured into reusable React components, categorized into:
    *   `src/components/ui/`: Basic, generic UI elements (Button, Card, Input, etc.), potentially leveraging a library like Shadcn/ui.
    *   `src/components/layout/`: Components defining the overall page structure (Navbar, Footer, Sidebar, AdminLayout).
    *   Feature-specific components (e.g., `src/components/products/`, `src/components/quiz/`).
*   **State Management:**
    *   **Local Component State:** `useState` and `useReducer` for component-specific state.
    *   **Shared Global State (React Context API):**
        *   `CartContext`: Manages shopping cart items and totals. Persists to `localStorage`.
        *   `WishlistContext`: Manages user's wishlist items. Persists to `localStorage` and syncs with DB for logged-in users.
        *   `LocalizationContext`: Manages current language and currency, provides translation functions.
        *   `NotificationsContext`: Manages in-app notifications for users.
    *   **Server State Management (tRPC + React Query):** tRPC's React Query integration (`@tanstack/react-query`) is used for fetching, caching, and updating server data, providing features like automatic refetching, optimistic updates, and loading/error states.
*   **Styling:** TailwindCSS is used for utility-first styling. A `tailwind.config.ts` file defines custom themes, colors (primary, accent, cta), fonts, and animations (fadeIn, slideInRight, slideInLeft). Dark mode is supported using Tailwind's `dark:` variant and `next-themes`.
*   **Forms:** While not explicitly stated, React Hook Form is recommended for complex forms due to its performance and validation capabilities.
*   **SEO:** `next-seo` and Next.js's built-in `<Head>` component are used for managing page titles, meta descriptions, canonical URLs, OpenGraph tags, and other SEO-relevant metadata. The `_app.tsx` includes `DefaultSeo` configuration.

### 2.4. Backend Architecture (tRPC)
The backend logic is primarily handled through tRPC procedures, co-located with the Next.js application.
*   **tRPC Routers:** API endpoints are organized into routers (e.g., `productsRouter`, `ordersRouter`, `adminRouter`). Each router groups related procedures.
    *   `src/server/api/root.ts`: Merges all tRPC routers into a single app router.
    *   `src/server/api/trpc.ts`: Initializes tRPC and defines reusable procedures (public, protected).
*   **Procedures:** Individual API operations (queries, mutations).
    *   **Queries:** For fetching data (e.g., `getAll` products, `getById`).
    *   **Mutations:** For creating, updating, or deleting data (e.g., `createOrder`, `updateProduct`).
*   **Input Validation:** Zod is used to define and validate the schemas for procedure inputs, ensuring data integrity and providing typesafety.
*   **Context:** A tRPC context is created per request, providing procedures with access to necessary resources like the database client (`db` from Prisma) and the user session (`session` from NextAuth.js).
*   **Middleware:** tRPC middleware can be used for concerns like authentication checks (e.g., ensuring a user is logged in or has a specific role before executing a procedure).

### 2.5. Database Architecture
*   **Database System:** PostgreSQL.
*   **ORM:** Prisma is used as the ORM for database interactions.
    *   `prisma/schema.prisma`: Defines the database schema, models, relations, and enums.
    *   `@prisma/client`: The Prisma Client is used in tRPC procedures to query the database in a typesafe manner.
*   **Migrations:** Prisma Migrate is used to manage database schema changes and apply them to the database.
*   **Seeding:** A seed script (`prisma/seed.ts`) is used to populate the database with initial or sample data (e.g., admin users, product categories, quiz questions).
*   **Data Integrity:** Enforced through Prisma schema constraints (e.g., `@unique`, `@relation`, field types) and database-level constraints.

### 2.6. Authentication and Authorization
*   **Authentication Provider:** NextAuth.js.
    *   `src/server/auth.ts`: Configures NextAuth.js options, providers, callbacks, and session management.
*   **Authentication Strategies:**
    *   **Credentials Provider:** For email/password-based login. Passwords are hashed (e.g., using `bcryptjs`).
    *   **OAuth Providers:** Google Provider is configured. Others (e.g., Facebook, Apple) can be added.
*   **Session Management:**
    *   JWT (JSON Web Tokens) are used for session strategy, as configured in `authOptions`.
    *   Session data is extended to include user ID and role.
*   **Authorization (RBAC - Role-Based Access Control):**
    *   `User` model has a `role` field (e.g., `ADMIN`, `MANAGER`, `CUSTOMER`).
    *   Protected tRPC procedures and server-side logic check user roles to restrict access to sensitive operations or data.
    *   `withAdminAuth` HOC (or similar middleware) can be used to protect admin pages/routes.
    *   A detailed `RoleManagement` system allows admins to define roles and assign permissions.

### 2.7. Third-Party Integrations
*   **Stripe:** For payment processing. Integration involves:
    *   Stripe SDK on the frontend (`@stripe/react-stripe-js`, `@stripe/stripe-js`).
    *   Stripe secret key on the backend for creating PaymentIntents and handling webhooks.
    *   `CheckoutForm` component for collecting payment details.
    *   `ordersRouter` for `createPaymentIntent` and `createOrder` procedures.
*   **Vercel Analytics:** Integrated in `_app.tsx` for website traffic and performance monitoring.
*   **Google OAuth:** For social login, configured in NextAuth.js.
*   **Smart Home Platforms (Conceptual):** Integration would involve:
    *   OAuth flows for users to connect their smart home accounts.
    *   APIs for discovering and controlling devices (e.g., diffusers).
    *   Storing API tokens securely.
    *   `smartHomeRouter` for managing connections and device interactions.
*   **AR Model Hosting (Implicit):** 3D models (`.glb`, `.usdz`) for AR visualization will need to be hosted, potentially via a CDN or static file serving.
*   **Email Service (Conceptual, e.g., SendGrid, Resend):** Required for transactional emails (order confirmations, password resets, invitations) and marketing newsletters. Not explicitly detailed in provided code but essential for a full e-commerce platform.

## 3. Data Models (Database Schema)

The database schema is defined in `prisma/schema.prisma` and uses PostgreSQL. The following is based on the comprehensive schema from `design_document_2.md`.

### 3.1. Prisma Schema Overview
The schema defines models for users, products, orders, customer interactions, and operational data. It uses CUIDs for IDs, timestamps for `createdAt` and `updatedAt`, and appropriate data types for e-commerce needs (e.g., `Decimal` for prices). Relations are clearly defined to maintain data integrity.

### 3.2. Core Models

#### 3.2.1. `User`
*   **Purpose:** Stores information about registered users, including customers and administrators.
*   **Key Fields:**
    *   `id` (String, CUID, PK)
    *   `name` (String?)
    *   `email` (String?, Unique)
    *   `emailVerified` (DateTime?)
    *   `image` (String?) - Profile picture URL.
    *   `password` (String?) - Hashed password for credentials-based login.
    *   `role` (Enum `Role`: `ADMIN`, `MANAGER`, `CUSTOMER`) - User's role for RBAC.
    *   `createdAt`, `updatedAt` (DateTime)
*   **Relations:**
    *   `Account[]` (one-to-many with `Account` for OAuth)
    *   `Session[]` (one-to-many with `Session`)
    *   `Order[]` (one-to-many with `Order`)
    *   `Review[]` (one-to-many with `Review`)
    *   `QuizResponse[]` (one-to-many with `QuizResponse`)
    *   `Address[]` (one-to-many with `Address`)
    *   `WishlistItem[]` (one-to-many with `WishlistItem`)
    *   `CartItem[]` (one-to-many with `CartItem` for persistent carts)
    *   `Notification[]` (one-to-many with `Notification`)
    *   `ProductSubscription[]` (one-to-many with `ProductSubscription`)

#### 3.2.2. `Account`
*   **Purpose:** Standard NextAuth.js model for linking OAuth accounts to users.
*   **Key Fields:** `userId`, `type`, `provider`, `providerAccountId`, `refresh_token`, `access_token`, etc.
*   **Relations:** `User` (many-to-one)

#### 3.2.3. `Session`
*   **Purpose:** Standard NextAuth.js model for managing user sessions.
*   **Key Fields:** `sessionToken` (Unique), `userId`, `expires`.
*   **Relations:** `User` (many-to-one)

#### 3.2.4. `VerificationToken`
*   **Purpose:** Standard NextAuth.js model for email verification tokens (e.g., passwordless login, email confirmation).
*   **Key Fields:** `identifier`, `token` (Unique), `expires`.

### 3.3. Product Catalog Models

#### 3.3.1. `Product`
*   **Purpose:** Represents a sellable product in the store.
*   **Key Fields:**
    *   `id` (String, CUID, PK)
    *   `name` (String)
    *   `slug` (String, Unique, Indexed) - URL-friendly identifier.
    *   `description` (String, Text)
    *   `price` (Decimal) - Base price.
    *   `compareAtPrice` (Decimal?) - For showing discounts.
    *   `costPrice` (Decimal?) - For internal profit calculation.
    *   `sku` (String?, Unique) - Stock Keeping Unit.
    *   `barcode` (String?)
    *   `weight` (Float?) - In grams, for shipping.
    *   `dimensions` (Json?) - `{length, width, height}` in cm.
    *   `inStock` (Boolean, default: `true`)
    *   `lowStockThreshold` (Int?, default: 5)
    *   `stockQuantity` (Int?) - Overall stock if not using variants, or sum of variant stock.
    *   `featured` (Boolean, default: `false`, Indexed)
    *   `bestSeller` (Boolean, default: `false`)
    *   `isNew` (Boolean, default: `false`)
    *   `onSale` (Boolean, default: `false`)
    *   `saleEndDate` (DateTime?)
    *   `publishedAt` (DateTime?) - For scheduled publishing.
    *   `metaTitle` (String?), `metaDescription` (String?) - For SEO.
    *   `createdAt`, `updatedAt` (DateTime)
*   **Relations:**
    *   `ProductImage[]` (one-to-many)
    *   `Category[]` (many-to-many, via `ProductToCategory` relation table)
    *   `Tag[]` (many-to-many, via `ProductToTag` relation table)
    *   `OrderItem[]` (one-to-many)
    *   `Review[]` (one-to-many)
    *   `ProductVariant[]` (one-to-many)
    *   `Product[]` (many-to-many for `relatedProducts` and `recommendedWith`, self-relation via `RelatedProducts`)
    *   `CartItem[]` (one-to-many)
    *   `WishlistItem[]` (one-to-many)
    *   `Collection[]` (many-to-many, via `ProductToCollection` relation table)
    *   `ProductSubscription[]` (one-to-many)

#### 3.3.2. `ProductImage`
*   **Purpose:** Stores images associated with a product.
*   **Key Fields:**
    *   `id` (String, CUID, PK)
    *   `productId` (String)
    *   `url` (String) - Image URL.
    *   `altText` (String?)
    *   `width`, `height` (Int?)
    *   `position` (Int, default: 0) - For ordering images.
*   **Relations:** `Product` (many-to-one)

#### 3.3.3. `ProductVariant`
*   **Purpose:** Represents different versions of a product (e.g., size, color).
*   **Key Fields:**
    *   `id` (String, CUID, PK)
    *   `productId` (String)
    *   `name` (String) - e.g., "Large / Red".
    *   `sku` (String?) - Variant-specific SKU.
    *   `price` (Decimal?) - Overrides base product price if set.
    *   `stockQuantity` (Int?)
    *   `options` (Json) - Array of `{name, value}` pairs, e.g., `[{name: "Size", value: "L"}, {name: "Color", value: "Red"}]`.
    *   `imageUrl` (String?) - Variant-specific image.
    *   `isDefault` (Boolean, default: `false`)
*   **Relations:**
    *   `Product` (many-to-one)
    *   `CartItem[]` (one-to-many, if cart items can be specific variants)

#### 3.3.4. `Category`
*   **Purpose:** Organizes products into categories. Supports hierarchical categories.
*   **Key Fields:**
    *   `id` (String, CUID, PK)
    *   `name` (String, Unique)
    *   `slug` (String, Unique, Indexed)
    *   `description` (String?, Text)
    *   `imageUrl` (String?)
    *   `parentId` (String?) - For subcategories.
    *   `position` (Int, default: 0) - For ordering categories.
*   **Relations:**
    *   `Category?` (many-to-one, self-relation `CategoryHierarchy` for parent)
    *   `Category[]` (one-to-many, self-relation `CategoryHierarchy` for children)
    *   `Product[]` (many-to-many, via `ProductToCategory` relation table)

#### 3.3.5. `Tag`
*   **Purpose:** Allows tagging products with keywords for filtering and organization.
*   **Key Fields:**
    *   `id` (String, CUID, PK)
    *   `name` (String, Unique)
    *   `slug` (String, Unique, Indexed)
*   **Relations:** `Product[]` (many-to-many, via `ProductToTag` relation table)

#### 3.3.6. `Collection`
*   **Purpose:** Groups products into themed collections (e.g., "Summer Scents", "Holiday Gifts").
*   **Key Fields:**
    *   `id` (String, CUID, PK)
    *   `name` (String, Unique)
    *   `slug` (String, Unique, Indexed)
    *   `description` (String?, Text)
    *   `imageUrl` (String?)
    *   `active` (Boolean, default: `true`)
    *   `featured` (Boolean, default: `false`)
    *   `startDate`, `endDate` (DateTime?) - For time-limited collections.
*   **Relations:** `Product[]` (many-to-many, via `ProductToCollection` relation table)

### 3.4. Order Management Models

#### 3.4.1. `Order`
*   **Purpose:** Represents a customer's order.
*   **Key Fields:**
    *   `id` (String, CUID, PK)
    *   `userId` (String)
    *   `orderNumber` (String, Unique, Indexed) - User-friendly order identifier.
    *   `status` (Enum `OrderStatus`)
    *   `subtotal` (Decimal) - Sum of item prices before discounts, shipping, tax.
    *   `shippingCost` (Decimal)
    *   `tax` (Decimal)
    *   `total` (Decimal) - Final amount paid.
    *   `shippingAddress` (Json)
    *   `billingAddress` (Json?)
    *   `paymentMethod` (String?) - e.g., "credit_card", "paypal".
    *   `paymentIntentId` (String?) - Stripe Payment Intent ID.
    *   `currency` (String, default: "USD")
    *   `notes` (String?, Text) - Customer notes.
    *   `trackingNumber` (String?)
    *   `shippingMethod` (String?)
    *   `refundAmount` (Decimal?)
    *   `cancelReason` (String?)
    *   `createdAt`, `updatedAt` (DateTime)
*   **Relations:**
    *   `User` (many-to-one)
    *   `OrderItem[]` (one-to-many)
    *   `OrderHistory[]` (one-to-many)

#### 3.4.2. `OrderItem`
*   **Purpose:** Represents an individual item within an order.
*   **Key Fields:**
    *   `id` (String, CUID, PK)
    *   `orderId` (String)
    *   `productId` (String)
    *   `variantId` (String?) - If a specific variant was ordered.
    *   `name` (String) - Product name at time of purchase.
    *   `sku` (String?) - SKU at time of purchase.
    *   `price` (Decimal) - Price per unit at time of purchase.
    *   `quantity` (Int)
    *   `subtotal` (Decimal) - `price * quantity`.
    *   `imageUrl` (String?)
    *   `productData` (Json) - Snapshot of key product details at purchase time.
*   **Relations:**
    *   `Order` (many-to-one)
    *   `Product` (many-to-one) - Note: This links to the current product, `productData` stores historical info.

#### 3.4.3. `OrderHistory`
*   **Purpose:** Logs changes to an order's status or significant events.
*   **Key Fields:**
    *   `id` (String, CUID, PK)
    *   `orderId` (String)
    *   `status` (Enum `OrderStatus`)
    *   `comment` (String?, Text) - e.g., "Payment confirmed", "Shipped via UPS".
    *   `createdAt` (DateTime)
    *   `createdBy` (String?) - User ID of admin or system if automated.
*   **Relations:** `Order` (many-to-one)

### 3.5. Customer Interaction Models

#### 3.5.1. `Address`
*   **Purpose:** Stores customer shipping and billing addresses.
*   **Key Fields:**
    *   `id` (String, CUID, PK)
    *   `userId` (String)
    *   `addressLine1`, `addressLine2` (String)
    *   `city`, `state`, `postalCode`, `country` (String)
    *   `phoneNumber` (String?)
    *   `isDefault` (Boolean, default: `false`)
    *   `addressType` (Enum `AddressType`: `SHIPPING`, `BILLING`, `BOTH`)
*   **Relations:** `User` (many-to-one)

#### 3.5.2. `Review`
*   **Purpose:** Stores customer reviews for products.
*   **Key Fields:**
    *   `id` (String, CUID, PK)
    *   `userId` (String)
    *   `productId` (String)
    *   `rating` (Int, SmallInt) - e.g., 1-5.
    *   `title` (String?)
    *   `comment` (String?, Text)
    *   `status` (Enum `ReviewStatus`: `PENDING`, `APPROVED`, `REJECTED`) - For moderation.
    *   `helpful` (Int, default: 0) - Count of "helpful" votes.
    *   `notHelpful` (Int, default: 0)
    *   `isVerifiedPurchase` (Boolean, default: `false`)
    *   `createdAt`, `updatedAt` (DateTime)
*   **Relations:**
    *   `User` (many-to-one)
    *   `Product` (many-to-one)

#### 3.5.3. `QuizQuestion`
*   **Purpose:** Stores questions for the interactive scent quiz.
*   **Key Fields:**
    *   `id` (String, CUID, PK)
    *   `question` (String)
    *   `options` (Json) - Array of options, e.g., `[{label: "Option A", value: "A", tags: ["tag1"]}]`.
    *   `order` (Int) - For sequencing questions.
    *   `imageUrl` (String?) - Optional image for the question.
    *   `tooltipText` (String?) - Help text.
    *   `type` (String, e.g., "single", "multiple") - From `AdvancedScentQuiz.tsx`.
*   **Relations:** `QuizResponse[]` (one-to-many)

#### 3.5.4. `QuizResponse`
*   **Purpose:** Stores user's answers to quiz questions.
*   **Key Fields:**
    *   `id` (String, CUID, PK)
    *   `userId` (String?) - Nullable for anonymous users.
    *   `questionId` (String)
    *   `answer` (String) - Selected option value(s). Could be JSON for multiple answers.
    *   `sessionId` (String?) - For anonymous users to group responses.
    *   `createdAt` (DateTime)
*   **Relations:**
    *   `User?` (many-to-one, `onDelete: SetNull`)
    *   `QuizQuestion` (many-to-one)

#### 3.5.5. `NewsletterSubscriber`
*   **Purpose:** Stores email addresses of users who subscribed to the newsletter.
*   **Key Fields:**
    *   `id` (String, CUID, PK)
    *   `email` (String, Unique)
    *   `name` (String?)
    *   `active` (Boolean, default: `true`)
    *   `source` (String?) - e.g., "footer_form", "quiz_signup".
    *   `interests` (String[]) - Array of topic interests.
    *   `createdAt` (DateTime)

#### 3.5.6. `CartItem`
*   **Purpose:** Represents an item in a user's shopping cart.
*   **Key Fields:**
    *   `id` (String, CUID, PK)
    *   `userId` (String) - For logged-in users' persistent carts.
    *   `sessionId` (String?) - For guest carts (could link to `localStorage` key).
    *   `productId` (String)
    *   `variantId` (String?)
    *   `quantity` (Int)
    *   `addedAt` (DateTime)
*   **Relations:**
    *   `User` (many-to-one)
    *   `Product` (many-to-one)
    *   `ProductVariant?` (many-to-one, `onDelete: SetNull`)

#### 3.5.7. `WishlistItem`
*   **Purpose:** Represents an item in a user's wishlist.
*   **Key Fields:**
    *   `id` (String, CUID, PK)
    *   `userId` (String)
    *   `productId` (String)
    *   `addedAt` (DateTime)
*   **Constraints:** `@@unique([userId, productId])`
*   **Relations:**
    *   `User` (many-to-one)
    *   `Product` (many-to-one)

### 3.6. Subscription & Loyalty Models

#### 3.6.1. `ProductSubscription`
*   **Purpose:** Manages recurring product subscriptions for users.
*   **Key Fields:**
    *   `id` (String, CUID, PK)
    *   `userId` (String)
    *   `productId` (String)
    *   `frequency` (Enum `SubscriptionFrequency`)
    *   `active` (Boolean, default: `true`)
    *   `nextDelivery` (DateTime?)
    *   `createdAt` (DateTime)
*   **Relations:**
    *   `User` (many-to-one)
    *   `Product` (many-to-one)

#### 3.6.2. (Conceptual Loyalty Models)
These are not explicitly in the Prisma schema but are implied by `LoyaltyDashboard.tsx`.
*   **`LoyaltyTier`**: `id`, `name` (BRONZE, SILVER, GOLD, PLATINUM), `minPoints`, `benefits` (Json/String[]).
*   **`LoyaltyPointLog`**: `id`, `userId`, `pointsEarned`, `pointsSpent`, `description`, `orderId?`, `type` (EARN, REDEEM), `createdAt`.
*   **`Reward`**: `id`, `name`, `description`, `pointsCost`, `type` (DISCOUNT, FREE_PRODUCT, VOUCHER), `value`, `tierRequirement?`, `imageUrl?`, `expiresAt?`.
*   **`UserReward`**: `id`, `userId`, `rewardId`, `redeemedAt`, `status` (ACTIVE, USED, EXPIRED), `couponCode?`, `expiresAt?`.

### 3.7. Operational Models

#### 3.7.1. `Notification`
*   **Purpose:** Stores in-app notifications for users.
*   **Key Fields:**
    *   `id` (String, CUID, PK)
    *   `userId` (String)
    *   `type` (Enum `NotificationType`)
    *   `title` (String)
    *   `message` (String)
    *   `isRead` (Boolean, default: `false`)
    *   `data` (Json?) - e.g., `{orderId: "...", link: "/orders/..."}`.
    *   `createdAt` (DateTime)
*   **Relations:** `User` (many-to-one)

#### 3.7.2. `SiteSettings`
*   **Purpose:** Stores global site configuration manageable by admins. A single row table.
*   **Key Fields:**
    *   `id` (String, CUID, PK)
    *   `siteName` (String)
    *   `logoUrl`, `faviconUrl` (String?)
    *   `primaryColor`, `accentColor`, `ctaColor` (String) - For theme customization.
    *   `contactEmail`, `contactPhone` (String?)
    *   `socialLinks` (Json?) - e.g., `{twitter: "url", facebook: "url"}`.
    *   `shippingMethods` (Json?) - Array of shipping methods and rates.
    *   `taxRates` (Json?) - Tax rates by region.
    *   `metaTitle`, `metaDescription` (String?) - Default SEO for site.

#### 3.7.3. (Conceptual Smart Home Models)
Implied by `SmartHomeIntegration.tsx`.
*   **`SmartHomePlatformConnection`**: `id`, `userId`, `platformName` (e.g., "Philips Hue", "Google Home"), `accessToken`, `refreshToken`, `expiresAt`, `lastSyncedAt`.
*   **`SmartHomeDevice`**: `id`, `userId`, `platformConnectionId`, `externalDeviceId`, `name`, `type` (DIFFUSER, LIGHT), `roomName?`, `isOnline`, `isActive`, `capabilities` (Json).
*   **`AutomationRule`**: `id`, `userId`, `name`, `triggerType` (TIME, EVENT), `triggerConfig` (Json), `actions` (Json - array of device actions).
*   **`ScentSchedule`**: `id`, `userId`, `deviceId`, `name`, `entries` (Json - array of `{scentId, startTime, endTime, daysOfWeek}`).

#### 3.7.4. (Conceptual Inventory Models)
Implied by `InventoryForecasting.tsx`.
*   **`Supplier`**: `id`, `name`, `contactEmail`, `contactPhone`, `address`.
*   **`PurchaseOrder`**: `id`, `orderNumber`, `supplierId`, `status` (PENDING, SHIPPED, RECEIVED), `createdAt`, `expectedDeliveryDate`, `totalCost`.
*   **`PurchaseOrderItem`**: `id`, `purchaseOrderId`, `productId`, `quantityOrdered`, `quantityReceived`, `unitCost`.

### 3.8. Enums
*   **`Role`**: `ADMIN`, `MANAGER`, `CUSTOMER`
*   **`OrderStatus`**: `PENDING`, `PROCESSING`, `ON_HOLD`, `COMPLETED`, `CANCELLED`, `REFUNDED`, `FAILED`, `PAID`, `SHIPPED`, `DELIVERED`
*   **`AddressType`**: `SHIPPING`, `BILLING`, `BOTH`
*   **`ReviewStatus`**: `PENDING`, `APPROVED`, `REJECTED`
*   **`NotificationType`**: `ORDER_STATUS`, `STOCK_ALERT`, `PRICE_DROP`, `BACK_IN_STOCK`, `MARKETING`, `SYSTEM`
*   **`SubscriptionFrequency`**: `WEEKLY`, `BIWEEKLY`, `MONTHLY`, `BIMONTHLY`, `QUARTERLY`

## 4. API Design (tRPC Routers)

### 4.1. Overview
The API layer is built using tRPC, enabling end-to-end typesafe communication between the frontend and backend. All API logic resides within `src/server/api/routers/`. Procedures are defined as either `publicProcedure` (accessible by anyone) or `protectedProcedure` (requires authentication, often with role checks). Input validation is handled by Zod.

### 4.2. Core Routers

#### 4.2.1. `productsRouter` (`src/server/api/routers/products.ts`)
*   **`getAll` (publicProcedure):**
    *   Input: `z.object({ categoryId: z.string().optional(), tagIds: z.array(z.string()).optional(), featured: z.boolean().optional(), search: z.string().optional(), limit: z.number().optional(), cursor: z.string().optional() })`
    *   Output: `{ items: ProductWithAvgRating[], nextCursor: string | undefined }`
    *   Purpose: Fetches a paginated list of products with optional filtering and search. Calculates average rating.
*   **`getById` (publicProcedure):**
    *   Input: `z.object({ id: z.string() })` (or `slug: z.string()`)
    *   Output: `ProductWithDetailsAndAvgRating | null`
    *   Purpose: Fetches a single product by its ID or slug, including relations like categories, tags, reviews, and images. Calculates average rating.
*   **`search` (publicProcedure):** (From `SearchBox.tsx` logic)
    *   Input: `z.object({ query: z.string(), limit: z.number().optional() })`
    *   Output: `{ items: ProductSearchResult[] }`
    *   Purpose: Performs a search across product names and descriptions.

#### 4.2.2. `ordersRouter` (`src/server/api/routers/orders.ts`)
*   **`createPaymentIntent` (protectedProcedure):**
    *   Input: `z.object({ items: CartItemInput[], shippingMethodId: z.string(), shippingAddress: AddressInput })`
    *   Output: `{ clientSecret: string }`
    *   Purpose: Calculates order total and creates a Stripe Payment Intent.
*   **`createOrder` (protectedProcedure):**
    *   Input: `z.object({ paymentIntentId: z.string(), shippingAddress: AddressInput, shippingMethodId: z.string() })`
    *   Output: `{ id: string, orderNumber: string }`
    *   Purpose: Verifies payment, creates an order in the database, updates inventory, and sends notifications.
*   **`getUserOrders` (protectedProcedure):**
    *   Input: `z.object({ limit: z.number().optional(), cursor: z.string().optional() })`
    *   Output: `{ orders: Order[], nextCursor: string | undefined }`
    *   Purpose: Fetches a paginated list of orders for the logged-in user.
*   **`getOrderById` (protectedProcedure):**
    *   Input: `z.object({ id: z.string() })`
    *   Output: `OrderWithDetails | null`
    *   Purpose: Fetches a specific order, ensuring user ownership or admin rights.
*   **`cancelOrder` (protectedProcedure):**
    *   Input: `z.object({ id: z.string(), reason: z.string().optional() })`
    *   Output: `Order`
    *   Purpose: Allows a user or admin to cancel an eligible order.

#### 4.2.3. `usersRouter` (Conceptual, for user profile management)
*   **`getProfile` (protectedProcedure):**
    *   Input: `void`
    *   Output: `User` (with relevant profile data, excluding sensitive fields like password)
    *   Purpose: Fetches the current user's profile.
*   **`updateProfile` (protectedProcedure):**
    *   Input: `z.object({ name: z.string().optional(), image: z.string().optional(), /* other updatable fields */ })`
    *   Output: `User`
    *   Purpose: Updates the current user's profile.
*   **`getShippingAddress` (protectedProcedure):** (From `checkout.tsx`)
    *   Input: `void`
    *   Output: `Address | null` (default or most recent shipping address)
    *   Purpose: Fetches user's default/primary shipping address.
*   **`addAddress` / `updateAddress` / `deleteAddress` (protectedProcedure):** For managing user addresses.

#### 4.2.4. `cartRouter` (Conceptual, if syncing cart with DB)
*   **`getCart` (protectedProcedure):**
    *   Input: `void`
    *   Output: `{ items: CartItemDetail[] }`
    *   Purpose: Fetches the logged-in user's cart from the database.
*   **`addItemToCart` / `updateCartItem` / `removeItemFromCart` / `clearCart` (protectedProcedure):**
    *   Purpose: Modifies the user's database-backed cart.

#### 4.2.5. `wishlistRouter` (Based on `WishlistPage.tsx`)
*   **`getWishlist` (protectedProcedure):**
    *   Input: `void`
    *   Output: `WishlistItemWithProductDetails[]`
    *   Purpose: Fetches the logged-in user's wishlist.
*   **`addToWishlist` (protectedProcedure):**
    *   Input: `z.object({ productId: z.string() })`
    *   Output: `WishlistItem`
*   **`removeFromWishlist` (protectedProcedure):**
    *   Input: `z.object({ productId: z.string() })`
    *   Output: `{ success: boolean }`
*   **`clearWishlist` (protectedProcedure):**
    *   Input: `void`
    *   Output: `{ success: boolean }`

#### 4.2.6. `reviewsRouter` (Conceptual)
*   **`createReview` (protectedProcedure):**
    *   Input: `z.object({ productId: z.string(), rating: z.number().min(1).max(5), title: z.string().optional(), comment: z.string().optional() })`
    *   Output: `Review`
    *   Purpose: Allows a user (ideally a verified purchaser) to submit a review.
*   **`getReviewsForProduct` (publicProcedure):**
    *   Input: `z.object({ productId: z.string(), limit: z.number().optional(), cursor: z.string().optional() })`
    *   Output: `{ items: ReviewWithUser[], nextCursor: string | undefined }`

### 4.3. Advanced Feature Routers

#### 4.3.1. `quizRouter`
*   **`getQuestions` (publicProcedure):** (From `ScentQuiz.tsx`)
    *   Input: `void`
    *   Output: `QuizQuestion[]`
    *   Purpose: Fetches basic quiz questions.
*   **`submitResponse` (publicProcedure):** (From `ScentQuiz.tsx`, should be `getQuizRecommendations` in `recommendationsRouter` instead or this is for basic quiz result storage)
    *   Input: `z.object({ responses: Array<{ questionId: string; answer: string }> })`
    *   Output: `{ recommendedProducts: Product[] }`
*   **`getAdvancedQuizQuestions` (publicProcedure):** (From `AdvancedScentQuiz.tsx`)
    *   Input: `void`
    *   Output: `AdvancedQuizQuestion[]` (with types, detailed options including tags)

#### 4.3.2. `recommendationsRouter` (`src/server/api/routers/recommendations.ts`)
*   **`getPersonalized` (protectedProcedure):**
    *   Input: `void`
    *   Output: `ProductWithScore[]`
    *   Purpose: Generates recommendations based on user's order history and preferences.
*   **`getQuizRecommendations` (publicProcedure, mutation):**
    *   Input: `z.object({ responses: QuizResponseInput[], sessionId: z.string().optional(), limit: z.number().optional() })`
    *   Output: `{ recommendedProducts: ProductWithScore[], personality?: ScentPersonalityProfile }`
    *   Purpose: Generates recommendations based on (advanced) quiz responses, stores responses, and may return a scent personality.
*   **`getFrequentlyBoughtTogether` (publicProcedure):**
    *   Input: `z.object({ productId: z.string(), limit: z.number().optional() })`
    *   Output: `ProductWithCooccurrenceScore[]`
    *   Purpose: Finds products commonly purchased with a given product.

#### 4.3.3. `subscriptionsRouter` (Based on `SubscriptionManager.tsx`)
*   **`getUserSubscriptions` (protectedProcedure):**
    *   Input: `void`
    *   Output: `ProductSubscriptionWithDetails[]` (active subscriptions)
*   **`getSubscriptionHistory` (protectedProcedure):**
    *   Input: `void`
    *   Output: `ProductSubscriptionWithDetails[]` (past/cancelled subscriptions)
*   **`createSubscription` (protectedProcedure):**
    *   Input: `z.object({ productId: z.string(), frequency: z.nativeEnum(SubscriptionFrequency) })`
*   **`updateSubscription` (protectedProcedure):**
    *   Input: `z.object({ id: z.string(), frequency: z.nativeEnum(SubscriptionFrequency).optional(), nextDelivery: z.date().optional() })`
*   **`pauseSubscription` / `resumeSubscription` / `cancelSubscription` (protectedProcedure):**
    *   Input: `z.object({ id: z.string() })`
*   **`skipNextDelivery` (protectedProcedure):**
    *   Input: `z.object({ id: z.string() })`
*   **`getRecommendedProducts` (protectedProcedure):**
    *   Input: `void`
    *   Output: `Product[]` (products suitable for subscription)

#### 4.3.4. `loyaltyRouter` (Conceptual, based on `LoyaltyDashboard.tsx`)
*   **`getUserLoyalty` (protectedProcedure):**
    *   Output: `{ points: number, lifetimePoints: number, tier: string, benefits: string[], nextTierBenefits: string[] }`
*   **`getAvailableRewards` (protectedProcedure):**
    *   Output: `Reward[]`
*   **`getPointHistory` (protectedProcedure):**
    *   Output: `LoyaltyPointLogEntry[]`
*   **`getRedemptionHistory` (protectedProcedure):**
    *   Output: `UserRedeemedReward[]`
*   **`redeemReward` (protectedProcedure):**
    *   Input: `z.object({ rewardId: z.string() })`

#### 4.3.5. `smartHomeRouter` (Conceptual, based on `SmartHomeIntegration.tsx`)
*   **`getConnectedPlatforms` (protectedProcedure):**
    *   Output: `SmartHomePlatform[]`
*   **`connectPlatform` (protectedProcedure):**
    *   Input: `z.object({ platformName: z.string(), authCode: z.string() /* or other auth mechanism */ })`
*   **`getConnectedDevices` (protectedProcedure):**
    *   Output: `SmartHomeDevice[]`
*   **`addDevice` / `removeDevice` / `toggleDevice` (protectedProcedure):**
*   **`getAutomations` / `addAutomation` / `toggleAutomation` / `removeAutomation` (protectedProcedure):**
*   **`getScentSchedules` / `addScentSchedule` / `toggleScentSchedule` / `removeScentSchedule` (protectedProcedure):**

#### 4.3.6. `notificationsRouter` (Conceptual)
*   **`getNotifications` (protectedProcedure):**
    *   Input: `z.object({ limit: z.number().optional(), cursor: z.string().optional(), unreadOnly: z.boolean().optional() })`
    *   Output: `{ items: Notification[], nextCursor: string | undefined, unreadCount: number }`
*   **`markAsRead` (protectedProcedure):**
    *   Input: `z.object({ notificationId: z.string().optional(), markAllAsRead: z.boolean().optional() })`
*   **`deleteNotification` (protectedProcedure):**
    *   Input: `z.object({ notificationId: z.string() })`

### 4.4. Admin Routers
These routers would typically be nested under an `admin` main router and have role-based protection ensuring only `ADMIN` or `MANAGER` (with specific permissions) can access them.

#### 4.4.1. `admin.productsRouter`
*   **`createProduct` / `updateProduct` / `deleteProduct` (protectedProcedure - Admin/Manager):**
    *   Input/Output: Based on `ProductEditor.tsx` and `Product` model.
*   **`getProductById` (protectedProcedure - Admin/Manager):** For editing.
*   **`getAllProductsAdmin` (protectedProcedure - Admin/Manager):** Paginated list for admin view with more details (stock, SKU, etc.).

#### 4.4.2. `admin.ordersRouter`
*   **`getAllOrders` (protectedProcedure - Admin/Manager):** Paginated list of all orders with filtering.
*   **`updateOrderStatus` (protectedProcedure - Admin/Manager):**
    *   Input: `z.object({ orderId: z.string(), status: z.nativeEnum(OrderStatus), trackingNumber: z.string().optional(), notes: z.string().optional() })`
*   **`processRefund` (protectedProcedure - Admin/Manager):**

#### 4.4.3. `admin.usersRouter`
*   **`getAdminUsers` (protectedProcedure - Admin):** (From `RoleManagement.tsx`) Fetches users with admin-level roles.
*   **`createAdminUser` (protectedProcedure - Admin):**
    *   Input: `z.object({ name: z.string(), email: z.string().email(), roleId: z.string(), sendInvite: z.boolean() })`
*   **`updateUserRole` (protectedProcedure - Admin):**
    *   Input: `z.object({ userId: z.string(), roleId: z.string() })`
*   **`toggleUserStatus` (protectedProcedure - Admin):** (Activate/Deactivate user)
    *   Input: `z.object({ userId: z.string() })`
*   **`getAllCustomers` (protectedProcedure - Admin/Manager):** Paginated list of customer users.

#### 4.4.4. `admin.rolesRouter` (Based on `RoleManagement.tsx`)
*   **`getAllRoles` (protectedProcedure - Admin):**
    *   Output: `RoleWithUserCount[]`
*   **`getAllPermissions` (protectedProcedure - Admin):**
    *   Output: `Permission[]`
*   **`createRole` / `updateRole` / `deleteRole` (protectedProcedure - Admin):**
    *   Input for create/update: `z.object({ name: z.string(), description: z.string().optional(), permissions: z.array(z.string()) })`

#### 4.4.5. `admin.analyticsRouter` (Conceptual, based on `AdvancedAnalyticsDashboard.tsx`)
*   **`getDashboardStats` (protectedProcedure - Admin/Manager):** (From `AdminDashboard.tsx`) Basic stats for dashboard.
*   **`getAdvancedMetrics` (protectedProcedure - Admin):**
    *   Input: `z.object({ from: z.stringDate(), to: z.stringDate(), metrics: z.array(AnalyticsMetric), dimension: AnalyticsDimension })`
    *   Output: Complex object with time series data, totals, changes.
*   **`getCustomerSegments` / `getProductPerformance` / `getSalesByChannel` (protectedProcedure - Admin):**

#### 4.4.6. `admin.inventoryRouter` (Conceptual, based on `InventoryForecasting.tsx`)
*   **`getInventoryForecasts` (protectedProcedure - Admin/Manager):**
    *   Output: Data including product stock, forecasted demand, depletion dates, purchase orders.
*   **`getSuppliers` (protectedProcedure - Admin/Manager):**
*   **`createPurchaseOrder` (protectedProcedure - Admin/Manager):**
    *   Input: Based on `purchaseOrderData` state in component.
*   **`generatePurchaseOrders` (protectedProcedure - Admin/Manager):** (Automated PO generation)

#### 4.4.7. `admin.settingsRouter` (Conceptual)
*   **`getSiteSettings` (protectedProcedure - Admin):**
*   **`updateSiteSettings` (protectedProcedure - Admin):**
    *   Input: Based on `SiteSettings` model.

## 5. Frontend Design

### 5.1. Overall Structure & Layout
The frontend is structured using Next.js Pages Router.
*   **`src/pages/_app.tsx`:** Main application shell. Wraps pages with:
    *   `SessionProvider` (NextAuth.js)
    *   `ThemeProvider` (`next-themes` for dark/light mode)
    *   `CartProvider`, `WishlistProvider`, `LocalizationProvider`, `NotificationsProvider` (Custom React Contexts)
    *   `DefaultSeo` for global SEO settings.
    *   `Layout` component.
    *   `Toaster` (`react-hot-toast`) for notifications.
    *   `Analytics` (`@vercel/analytics/react`).
    *   `api.withTRPC(MyApp)` to enable tRPC.
*   **`src/components/layout/Layout.tsx`:** Contains common UI elements like Navbar, Footer, and potentially a main content wrapper.
*   **`src/components/admin/AdminLayout.tsx`:** Specific layout for admin dashboard pages, including sidebar navigation and header.
*   **Individual Pages (`src/pages/`):** Each page component defines its specific content and uses shared layout components. Dynamic routes like `products/[slug].tsx` and `admin/products/[id].tsx` handle specific item views.

### 5.2. State Management
*   **Client-Side UI State:** Managed by React's `useState` and `useEffect` hooks within individual components.
*   **Cross-Component Shared State (Global):**
    *   **React Context API:**
        *   `CartContext`: Manages `items`, `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `itemCount`, `total`. Persists to `localStorage`.
        *   `WishlistContext`: Manages wishlist items, syncs with backend for logged-in users.
        *   `LocalizationContext`: Handles `language`, `currency`, `translations`, `formatPrice`, `t` function. Persists preferences to `localStorage`.
        *   `NotificationsContext`: (Conceptual) Manages display of in-app notifications fetched from the server.
    *   **Zustand (Recommended for more complex state):** While Context is used, Zustand could be considered for more complex global states if performance with Context becomes an issue, or for managing states that change very frequently.
*   **Server Cache State (tRPC & React Query):** Data fetched via tRPC is automatically managed by React Query (`@tanstack/react-query`), which handles caching, background updates, loading/error states, optimistic updates, and invalidation. This significantly simplifies data fetching and synchronization.

### 5.3. Styling
*   **TailwindCSS:** The primary styling solution. Utility classes are used directly in components for rapid development.
    *   `tailwind.config.ts`: Defines custom theme settings:
        *   `darkMode: "class"`
        *   Custom `colors`: `primary` (e.g., `#2a7c8a`), `accent` (e.g., `#e0a86f`), `cta` (e.g., `#ff7b4f`) with light/dark variants.
        *   Custom `fontFamily`: `sans` (e.g., `var(--font-sans)`).
        *   Custom `animation` and `keyframes`: `fadeIn`, `slideInRight`, `slideInLeft`.
    *   `@tailwindcss/forms` plugin for better default form styling.
*   **Global Styles (`src/styles/globals.css`):** Contains base styles, TailwindCSS directives (`@tailwind base; @tailwind components; @tailwind utilities;`), and custom global CSS if needed (e.g., font imports).
*   **Dark/Light Mode:** Managed by `next-themes` and Tailwind's `dark:` variant. `ThemeToggle.tsx` component allows users to switch themes, with preference stored in `localStorage`.
*   **Component-Specific Styles:** If necessary, CSS Modules can be used for highly specific component styling that doesn't fit well with utility classes, though Tailwind often suffices.

### 5.4. Key UI Components

#### 5.4.1. Shared UI Components (`src/components/ui/`)
These are generic, reusable components, likely inspired by or built using Shadcn/ui principles.
*   **`Button.tsx`:** Standard button with variants (primary, secondary, destructive, outline, link), sizes, loading state, and `href` prop for navigation.
*   **`Input.tsx`, `Textarea.tsx`, `Select.tsx`, `MultiSelect.tsx`, `Checkbox.tsx`, `RadioGroup.tsx`, `Switch.tsx`, `Label.tsx`:** Form elements.
*   **`Card.tsx`:** Styled container for content blocks.
*   **`Badge.tsx`:** Small status indicators.
*   **`Dialog.tsx`, `ConfirmDialog.tsx`:** Modal dialogs.
*   **`Tabs.tsx`:** Tabbed navigation.
*   **`Progress.tsx`:** Progress bar.
*   **`Spinner.tsx` / `LoadingSpinner.tsx`:** Loading indicators.
*   **`Skeleton.tsx`:** Placeholder for loading content.
*   **`DatePicker.tsx`, `DateRangePicker.tsx`:** For date selection.
*   **`Tooltip.tsx`:** For displaying informational tooltips.
*   **`ImageUploader.tsx`:** For handling file uploads (images).
*   **`ThemeToggle.tsx`:** Toggles dark/light mode.
*   **`AudioToggle.tsx`:** Toggles ambient background audio.
*   **`EmptyState.tsx`:** Displays a message when no data is available.
*   **`Rating.tsx`:** Displays star ratings.
*   **`Steps.tsx`:** For multi-step processes like checkout.

#### 5.4.2. Layout Components (`src/components/layout/`)
*   **`Layout.tsx`:** Main application layout, includes Navbar, Footer.
*   **`Navbar.tsx` (Conceptual):** Contains navigation links, search bar, user menu (login/signup, profile, orders), cart icon, theme toggle, localization switcher.
*   **`Footer.tsx` (Conceptual):** Contains links to informational pages, social media, newsletter signup.
*   **`AdminLayout.tsx`:** Layout for the admin dashboard, including a sidebar for navigation (Dashboard, Products, Orders, Users, Settings, etc.) and a header.

#### 5.4.3. Feature-Specific Components
*   **Products:**
    *   `ProductCard.tsx`, `ProductCardHorizontal.tsx`: Display individual product information in listings.
    *   `ProductGrid.tsx`: Renders a grid of `ProductCard` components.
    *   `ProductGallery.tsx`: Displays product images with thumbnails/carousel on the product detail page.
    *   `ProductReviews.tsx`: Fetches and displays reviews for a product.
    *   `RecommendedProducts.tsx`: Displays related or recommended products.
    *   `ARVisualization.tsx`: Handles 3D model viewing and AR experience.
        *   `ModelViewer.tsx` (dynamically imported): Web component for 3D/AR rendering.
*   **Quiz:**
    *   `ScentQuiz.tsx` (Basic): Implements the initial version of the scent quiz.
    *   `AdvancedScentQuiz.tsx`: Implements the AI-powered, more detailed quiz with personality profiling.
*   **Checkout:**
    *   `CheckoutForm.tsx`: Stripe Elements form for payment details.
    *   `OrderSummary.tsx`: Displays items, subtotal, shipping, tax, and total during checkout.
    *   `ShippingAddressForm.tsx`: Form for collecting shipping address.
*   **Search:**
    *   `SearchBox.tsx`: Input field with debounced search, autocomplete suggestions, and navigation to search results page.
*   **Admin:**
    *   `AdminDashboard.tsx`: Main entry point for admin, showing overview stats and charts.
    *   `RecentOrders.tsx`, `SalesChart.tsx`, `StatCard.tsx`, `LowStockProducts.tsx`, `TopSellingProducts.tsx`: Widgets for the admin dashboard.
    *   `ProductEditor.tsx`: Comprehensive form for creating/editing products, including tabs for basic info, images, variants, inventory, SEO.
    *   `ImageSortable.tsx`, `VariantEditor.tsx`: Sub-components for `ProductEditor`.
    *   `AdvancedAnalyticsDashboard.tsx`: Displays detailed analytics with charts and tables.
    *   `RoleManagement.tsx`: UI for managing admin users, roles, and permissions.
    *   `InventoryForecasting.tsx`: UI for viewing inventory forecasts and managing purchase orders.
*   **Subscription & Loyalty:**
    *   `SubscriptionManager.tsx`: UI for users to manage their product subscriptions.
    *   `LoyaltyDashboard.tsx`: UI for users to view loyalty points, tier, benefits, and redeem rewards.
*   **Smart Home:**
    *   `SmartHomeIntegration.tsx`: UI for users to connect smart home platforms, manage devices, and set up automations/schedules.

### 5.5. Key Pages (`src/pages/`)
*   **`/index.tsx` (Home Page):** Hero section, featured products, about snippets, testimonials, newsletter signup. Implements parallax effects.
*   **`/products/index.tsx` (Product Listing Page):** Displays all products with filtering, sorting, and pagination.
*   **`/products/[slug].tsx` (Product Detail Page):** Displays detailed information for a single product, including images, variants, description, reviews, AR visualization, add to cart/wishlist.
*   **`/cart.tsx` (Shopping Cart Page):** Displays cart items, allows quantity updates, removal, and proceeding to checkout.
*   **`/checkout.tsx` (Checkout Page):** Multi-step checkout process (information, shipping, payment).
*   **`/order-confirmation/[orderNumber].tsx` (Order Confirmation Page):** Displays order success message and summary.
*   **`/quiz.tsx` (Scent Quiz Page):** Hosts the `AdvancedScentQuiz` component.
*   **`/auth/signin.tsx`, `/auth/signup.tsx`:** Custom pages for authentication.
*   **`/account/profile.tsx` (Conceptual):** User profile management.
*   **`/account/orders.tsx` (Conceptual):** User's order history.
*   **`/account/wishlist.tsx` / `/wishlist.tsx`:** (`WishlistPage.tsx`) User's wishlist.
*   **`/account/subscriptions.tsx` (Conceptual):** Hosts `SubscriptionManager.tsx`.
*   **`/account/loyalty.tsx` (Conceptual):** Hosts `LoyaltyDashboard.tsx`.
*   **`/account/smart-home.tsx` (Conceptual):** Hosts `SmartHomeIntegration.tsx`.
*   **`/admin/dashboard.tsx`:** Main admin dashboard page.
*   **`/admin/products/index.tsx`, `/admin/products/new.tsx`, `/admin/products/[id].tsx`:** Admin product management pages (list, create, edit).
*   **`/admin/orders/index.tsx`, `/admin/orders/[id].tsx`:** Admin order management pages.
*   **`/admin/users/index.tsx` (Conceptual):** Admin user management.
*   **`/admin/roles.tsx` (Conceptual):** Hosts `RoleManagement.tsx`.
*   **`/admin/analytics.tsx` (Conceptual):** Hosts `AdvancedAnalyticsDashboard.tsx`.
*   **`/admin/inventory/forecasting.tsx` (Conceptual):** Hosts `InventoryForecasting.tsx`.
*   **`/admin/settings.tsx` (Conceptual):** Site settings management.
*   **`/search.tsx` (Search Results Page):** Displays products matching a search query.

## 6. Detailed Feature Design

### 6.1. User Authentication & Profile
*   **Registration:** Users can sign up using email/password or Google OAuth. Passwords are hashed using `bcryptjs` before storing.
*   **Login:** Users can log in using credentials or OAuth. Session managed by NextAuth.js using JWTs.
*   **Profile Management:** Logged-in users can access an account section to:
    *   Update personal information (name, image).
    *   Manage saved addresses (shipping, billing).
    *   View order history.
    *   Manage product subscriptions.
    *   View loyalty points and tier.
    *   Manage smart home connections.
*   **Password Reset:** Standard "forgot password" flow involving email verification (requires email service).
*   **Role Assignment:** Users are assigned a `Role` (`CUSTOMER` by default). Admins can manage roles for admin users.

### 6.2. Product Catalog & Discovery
*   **Product Listing:** Products are displayed in a grid or list format on `/products`.
    *   Pagination (`cursor`-based) is implemented for efficient loading.
    *   Each product card shows name, image, price, average rating, and quick add-to-cart/wishlist buttons.
*   **Filtering & Sorting:** Users can filter products by:
    *   Category
    *   Tags
    *   Price range (conceptual)
    *   Featured status
    *   On-sale status
    *   Search query (name, description)
    *   Sorting options: Price (low-high, high-low), Newest, Popularity/Rating.
*   **Search:** A global `SearchBox.tsx` component provides instant search suggestions with debounce and navigates to a dedicated `/search` page for full results. Search queries backend via `productsRouter.search`.
*   **Categories & Collections:** Dedicated pages for browsing products by category or collection (e.g., `/categories/[slug]`, `/collections/[slug]`).

### 6.3. Product Detail Page (`/products/[slug].tsx`)
*   **Dynamic Content:** Fetches product data server-side (`getServerSideProps`) using Prisma based on the `slug`.
*   **Product Information:**
    *   Name, detailed description, price (and compare-at-price with discount percentage).
    *   Sale countdown timer if applicable.
    *   Average rating and review count, linking to reviews section.
    *   SKU, stock status (based on product or selected variant).
    *   Dimensions, weight (if available).
*   **Image Gallery:** `ProductGallery.tsx` displays multiple product images with zoom/lightbox functionality. Main image updates based on selected variant's image if available.
*   **Variant Selection:** If variants exist, users can select options (e.g., size, scent profile). Price and image update dynamically based on selection.
*   **Quantity Selector:** Allows users to choose the quantity to add to cart.
*   **Actions:** "Add to Cart" (updates `CartContext`), "Add to Wishlist" (updates `WishlistContext`).
*   **Tabs:**
    *   `Description`: Full product description.
    *   `Ingredients`/`Details`: Additional product-specific information.
    *   `Shipping & Returns`: Information about shipping policies and returns.
*   **Reviews Section:** `ProductReviews.tsx` displays customer reviews and a form to submit a new review (for logged-in users).
*   **Related/Recommended Products:** `RecommendedProducts.tsx` shows similar products or "frequently bought together" items fetched via `recommendationsRouter`.
*   **AR Visualization:** `ARVisualization.tsx` component embedded to allow users to view the product in 3D or AR.
*   **SEO:** Includes structured data (JSON-LD) for product schema to improve search engine visibility.

### 6.4. Shopping Cart
*   **Functionality:** Managed by `CartContext.tsx`.
    *   Add items (product or specific variant).
    *   Remove items.
    *   Update item quantity.
    *   Clear cart.
*   **Persistence:** Cart items are stored in `localStorage` for guest users and synced with the `CartItem` table in the database for logged-in users (conceptual DB sync, current code is localStorage only).
*   **UI:**
    *   Cart icon in Navbar displays item count.
    *   Dropdown/sidebar cart preview (conceptual).
    *   Dedicated `/cart` page to view and manage cart items, view subtotal, and proceed to checkout.

### 6.5. Checkout Process (`/checkout.tsx`)
A multi-step process guided by the `Steps.tsx` component.
*   **Step 1: Information:**
    *   `ShippingAddressForm.tsx` collects customer's contact email and shipping address details.
    *   Pre-fills form for logged-in users using their saved default address or profile info.
*   **Step 2: Shipping Method:**
    *   User selects a shipping method from available options (e.g., Standard, Express).
    *   Shipping cost is calculated and added to the total.
    *   Upon confirming shipping, a `PaymentIntent` is created via `ordersRouter.createPaymentIntent`.
*   **Step 3: Payment:**
    *   `CheckoutForm.tsx` (using Stripe Elements) securely collects payment information.
    *   Requires `clientSecret` from the `PaymentIntent`.
    *   Handles payment submission to Stripe.
    *   On successful payment, `ordersRouter.createOrder` is called.
*   **Order Summary:** `OrderSummary.tsx` is displayed throughout the checkout, updating with selected shipping and calculated tax.
*   **Security:** Payment information is handled directly by Stripe Elements, ensuring PCI compliance.
*   **Order Confirmation:** Upon successful order creation, the user is redirected to `/order-confirmation/[orderNumber]`. The cart is cleared.

### 6.6. Order Management (User)
*   **Order History:** Logged-in users can view a list of their past orders in their account section (`/account/orders`).
    *   Displays order number, date, total amount, status.
    *   Link to view detailed order information.
*   **Order Details:** View individual order details, including items purchased, shipping address, billing address, payment information, and order status history.
*   **Order Cancellation:** Users may be able to cancel orders if they are in a cancellable state (e.g., "PENDING", "PROCESSING") via `ordersRouter.cancelOrder`.
*   **Tracking:** If a tracking number is available, it's displayed. (Conceptual link to shipping provider).

### 6.7. Advanced Scent Quiz (`/quiz.tsx` using `AdvancedScentQuiz.tsx`)
*   **Dynamic Questions:** Fetches questions from `quizRouter.getAdvancedQuizQuestions`. Questions can be single-choice or multiple-choice, with descriptions and images.
*   **Progress Tracking:** Displays current step and percentage completion.
*   **Response Handling:** User responses are stored locally in component state (`responses` object).
*   **Submission:** On completion, responses are formatted and sent to `recommendationsRouter.getQuizRecommendations`.
    *   For anonymous users, a `sessionId` is generated and sent.
    *   For logged-in users, responses are linked to their `userId`.
*   **Personalized Results:**
    *   Displays a list of recommended products (`ProductGrid`).
    *   May display a "Scent Personality" profile (`personality` object: type, description, traits).
    *   Option to view detailed responses and associated scent traits.
*   **Retake Quiz:** Option to start over.

### 6.8. Wishlist Management
*   **Functionality:** Managed by `WishlistContext.tsx` and `wishlistRouter`.
    *   Users can add products to their wishlist from product cards or product detail pages.
    *   Users can remove products from their wishlist.
*   **Persistence:** Stored in `localStorage` for guests. For logged-in users, it syncs with the `WishlistItem` table in the database.
*   **UI (`/wishlist.tsx` or `/account/wishlist.tsx`):**
    *   `WishlistPage.tsx` displays a list of wishlisted items (`ProductCardHorizontal`).
    *   Actions per item: Add to Cart, Remove from Wishlist.
    *   Option to clear the entire wishlist.
    *   Recommendations for "You Might Also Like".

### 6.9. Subscription System
*   **Product Subscription:** Users can subscribe to eligible products for recurring delivery.
    *   Subscription options (frequency) available on product detail pages or during checkout.
*   **Management UI (`SubscriptionManager.tsx` at `/account/subscriptions`):**
    *   View active subscriptions: product, frequency, price, next delivery date, status (Active/Paused).
    *   Actions: Pause, Resume, Edit Frequency, Skip Next Delivery, Cancel.
    *   View subscription history (cancelled/past subscriptions) with an option to resubscribe.
    *   Recommended products for new subscriptions.
*   **Backend (`subscriptionsRouter`):** Handles CRUD operations for subscriptions, status changes, and potentially payment processing for renewals (integration with Stripe Subscriptions needed).

### 6.10. Loyalty Program
*   **Point System:** Users earn points for purchases and other engagement actions (e.g., reviews, quiz completion - conceptual).
*   **Tier System:** (e.g., Bronze, Silver, Gold, Platinum) based on lifetime points, each tier unlocking more benefits.
*   **Management UI (`LoyaltyDashboard.tsx` at `/account/loyalty`):**
    *   Displays current points, lifetime points, current tier.
    *   Shows progress to the next tier.
    *   Lists membership benefits for current and next tier.
    *   **Available Rewards Tab:** Browse rewards (discounts, free products, exclusive access) redeemable with points.
    *   **Points History Tab:** Log of points earned and spent.
    *   **Redemption History Tab:** Log of rewards redeemed.
*   **Reward Redemption:** Users can redeem available rewards if they have enough points.
*   **Backend (`loyaltyRouter` - Conceptual):** Manages point calculation, tier progression, reward definitions, and redemption logic.

### 6.11. AR Product Visualization
*   **Integration:** `ARVisualization.tsx` component on product detail pages.
*   **Modes:**
    *   **Product Preview:** Static image of the product.
    *   **3D View:** Interactive 3D model viewer (`ModelViewer.tsx` - dynamically imported to avoid SSR issues with WebXR components). Allows rotation, zoom (controlled by `modelScale` slider). Displays product dimensions.
    *   **Try in Your Space (AR):**
        *   Checks for WebXR `immersive-ar` support.
        *   Activates device camera (rear-facing).
        *   Overlays the 3D model onto the camera feed. (Actual AR rendering logic relies on a WebXR library like AR.js or Model Viewer's AR capabilities).
        *   Allows taking screenshots.
        *   Surface selection (table, floor, wall) to aid placement (conceptual).
*   **Models:** Requires 3D models (e.g., `.glb`, `.usdz` format) provided via `modelUrl`.

### 6.12. Multi-language & Multi-currency
*   **`LocalizationContext.tsx`:**
    *   Manages current `language` and `currency`.
    *   Stores preferences in `localStorage`.
    *   `setLanguage(code)`: Changes language, fetches new translations (simulated in current code, needs actual translation files/service), updates Next.js locale.
    *   `setCurrency(currency)`: Changes currency.
    *   `formatPrice(price)`: Converts and formats price based on selected currency and exchange rate.
    *   `t(key, params?)`: Translation function, looks up `key` in loaded `translations` (or returns key if not found).
*   **UI:** Language and currency switchers in Navbar/Footer.
*   **Content:** Product descriptions, names, UI text need to be translatable. Requires a system for managing translation strings (e.g., JSON files per language, a CMS, or a translation management service).
*   **Currency Rates:** `AVAILABLE_CURRENCIES` includes `exchangeRate`. These rates would need to be updated regularly from an external API in a production system.

### 6.13. Smart Home Integration
*   **Management UI (`SmartHomeIntegration.tsx` at `/account/smart-home`):**
    *   **Connect Platforms:** Users can connect to supported smart home platforms (e.g., Philips Hue, Google Home, Amazon Alexa - requires OAuth flows per platform).
    *   **Manage Devices:** View connected aromatherapy devices (diffusers, smart plugs controlling diffusers).
        *   Toggle device on/off.
        *   View status (online, current scent, battery).
    *   **Automations:** Create rules (e.g., "Turn on diffuser in living room at 7 PM").
        *   Trigger: Time, Event (e.g., user arrives home - conceptual, needs location services), Condition (e.g., weather).
        *   Action: Control device (on/off, set scent - if device supports).
    *   **Scent Schedules:** Create schedules for specific diffusers to change scents at different times/days.
*   **Backend (`smartHomeRouter` - Conceptual):**
    *   Handles OAuth token management for connected platforms.
    *   Proxies commands to smart home platform APIs.
    *   Stores device information, automations, and schedules.
*   **Device Compatibility:** Focuses on aromatherapy-related devices.

### 6.14. Admin Dashboard Features

#### 6.14.1. Admin Dashboard Overview (`/admin/dashboard.tsx`)
*   **Key Metrics:** `StatCard.tsx` displays total sales, new orders, new customers, conversion rate, with percentage change over a selected date range (today, week, month, year).
*   **Sales Overview:** `SalesChart.tsx` (Recharts LineChart) visualizes sales trends over the selected period.
*   **Recent Orders:** `RecentOrders.tsx` lists the latest orders with quick view options.
*   **Top Selling Products:** `TopSellingProducts.tsx` lists best-performing products.
*   **Low Stock Products:** `LowStockProducts.tsx` highlights products needing reordering.
*   **Protected Route:** Access restricted by `withAdminAuth()` HOC or similar tRPC middleware.

#### 6.14.2. Admin Product Management
*   **List Products (`/admin/products`):** Paginated table of all products with key details (name, SKU, price, stock, status). Search and filter options.
*   **Create/Edit Product (`ProductEditor.tsx` at `/admin/products/new` or `/admin/products/[id]`):**
    *   Tabbed interface: Basic Info, Images, Variants, Inventory, SEO.
    *   **Basic Info:** Name, slug (auto-generated or manual), description, price, compare-at-price, categories, tags, status flags (featured, best-seller, new, on-sale, sale end date).
    *   **Images:** `ImageUploader.tsx` for new images, `ImageSortable.tsx` to reorder/remove existing images.
    *   **Variants:** `VariantEditor.tsx` to define product variants (name, SKU, price override, stock, options).
    *   **Inventory:** Cost price, weight, dimensions, stock quantity (for product or each variant), low stock threshold.
    *   **SEO:** Meta title, meta description, with a search engine preview.
*   **Backend (`admin.productsRouter`):** Handles CRUD operations. Image uploads would involve separate logic, potentially using presigned URLs to S3 or a dedicated upload endpoint.

#### 6.14.3. Admin Order Management (`/admin/orders`, `/admin/orders/[id]`)
*   **List Orders:** Paginated table of all orders with filtering by status, date range, customer.
*   **Order Details View:** Comprehensive view of an order: items, customer details, shipping/billing addresses, payment info, order history log.
*   **Status Updates:** Admins can update order status (e.g., Processing -> Shipped). This logs an entry in `OrderHistory` and notifies the customer.
*   **Add Tracking Information.**
*   **Process Refunds:** Interface to initiate refunds (integrates with Stripe).
*   **Backend (`admin.ordersRouter`):** Handles fetching and updating orders.

#### 6.14.4. Role-Based Access Control (RBAC) Management (`RoleManagement.tsx` at `/admin/roles`)
*   **Admin Users Tab:**
    *   List admin users with name, email, role, last active, status.
    *   Filter by search query or role.
    *   Add new admin users (name, email, assign role, send invite).
    *   Change existing user's role.
    *   Activate/Deactivate admin users.
    *   Delete admin users (with confirmation).
*   **Roles & Permissions Tab:**
    *   List available roles (e.g., ADMIN, MANAGER, CONTENT_EDITOR). Shows user count per role.
    *   Indicates system/default roles (non-deletable/editable).
    *   Create new roles: name, description.
    *   Edit roles: Modify name, description, assign/unassign permissions.
    *   View permissions grouped by category (Products, Orders, Customers, etc.). Permissions are granular (e.g., "product.create", "product.edit", "order.view_all", "order.update_status").
    *   Delete custom roles (if no users assigned).
*   **Backend (`admin.rolesRouter`, `admin.usersRouter`):** Manages CRUD for roles, permissions, and user-role assignments.

#### 6.14.5. Advanced Analytics Dashboard (`AdvancedAnalyticsDashboard.tsx` at `/admin/analytics`)
*   **Interactive Interface:** Uses Recharts for visualizations.
*   **Date Range Picker:** Allows selecting custom date ranges for analysis.
*   **Metric & Dimension Selection:**
    *   Primary metric (Revenue, Orders, Customers, AOV, Conversion, Retention).
    *   Optional comparison metric.
    *   Time dimension (Daily, Weekly, Monthly).
*   **Summary Cards:** Key KPIs with percentage change.
*   **Time Series Chart:** Line chart showing trends of selected metric(s) over time.
*   **Detailed Breakdowns (Tabs):**
    *   **Customer Segments:** Revenue by customer type (New vs. Returning), Acquisition vs. Retention counts, LTV trend.
    *   **Product Performance:** Top performing products table (revenue, units sold, avg. rating, conversion, trend), Revenue by Category bar chart.
    *   **Sales Channels:** Revenue by channel (Direct, Organic, Social, Referral) pie chart, Conversion Rate by channel bar chart, Channel performance over time line chart.
*   **Data Export:** Option to export data (CSV, PDF, Excel).
*   **Backend (`admin.analyticsRouter` - Conceptual):** Performs complex aggregations and calculations on order, user, and product data to generate analytics insights. This is computationally intensive and may require optimized queries or a separate data warehousing solution for very large datasets.

#### 6.14.6. Inventory Forecasting System (`InventoryForecasting.tsx` at `/admin/inventory/forecasting`)
*   **Dashboard Overview:**
    *   Summary cards: Total products, Out of stock count, Low stock count, Total inventory value, Average turnover rate.
    *   Date range selection for forecast period.
*   **Products Inventory Tab:**
    *   Table of products: Name, SKU, category, current stock (with progress bar relative to low stock threshold), stock status badge, forecasted monthly demand, estimated depletion date.
    *   Filtering: Search, category, stock status (out of stock, low stock).
    *   Sorting: Name, stock level, forecasted demand, turnover rate.
    *   Action: Create purchase order for a product.
*   **Demand Forecasts Tab:**
    *   Charts: Forecasted demand by category (Pie), Historical vs. Forecasted demand trend (Line), Top products by forecasted demand vs. current stock (Bar).
*   **Purchase Orders Tab:**
    *   List existing purchase orders: PO #, product, supplier, quantity, total cost, status (Pending, Shipped, Delivered), expected delivery.
    *   Actions: Create new PO, view/edit existing POs (conceptual).
*   **Automated PO Generation:** Button to trigger `admin.inventoryRouter.generatePurchaseOrders` based on forecast and stock levels.
*   **Create Purchase Order Dialog:** Form to manually create a PO: select product, supplier, quantity, unit cost, expected delivery.
*   **Backend (`admin.inventoryRouter` - Conceptual):**
    *   Calculates demand forecasts (e.g., using historical sales data, moving averages, seasonality - this is a complex AI/ML task in itself or relies on simpler heuristics).
    *   Manages supplier information and purchase order lifecycle.

## 7. Non-Functional Requirements

### 7.1. Performance
*   **Page Load Time:** Target <3 seconds for key pages (Homepage, Product Listing, Product Detail).
*   **API Response Time:** Target <500ms for 95th percentile of tRPC queries/mutations under normal load.
*   **Database Queries:** Optimized Prisma queries, use of indexes (defined in schema).
*   **Frontend Rendering:** Efficient React components, minimize re-renders, code splitting (Next.js default), lazy loading for non-critical components/images.
*   **Image Optimization:** Use `next/image` for automatic optimization, responsive image sizes, and modern formats (WebP).
*   **Caching:**
    *   Client-side: React Query for API responses.
    *   Server-side: Potential for caching expensive computations or database queries (e.g., with Redis).
    *   CDN: For static assets (Vercel default).

### 7.2. Scalability
*   **Stateless Application Server:** Next.js server should be mostly stateless to allow horizontal scaling. Session state managed by NextAuth.js (JWTs or database adapter).
*   **Database Scalability:** PostgreSQL can be scaled (read replicas, connection pooling). Choice of database hosting provider impacts scalability options.
*   **Asynchronous Operations:** Use message queues (e.g., RabbitMQ, SQS - conceptual) for long-running tasks like complex report generation or bulk email sending to avoid blocking API responses.
*   **Load Testing:** Conduct load testing to identify bottlenecks before production launch.

### 7.3. Security
*   **Authentication:** Secure password hashing (bcryptjs), robust session management (NextAuth.js). Multi-Factor Authentication (MFA) should be considered for admin users.
*   **Authorization:** Enforce RBAC rigorously for all sensitive operations using tRPC middleware and backend checks.
*   **Input Validation:** All API inputs validated using Zod. Sanitize user-generated content before rendering to prevent XSS (React mostly handles this, but be cautious with `dangerouslySetInnerHTML`).
*   **Data Protection:**
    *   HTTPS enforced for all communication.
    *   Encrypt sensitive data at rest (e.g., API keys for third-party services).
    *   Adhere to GDPR and other relevant data privacy regulations.
*   **Dependency Management:** Regularly update dependencies to patch security vulnerabilities (e.g., using `npm audit` or Snyk).
*   **CSRF Protection:** Next.js provides some built-in protection. NextAuth.js also includes CSRF tokens for its operations.
*   **Rate Limiting:** Implement rate limiting on APIs (especially auth and public mutations) to prevent abuse.
*   **Secure Headers:** Use security-related HTTP headers (CSP, HSTS, X-Frame-Options).

### 7.4. Accessibility (A11y)
*   Adhere to WCAG 2.1 AA guidelines.
*   Semantic HTML.
*   Keyboard navigability for all interactive elements.
*   Sufficient color contrast (especially with custom theme colors).
*   ARIA attributes where necessary.
*   Alternative text for images.
*   Focus management for interactive components like modals and dropdowns.
*   UI components from libraries like Shadcn/ui (Radix UI based) are generally designed with accessibility in mind.

### 7.5. Maintainability
*   **Code Quality:** Consistent coding style enforced by ESLint and Prettier. TypeScript for type safety.
*   **Modularity:** Well-defined components and tRPC routers with clear responsibilities.
*   **Documentation:** This TDS, inline code comments for complex logic, JSDoc for functions/components.
*   **Testing:** Unit tests for critical utility functions and tRPC procedures. Integration tests for key user flows. End-to-end tests (e.g., using Playwright or Cypress).
*   **Version Control:** Git for source code management with a clear branching strategy (e.g., GitFlow).

## 8. Deployment

### 8.1. Environment Variables
A `.env` file (or platform-specific environment variable configuration) is crucial. Key variables include:
*   `DATABASE_URL`: PostgreSQL connection string.
*   `NEXTAUTH_SECRET`: Secret key for NextAuth.js.
*   `NEXTAUTH_URL`: Canonical URL of the application.
*   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: For Google OAuth.
*   `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: For Stripe integration.
*   `NEXT_PUBLIC_SITE_URL`: Public URL of the site for SEO and links.
*   `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`, `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_FROM`: For transactional emails (if implementing).
*   API keys for any other third-party services (e.g., smart home platforms, currency exchange rate API).

### 8.2. Build Process
*   `npm run build` (or `yarn build`): Compiles the Next.js application, TypeScript code, and generates optimized static assets.
*   Prisma Client Generation: `npx prisma generate` is run automatically by Prisma CLI or as part of the build process to generate the typesafe database client.

### 8.3. Deployment Strategy
*   **Platform:** Vercel is a natural choice for T3 Stack applications, offering seamless integration with Next.js, serverless functions for API routes, and global CDN. Other options include Netlify, AWS Amplify, or self-hosting on Docker/Kubernetes.
*   **Continuous Integration/Continuous Deployment (CI/CD):**
    *   Set up CI/CD pipelines (e.g., GitHub Actions, Vercel Deployments) to automate testing, building, and deploying on pushes to main/production branches.
    *   Staging/Preview environments for testing before production release.
*   **Zero Downtime Deployments:** Platforms like Vercel typically handle this by building the new version and then switching traffic.

### 8.4. Database Migrations & Seeding
*   **Migrations:** `npx prisma migrate dev` for development, `npx prisma migrate deploy` for production. Migrations should be run as part of the deployment process or as a separate step before the application server starts with the new code.
*   **Seeding:** `npx prisma db seed` to populate initial data. This is typically done once after initial setup or in staging/development environments.

## 9. Development Setup & Guidelines

### 9.1. Prerequisites
*   Node.js (version specified in project, e.g., 18.x or later)
*   npm (version 8+) or yarn (version 1.22+)
*   PostgreSQL server (e.g., running locally via Docker or a managed service)
*   Git

### 9.2. Installation
1.  Clone the repository: `git clone <repository_url>`
2.  Navigate to the project directory: `cd the-scent`
3.  Install dependencies: `npm install` (or `yarn install`)
4.  Set up environment variables:
    *   Copy `.env.example` to `.env`: `cp .env.example .env`
    *   Fill in the required values in `.env` (database URL, auth secrets, API keys).
5.  Set up the database:
    *   Ensure PostgreSQL server is running and accessible.
    *   Run Prisma migrations: `npx prisma db push` (for initial setup) or `npx prisma migrate dev` (to create and apply migrations).
6.  Seed the database (optional, if a seed script exists): `npx prisma db seed`

### 9.3. Running the Application
*   Start the development server: `npm run dev` (or `yarn dev`)
*   The application will typically be available at `http://localhost:3000`.

### 9.4. Coding Standards & Conventions
*   **TypeScript:** Strictly typed. Use `unknown` instead of `any` where possible. Leverage utility types.
*   **ESLint & Prettier:** Configured for code linting and formatting. Adhere to the established rules. Run formatters/linters before committing.
*   **Naming Conventions:**
    *   Components: PascalCase (e.g., `ProductCard.tsx`)
    *   Functions/Variables: camelCase (e.g., `getUserOrders`)
    *   tRPC procedures: camelCase
    *   CSS classes (Tailwind): kebab-case (Tailwind's default)
*   **File Structure:** Follow the established directory structure (e.g., components in `src/components`, pages in `src/pages`, API routers in `src/server/api/routers`).
*   **Imports:** Use absolute imports configured via `tsconfig.json` (e.g., `~/components/ui/Button`).
*   **Comments:** Write JSDoc comments for tRPC procedures, complex functions, and public component props. Use inline comments for clarifying complex logic.
*   **Error Handling:** Gracefully handle errors in API procedures and frontend components. Provide user-friendly error messages. Use `TRPCError` for backend errors.
*   **Async/Await:** Use `async/await` for asynchronous operations.

### 9.5. Testing Strategy
*   **Unit Tests (Jest/Vitest):**
    *   Test utility functions.
    *   Test individual tRPC procedures (mocking Prisma client and context).
    *   Test complex React component logic (mocking hooks and child components).
*   **Integration Tests (React Testing Library, Vitest):**
    *   Test interactions between components.
    *   Test tRPC calls from frontend components (mocking API responses or using a test tRPC server).
*   **End-to-End Tests (Playwright/Cypress):**
    *   Test key user flows (e.g., registration, login, product browsing, add to cart, checkout, admin operations).
*   **Static Analysis:** TypeScript compiler, ESLint.
*   **Code Coverage:** Aim for a reasonable code coverage target (e.g., >70-80% for critical parts).

## 10. Future Enhancements
Beyond the currently designed features, "The Scent" platform can be extended with:
*   **Multi-Store Management:** Central admin for multiple storefronts with distinct branding/domains but shared backend infrastructure.
*   **Advanced Discount & Promotion Engine:** Complex rule-based discounts (BOGO, tiered discounts, coupon codes with usage limits).
*   **Content Management System (CMS) Integration:** For managing blog posts, informational pages, and marketing content (e.g., Strapi, Sanity).
*   **Email Marketing Automation:** Integration with platforms like Mailchimp or Klaviyo for targeted campaigns, abandoned cart recovery emails, etc.
*   **A/B Testing Framework:** For experimenting with UI changes, product recommendations, and marketing copy.
*   **Real-time Chat Support:** Integration with live chat solutions (e.g., Intercom, Crisp).
*   **Affiliate Program Management.**
*   **Wholesale/B2B Portal.**
*   **Mobile App (React Native / Native):** For a dedicated mobile experience.
*   **Enhanced AI/ML:**
    *   More sophisticated recommendation algorithms.
    *   AI-driven customer service chatbots.
    *   Dynamic pricing optimization.
    *   Predictive analytics for customer behavior.
*   **Headless Commerce Capabilities:** Decouple frontend from backend further to allow different frontends (mobile app, IoT devices) to consume the e-commerce backend.
*   **Community Features:** Forums, user-generated content around wellness and aromatherapy.

## 11. Glossary
*   **A11y:** Accessibility.
*   **API:** Application Programming Interface.
*   **AR:** Augmented Reality.
*   **AOV:** Average Order Value.
*   **CDN:** Content Delivery Network.
*   **CMS:** Content Management System.
*   **CRUD:** Create, Read, Update, Delete.
*   **CSRF:** Cross-Site Request Forgery.
*   **CTA:** Call To Action.
*   **CUID:** Collision-Resistant Unique Identifier.
*   **ERP:** Enterprise Resource Planning.
*   **GDPR:** General Data Protection Regulation.
*   **HOC:** Higher-Order Component.
*   **JSON-LD:** JavaScript Object Notation for Linked Data.
*   **JWT:** JSON Web Token.
*   **KPI:** Key Performance Indicator.
*   **LTV:** Lifetime Value (Customer).
*   **MFA:** Multi-Factor Authentication.
*   **OAuth:** Open Authorization.
*   **ORM:** Object-Relational Mapper.
*   **PCI DSS:** Payment Card Industry Data Security Standard.
*   **PWA:** Progressive Web Application.
*   **RBAC:** Role-Based Access Control.
*   **SDK:** Software Development Kit.
*   **SEO:** Search Engine Optimization.
*   **SKU:** Stock Keeping Unit.
*   **SSG:** Static Site Generation.
*   **SSR:** Server-Side Rendering.
*   **SSO:** Single Sign-On.
*   **T3 Stack:** Next.js, TypeScript, tRPC, Prisma, NextAuth.js, TailwindCSS.
*   **TDS:** Technical Design Specification.
*   **UI/UX:** User Interface / User Experience.
*   **WCAG:** Web Content Accessibility Guidelines.
*   **WebXR:** Web Extended Reality (for AR/VR in browsers).
*   **XSS:** Cross-Site Scripting.

---
https://drive.google.com/file/d/10qxhCB7k2c3G73SUaEIfKVKSqgWSjkQo/view?usp=sharing, https://drive.google.com/file/d/1M29mvmeDZQQ5X72Yfx2_0-vycXBG5pF8/view?usp=sharing, https://aistudio.google.com/app/prompts?state=%7B%22ids%22:%5B%221QNYodene0vrlxMvFDFKJ0CSSeS2lX2t2%22%5D,%22action%22:%22open%22,%22userId%22:%22103961307342447084491%22,%22resourceKeys%22:%7B%7D%7D&usp=sharing, https://drive.google.com/file/d/1qxPDWhlmzq9-R3H1YDAVwCyPjpwQ4ZJO/view?usp=sharing

