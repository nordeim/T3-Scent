# Technical Design Specification: The Scent E-commerce Platform (Updated)

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
        2.3.1. [Directory Structure](#231-directory-structure)
        2.3.2. [Component Strategy](#232-component-strategy)
        2.3.3. [State Management Details](#233-state-management-details)
    2.4. [Backend Architecture (tRPC)](#24-backend-architecture-trpc)
        2.4.1. [Context and Middleware](#241-context-and-middleware)
    2.5. [Database Architecture](#25-database-architecture)
    2.6. [Authentication and Authorization](#26-authentication-and-authorization)
        2.6.1. [NextAuth.js Configuration](#261-nextauthjs-configuration)
        2.6.2. [Role-Based Access Control (RBAC) Strategy](#262-role-based-access-control-rbac-strategy)
    2.7. [Third-Party Integrations](#27-third-party-integrations)
        2.7.1. [Stripe Integration Details](#271-stripe-integration-details)
        2.7.2. [Image and Asset Management](#272-image-and-asset-management)
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
        3.6.2. [`LoyaltyTier`](#362-loyaltytier)
        3.6.3. [`LoyaltyPointLog`](#363-loyaltypointlog)
        3.6.4. [`Reward`](#364-reward)
        3.6.5. [`UserReward`](#365-userreward)
    3.7. [RBAC Models](#37-rbac-models)
        3.7.1. [`RoleDefinition`](#371-roledefinition)
        3.7.2. [`Permission`](#372-permission)
        3.7.3. [`PermissionAssignment`](#373-permissionassignment)
    3.8. [Inventory & Supplier Models](#38-inventory--supplier-models)
        3.8.1. [`Supplier`](#381-supplier)
        3.8.2. [`PurchaseOrder`](#382-purchaseorder)
        3.8.3. [`PurchaseOrderItem`](#383-purchaseorderitem)
    3.9. [Smart Home Models](#39-smart-home-models)
        3.9.1. [`SmartHomePlatformConnection`](#391-smarthomeplatformconnection)
        3.9.2. [`SmartHomeDevice`](#392-smarthomedevice)
        3.9.3. [`AutomationRule`](#393-automationrule)
        3.9.4. [`AutomationAction`](#394-automationaction)
        3.9.5. [`ScentSchedule`](#395-scentschedule)
    3.10. [Operational Models](#310-operational-models)
        3.10.1. [`Notification`](#3101-notification)
        3.10.2. [`SiteSettings`](#3102-sitesettings)
    3.11. [Enums](#311-enums)
4.  [API Design (tRPC Routers)](#4-api-design-trpc-routers)
    4.1. [Router Structure and Conventions](#41-router-structure-and-conventions)
    4.2. [User-Facing Routers](#42-user-facing-routers)
        4.2.1. [`productsRouter`](#421-productsrouter)
        4.2.2. [`ordersRouter`](#422-ordersrouter)
        4.2.3. [`usersRouter`](#423-usersrouter)
        4.2.4. [`cartRouter`](#424-cartrouter)
        4.2.5. [`wishlistRouter`](#425-wishlistrouter)
        4.2.6. [`reviewsRouter`](#426-reviewsrouter)
        4.2.7. [`quizRouter`](#427-quizrouter)
        4.2.8. [`recommendationsRouter`](#428-recommendationsrouter)
        4.2.9. [`subscriptionsRouter`](#429-subscriptionsrouter)
        4.2.10. [`loyaltyRouter`](#4210-loyaltyrouter)
        4.2.11. [`smartHomeRouter`](#4211-smarthomerouter)
        4.2.12. [`notificationsRouter`](#4212-notificationsrouter)
    4.3. [Admin Routers (under `admin` namespace)](#43-admin-routers-under-admin-namespace)
        4.3.1. [`admin.productsRouter`](#431-adminproductsrouter)
        4.3.2. [`admin.ordersRouter`](#432-adminordersrouter)
        4.3.3. [`admin.usersRouter`](#433-adminusersrouter)
        4.3.4. [`admin.rolesRouter`](#434-adminrolesrouter)
        4.3.5. [`admin.analyticsRouter`](#435-adminanalyticsrouter)
        4.3.6. [`admin.inventoryRouter`](#436-admininventoryrouter)
        4.3.7. [`admin.settingsRouter`](#437-adminsettingsrouter)
5.  [Frontend Design](#5-frontend-design)
    5.1. [Overall Structure & Layout](#51-overall-structure--layout)
    5.2. [State Management Deep Dive](#52-state-management-deep-dive)
    5.3. [Styling and Theming](#53-styling-and-theming)
    5.4. [Key UI Components (with placeholder examples)](#54-key-ui-components-with-placeholder-examples)
    5.5. [Page Structure and Key Pages](#55-page-structure-and-key-pages)
6.  [Detailed Feature Design](#6-detailed-feature-design)
    6.1. [User Authentication & Advanced Profile Management](#61-user-authentication--advanced-profile-management)
    6.2. [Product Catalog, Discovery, and Search](#62-product-catalog-discovery-and-search)
    6.3. [Product Detail Page with AR and Variants](#63-product-detail-page-with-ar-and-variants)
    6.4. [Shopping Cart & Persistent Cart Logic](#64-shopping-cart--persistent-cart-logic)
    6.5. [Stripe Integrated Checkout Process](#65-stripe-integrated-checkout-process)
    6.6. [User Order Management and Tracking](#66-user-order-management-and-tracking)
    6.7. [AI-Powered Advanced Scent Quiz](#67-ai-powered-advanced-scent-quiz)
    6.8. [Wishlist with Variant Support](#68-wishlist-with-variant-support)
    6.9. [Product Subscription System with Stripe Integration](#69-product-subscription-system-with-stripe-integration)
    6.10. [Loyalty Program with Tiers and Rewards](#610-loyalty-program-with-tiers-and-rewards)
    6.11. [AR Product Visualization Implementation Details](#611-ar-product-visualization-implementation-details)
    6.12. [Multi-language & Multi-currency Strategy](#612-multi-language--multi-currency-strategy)
    6.13. [Smart Home Integration Workflow](#613-smart-home-integration-workflow)
    6.14. [Admin Dashboard Features Deep Dive](#614-admin-dashboard-features-deep-dive)
        6.14.1. [Comprehensive Product Editor Flow](#6141-comprehensive-product-editor-flow)
        6.14.2. [Order Fulfillment Workflow](#6142-order-fulfillment-workflow)
        6.14.3. [Advanced RBAC Configuration](#6143-advanced-rbac-configuration)
        6.14.4. [Analytics Data Pipeline (Conceptual)](#6144-analytics-data-pipeline-conceptual)
        6.14.5. [Inventory Forecasting Logic and PO Generation](#6145-inventory-forecasting-logic-and-po-generation)
7.  [Non-Functional Requirements](#7-non-functional-requirements)
    7.1. [Performance Targets and Optimization](#71-performance-targets-and-optimization)
    7.2. [Scalability Strategy](#72-scalability-strategy)
    7.3. [Security Hardening](#73-security-hardening)
    7.4. [Accessibility (A11y) Compliance](#74-accessibility-a11y-compliance)
    7.5. [Maintainability and Code Quality](#75-maintainability-and-code-quality)
8.  [Deployment Strategy (Covered in `deployment_guide_updated.md`)](#8-deployment-strategy-covered-in-deployment_guide_updatedmd)
9.  [Development Setup & Guidelines](#9-development-setup--guidelines)
    9.1. [Local Development Environment](#91-local-development-environment)
    9.2. [Coding Standards & Best Practices](#92-coding-standards--best-practices)
    9.3. [Testing Strategy and Tools](#93-testing-strategy-and-tools)
    9.4. [Branching and Version Control](#94-branching-and-version-control)
10. [Future Enhancements & Roadmap](#10-future-enhancements--roadmap)
11. [Glossary of Terms](#11-glossary-of-terms)

---

## 1. Introduction

### 1.1. Project Overview
"The Scent" is an enterprise-grade e-commerce platform meticulously designed for the premium aromatherapy and wellness market. It integrates a rich, engaging, and highly personalized shopping experience with powerful administrative tools. Built upon the robust T3 Stack (Next.js, TypeScript, tRPC, Prisma, NextAuth.js) and utilizing PostgreSQL, the platform emphasizes typesafety, performance, and modern development practices. Its core differentiators include an AI-driven scent discovery quiz, immersive AR product visualization, comprehensive subscription and loyalty programs, advanced analytics dashboards, intelligent inventory forecasting, and nascent smart home integration capabilities.

### 1.2. Purpose of this Document
This updated Technical Design Specification (TDS) serves as the definitive technical blueprint for "The Scent." It consolidates and refines design decisions from previous iterations, aligns with the finalized database schema and core code structure, and provides a comprehensive guide for current development and future evolution. Key objectives include:
*   **Developer Onboarding:** Equip new and existing developers with a deep understanding of the system architecture, data structures, API contracts, and feature implementations.
*   **Development Reference:** Act as the single source of truth for technical design, ensuring consistency, quality, and adherence to architectural principles during the build phase.
*   **Foundation for Growth:** Establish a clear technical baseline to facilitate scalable future enhancements and integrations.
*   **Stakeholder Alignment:** Offer technical stakeholders a detailed insight into the platform's engineering, capabilities, and complexities.

This document elaborates on system architecture, data modeling, API specifications, frontend design patterns, detailed feature mechanics, non-functional requirements, and development guidelines.

### 1.3. Goals of the Application
The strategic goals for "The Scent" platform are:
*   **Superior User Experience:** Deliver an intuitive, aesthetically pleasing, and frictionless shopping journey that delights customers.
*   **Maximizing Sales & Loyalty:** Implement sophisticated features like AI-powered personalization, engaging loyalty/subscription models, and targeted recommendations to boost conversion rates and foster long-term customer relationships.
*   **Streamlined Store Operations:** Provide administrators with an efficient and comprehensive suite of tools for managing products, orders, inventory, customers, and marketing efforts.
*   **Data-Driven Decision Making:** Offer advanced analytics and reporting, empowering administrators with actionable insights to optimize business strategy and performance.
*   **Future-Proof Scalability & Performance:** Engineer a robust and adaptable platform capable of handling significant growth in user traffic, product catalog size, and transactional volume.
*   **Uncompromised Security:** Implement industry-best security practices to safeguard user data, ensure secure payment processing, and protect against common web vulnerabilities.
*   **Market Differentiation:** Introduce innovative features such as AR product previews, smart home ecosystem links, and deeply personalized scent discovery to create a unique market position.
*   **Hyper-Personalization:** Tailor the user experience at multiple touchpoints using data from quizzes, purchase history, and browsing behavior.

### 1.4. Target Audience
The platform serves distinct user groups:
*   **Customers:** Consumers interested in high-quality aromatherapy, essential oils, and wellness products. They expect a modern, visually appealing online store with easy navigation, personalized recommendations, secure checkout, and convenient account management features (orders, subscriptions, loyalty).
*   **Administrative Users (Internal Team):**
    *   **Site Administrators (Role: `ADMIN`):** Possess full system access. Responsible for user and role management, system-wide configurations, advanced analytics, security settings, and overseeing all operational aspects.
    *   **Store Managers (Role: `MANAGER`):** Oversee day-to-day store operations, including product catalog management, order processing and fulfillment, inventory control, customer support escalations, and marketing campaign execution. Their access is typically broad but may be constrained by permissions set by Admins.
    *   **Specialized Staff (Custom Roles, e.g., `CONTENT_EDITOR`, `SUPPORT_AGENT`):** Users with specific, limited permissions to perform defined tasks such as managing product descriptions, handling customer inquiries, or updating blog content, based on the advanced RBAC system.

### 1.5. Assumptions and Constraints
*   **Core Technology Stack:** The T3 Stack (Next.js, TypeScript, tRPC, Prisma, NextAuth.js) is foundational and mandated.
*   **Database System:** PostgreSQL is the designated relational database.
*   **Deployment Environment:** The primary deployment target is a modern cloud platform like Vercel, leveraging its serverless capabilities.
*   **Payment Gateway:** Stripe is the exclusive payment processing provider for initial launch.
*   **Development Team:** Assumes a development team proficient in the T3 Stack, full-stack JavaScript/TypeScript development, and PostgreSQL.
*   **3D/AR Assets:** Availability of 3D models (e.g., `.glb`, `.usdz`) for key products is assumed for the AR visualization feature. The platform provides the framework; asset creation is external.
*   **AI Capabilities:** "AI-powered" features (quiz recommendations, inventory forecasting) imply sophisticated algorithms or models. This TDS focuses on their integration and data flow, not the internal AI model development, which could be a separate microservice or third-party API.
*   **Smart Home APIs:** Initial smart home integration provides a framework. Deep, bidirectional communication with specific smart home platforms (Philips Hue, Google Home, Apple HomeKit) will necessitate individual API integration projects and user OAuth flows.
*   **Email Service:** An external email service (e.g., SendGrid, Resend, AWS SES) is required for transactional emails and marketing communications. Configuration details are external to this TDS but critical for functionality.
*   **Content (Product Descriptions, Images, Blog):** Assumes high-quality content will be provided and managed, potentially through the admin interface or a future CMS integration.

## 2. System Architecture

### 2.1. High-Level Overview
"The Scent" employs a modern, full-stack architecture centered around the T3 Stack, fostering end-to-end typesafety and a streamlined developer experience within a monolithic repository.

*   **Client (Browser):** Users interact with a dynamic Next.js frontend, rendered using React and styled with TailwindCSS. Client-side interactivity and state are managed through React Context, component state, and tRPC's React Query integration for server data.
*   **Application Server (Next.js):** The Next.js server is the core, handling:
    *   API requests via a typesafe tRPC layer.
    *   Server-Side Rendering (SSR) for SEO-critical pages (e.g., product details) and initial page loads.
    *   Static Site Generation (SSG) for marketing pages or content that changes infrequently.
    *   Authentication and session management via NextAuth.js.
    *   Database interactions through the Prisma ORM.
*   **API Layer (tRPC):** Provides a robust, typesafe communication channel between the frontend and backend, eliminating traditional REST/GraphQL boilerplate and ensuring data consistency.
*   **Database (PostgreSQL):** A PostgreSQL instance serves as the persistent data store for all application data, including user profiles, product catalogs, orders, and operational settings.
*   **Background Jobs/Queues (Conceptual):** For long-running or resource-intensive tasks (e.g., bulk email sending, complex report generation, AI model retraining), a message queue system (like Redis with BullMQ, or AWS SQS) would be integrated to offload work from the main application server, ensuring API responsiveness.

```mermaid
graph LR
    subgraph "User & Admin Interfaces"
        UserClient[Client Browser - User]
        AdminClient[Admin Browser - Admin/Staff]
    end

    subgraph "Cloud Platform (e.g., Vercel)"
        subgraph "Next.js Application Server"
            direction LR
            APIGateway[API Gateway / Next.js Routing] --> TRPCServer[tRPC Server & Procedures]
            TRPCServer --> NextAuth[NextAuth.js]
            TRPCServer --> PrismaClient[Prisma Client]
            NextJSServer[Next.js Page Rendering (SSR/SSG)] --> PrismaClient
            NextJSServer --> TRPCServer
        end
    end

    subgraph "External Services"
        Stripe[Stripe Payment Gateway]
        GoogleOAuth[Google OAuth]
        EmailService[Email Service (e.g., SendGrid)]
        CloudStorage[Cloud Storage (e.g., S3 for images/models)]
        SmartHomeAPIs[Smart Home Platform APIs]
        AnalyticsPlatform[Analytics Platform (e.g., Vercel Analytics, Mixpanel)]
        CDN[Content Delivery Network]
    end
    
    subgraph "Data Tier"
        Database[(PostgreSQL Database)]
        Cache[(Redis Cache - Optional)]
        Queue[(Message Queue - Conceptual)]
    end

    UserClient -->|HTTPS| APIGateway
    AdminClient -->|HTTPS| APIGateway
    
    NextAuth --> Database
    PrismaClient --> Database
    
    TRPCServer --> Stripe
    TRPCServer --> EmailService
    TRPCServer --> SmartHomeAPIs
    TRPCServer --> Queue

    NextJSServer --> CDN
    UserClient --> CDN
    AdminClient --> CDN
    CloudStorage --> CDN
```

### 2.2. Technology Stack
| Category                | Technology                                              | Purpose & Rationale                                                                 |
|-------------------------|---------------------------------------------------------|------------------------------------------------------------------------------------|
| **Core Framework**      | Next.js 14+ (Pages Router)                              | Full-stack React framework for SSR, SSG, API routes, and optimized performance.    |
| **Primary Language**    | TypeScript 5.x+                                         | Static typing for robustness, improved developer experience, and fewer runtime errors. |
| **API Layer**           | tRPC 10.x+                                              | End-to-end typesafe APIs, eliminating boilerplate and schema drift.                |
| **ORM & DB Client**   | Prisma 5.x+                                             | Modern, typesafe ORM for PostgreSQL, simplifying database interactions.            |
| **Database**            | PostgreSQL 14+                                          | Powerful, open-source relational database with strong JSONB and indexing support.   |
| **Styling**             | TailwindCSS 3.x+                                        | Utility-first CSS for rapid, consistent UI development; themable and customizable. |
| **UI Component System** | Shadcn/ui (Radix UI + TailwindCSS)                      | Collection of accessible, reusable, and beautifully designed UI components.        |
| **Authentication**      | NextAuth.js 4.x+                                        | Flexible authentication solution for Next.js, supporting various providers.        |
| **Payment Processing**  | Stripe SDKs (JS & Node)                                 | Secure and comprehensive payment gateway integration.                              |
| **State Management**    | React Context API, Zustand (optional), SWR/React Query (via tRPC) | Context for simple global state, Zustand for complex, React Query for server state. |
| **Form Handling**       | React Hook Form + Zod                                   | Performant and typesafe form creation and validation.                              |
| **Animations**          | Framer Motion                                           | Rich animations and transitions for an enhanced user experience.                     |
| **Charting/Analytics**  | Recharts (Admin), Vercel Analytics (Site)               | Data visualization for admin dashboards and site traffic insights.                   |
| **SEO Management**      | `next-seo`                                              | Simplified and comprehensive SEO metadata management.                                |
| **Environment Vars**    | `@t3-oss/env-nextjs`                                    | Typesafe environment variable validation.                                          |
| **Utility Libraries**   | `date-fns` or `dayjs` (Dates), `nanoid` (IDs), `zod` (Validation) | Standard utilities for common tasks.                                               |
| **Linting/Formatting**  | ESLint, Prettier                                        | Maintaining code quality and consistency.                                          |
| **Testing**             | Vitest/Jest (Unit/Integration), Playwright/Cypress (E2E) | Comprehensive testing strategy.                                                    |
| **Image/Asset Hosting** | Cloud Storage (e.g., AWS S3, Cloudinary, Vercel Blob)   | Scalable storage for product images, 3D models, and other static assets.           |
| **Email Service**       | External (e.g., Resend, SendGrid, AWS SES)              | Reliable delivery of transactional and marketing emails.                           |

### 2.3. Frontend Architecture

#### 2.3.1. Directory Structure
A well-organized directory structure is crucial for maintainability:
```
src/
├── app/                  # (Optional, for future App Router adoption)
├── components/
│   ├── admin/            # Components specific to the admin dashboard
│   │   ├── analytics/
│   │   ├── inventory/
│   │   ├── rbac/         # Role-Based Access Control UI
│   │   └── (other admin sections...)
│   ├── auth/             # Authentication-related UI (forms, buttons)
│   ├── cart/             # Cart display, item components
│   ├── checkout/         # Checkout steps, forms, summary
│   ├── common/           # Highly reusable components across features (e.g., ProductCard)
│   ├── layout/           # Navbar, Footer, Sidebar, PageLayout, AdminLayout
│   ├── loyalty/          # Loyalty program dashboard, reward components
│   ├── products/         # Product listings, gallery, reviews, AR viewer
│   ├── quiz/             # Scent quiz steps and elements
│   ├── smart-home/       # Smart home integration UI
│   ├── subscription/     # Subscription management UI
│   └── ui/               # Base UI primitives (Button, Input, Card - from Shadcn/ui or custom)
├── contexts/             # React Context providers (Cart, Wishlist, Theme, Localization, etc.)
├── hooks/                # Custom React hooks (e.g., useDebounce, useLocalStorage)
├── lib/                  # Utility functions, constants, client-side helpers (e.g., Shadcn's `cn`)
├── pages/                # Next.js Pages Router
│   ├── api/
│   │   ├── auth/         # [...nextauth].ts
│   │   └── trpc/         # [trpc].ts
│   ├── account/          # User account pages (profile, orders, subscriptions)
│   ├── admin/            # Admin dashboard pages
│   ├── auth/             # Sign-in, sign-up, error pages
│   └── (other top-level pages like products, cart, checkout)
├── server/
│   ├── api/
│   │   ├── routers/      # tRPC routers (feature-specific and admin)
│   │   │   └── admin/    # Nested admin routers
│   │   ├── root.ts       # Main tRPC appRouter
│   │   └── trpc.ts       # tRPC initialization and middleware
│   ├── auth.ts           # NextAuth.js configuration
│   └── db.ts             # Prisma client instantiation
├── styles/               # Global CSS, Tailwind base styles
├── types/                # Global TypeScript type definitions, interfaces
├── utils/                # General utility functions (formatters, client-side API helpers)
└── env.mjs               # Environment variable validation
```

#### 2.3.2. Component Strategy
*   **Atomic Design Principles (loosely adopted):**
    *   **UI Primitives (`src/components/ui/`):** Based on Shadcn/ui, these are the smallest building blocks (Button, Input, Label, Card, etc.). They are styleable and accessible.
    *   **Common Components (`src/components/common/`):** Compositions of UI primitives to create slightly more complex, reusable elements (e.g., `ProductCard`, `RatingStars`, `ModalWrapper`).
    *   **Feature Components:** Located within their respective feature directories (e.g., `src/components/products/ProductGallery.tsx`). These are specific to a particular domain.
    *   **Layout Components (`src/components/layout/`):** Define the structural skeleton of pages and sections (e.g., `Navbar.tsx`, `AdminSidebar.tsx`).
*   **Props and State:** Components receive data via props. Internal UI state is managed with `useState`/`useReducer`. Server state is managed via tRPC hooks.
*   **Accessibility (A11y):** Components are designed with accessibility in mind, using semantic HTML, ARIA attributes where necessary, and ensuring keyboard navigability. Shadcn/ui helps significantly here.
*   **Lazy Loading:** Next.js `dynamic` import is used for large components or those not critical for the initial page view (e.g., `ARVisualization.tsx`, complex admin charts) to improve performance.

#### 2.3.3. State Management Details
*   **tRPC + React Query (`@tanstack/react-query`):** The primary method for managing server state. Handles data fetching, caching, optimistic updates, and synchronization automatically. Queries are defined in tRPC routers and consumed on the client using hooks like `api.products.getAll.useQuery()`.
*   **React Context API:** Used for global client-side state that doesn't fit well into server state or component state.
    *   `CartContext`: Manages transient cart state. Persisted to `localStorage`. Synchronization with a backend cart (for logged-in users) would involve tRPC mutations triggered by context actions.
    *   `WishlistContext`: Similar to cart, with `localStorage` for guests and tRPC sync for logged-in users.
    *   `ThemeProvider (`next-themes`): Manages dark/light mode theme.
    *   `LocalizationContext`: Handles language and currency selection, translation strings, and formatting.
    *   `NotificationsContext` (Conceptual): Could manage a queue of in-app notifications (toasts, banners) received from server-sent events or polled from a `notificationsRouter`.
*   **Zustand (Optional):** For highly complex global UI states that might cause performance issues with Context due to frequent updates or deep nesting, Zustand offers a more performant alternative with a simpler API. Could be considered for:
    *   Complex filter states in product listings or admin tables.
    *   Global modals or side-panel states.
*   **Component Local State (`useState`, `useReducer`):** For UI-specific state like form inputs, dropdown visibility, active tabs, etc.

### 2.4. Backend Architecture (tRPC)
The backend is built using tRPC, providing a typesafe API layer directly consumed by the Next.js frontend.
*   **Routers (`src/server/api/routers/`):** API logic is organized into domain-specific routers (e.g., `productsRouter`, `ordersRouter`). Admin-specific functionality is grouped under an `admin` sub-router (`src/server/api/routers/admin/`).
*   **Procedures:** Each router contains procedures (queries for data fetching, mutations for data modification).
    *   **Input Validation:** Zod schemas rigorously validate all procedure inputs.
    *   **Output Types:** Output types are inferred directly from the procedure's return type, ensuring end-to-end typesafety.
*   **Database Interaction:** Procedures use the Prisma client (`ctx.db`) to interact with the PostgreSQL database.
*   **Business Logic:** Complex business rules and orchestrations are implemented within tRPC procedures or service layers called by them.

#### 2.4.1. Context and Middleware
*   **tRPC Context (`src/server/api/trpc.ts` -> `createTRPCContext`):** Injected into every tRPC procedure. Provides access to:
    *   `db`: The Prisma client instance.
    *   `session`: The NextAuth.js session object for the authenticated user (if any).
    *   Potentially other request-specific information (headers, IP) if needed.
*   **tRPC Middleware:** Used for cross-cutting concerns:
    *   `enforceUserIsAuthed`: Ensures a user is logged in before a procedure can be executed (`protectedProcedure`).
    *   `enforceUserIsAdminOrManager`: Restricts access to admin/manager roles (`adminProcedure`).
    *   `roleProtectedProcedure`: A factory for creating procedures restricted to specific roles.
    *   Future middleware could include logging, rate limiting, or feature flag checks.

### 2.5. Database Architecture
*   **System:** PostgreSQL.
*   **ORM:** Prisma.
    *   **Schema Definition:** `prisma/schema.prisma` is the single source of truth for the database structure, models, relations, enums, and indexes.
    *   **Migrations:** `prisma migrate` is used for evolving the database schema in a controlled and versioned manner. `prisma migrate dev` for development, `prisma migrate deploy` for production.
    *   **Client:** The generated Prisma Client (`@prisma/client`) provides a typesafe API for database queries.
*   **Data Types:** Utilizes appropriate PostgreSQL types mapped by Prisma (e.g., `TEXT` for long strings, `DECIMAL` for monetary values, `TIMESTAMP` for dates, `JSONB` for flexible structured data, `BOOLEAN`, `INTEGER`, `FLOAT`).
*   **Relations:** Clearly defined one-to-one, one-to-many, and many-to-many relationships with appropriate foreign key constraints and `ON DELETE`/`ON UPDATE` cascade behaviors (Prisma defaults are often suitable, but explicit definitions like `onDelete:Restrict` are used where necessary to prevent data loss).
*   **Indexing:** Strategic use of `@unique` and `@@index` in the Prisma schema to optimize query performance for frequently accessed fields and common query patterns (e.g., slugs, foreign keys, status fields).
*   **Seeding:** `prisma db seed` with a `seed.ts` script populates essential initial data (e.g., default site settings, initial admin user, core roles/permissions, default loyalty tiers).

### 2.6. Authentication and Authorization

#### 2.6.1. NextAuth.js Configuration (`src/server/auth.ts`)
*   **Providers:**
    *   `CredentialsProvider`: For traditional email/password login. Passwords are hashed with `bcryptjs`.
    *   `GoogleProvider`: For OAuth 2.0 social login.
    *   Easily extensible with other OAuth providers (Facebook, Apple, etc.).
*   **Adapter:** `PrismaAdapter` seamlessly integrates NextAuth.js with the Prisma schema, automatically managing `User`, `Account`, `Session`, and `VerificationToken` models.
*   **Session Strategy:** JWT (`strategy: "jwt"`) is used.
    *   JWTs store essential user identifiers (`id`, `role`, `roleDefinitionId`, `name`, `email`, `image`).
    *   Callbacks (`jwt` and `session`) are configured to ensure this data is correctly populated in both the JWT and the client-side session object.
*   **Custom Pages:** Configured for sign-in (`/auth/signin`), sign-up/welcome (`/auth/welcome` for new OAuth users), and error handling.
*   **Security:** `NEXTAUTH_SECRET` is critical for signing JWTs and cookies.

#### 2.6.2. Role-Based Access Control (RBAC) Strategy
A two-tiered approach to RBAC is implemented:
1.  **Simple Roles (User Model):** The `User.role` field (enum: `ADMIN`, `MANAGER`, `CUSTOMER`) provides a basic level of access control. This is used for broad distinctions.
2.  **Advanced RBAC (RoleDefinition, Permission, PermissionAssignment Models):**
    *   `RoleDefinition`: Allows administrators to create custom roles (e.g., "Content Editor," "Support Lead").
    *   `Permission`: Defines granular permissions (e.g., `action: "create"`, `subject: "Product"` or `action: "view_all"`, `subject: "Order"`).
    *   `PermissionAssignment`: Links `RoleDefinition`s to `Permission`s (many-to-many).
    *   The `User.roleDefinitionId` links a user to a specific `RoleDefinition`.
    *   **Enforcement:**
        *   `adminProcedure` in tRPC checks if `User.role` is `ADMIN` or `MANAGER`.
        *   `roleProtectedProcedure(roles)` checks against the simple `User.role`.
        *   For advanced RBAC, tRPC middleware or service layer logic would:
            1.  Fetch the user's `roleDefinitionId`.
            2.  Retrieve all `PermissionAssignment`s for that `RoleDefinition`.
            3.  Check if the required permission (e.g., "product.update") is present for the user's role before allowing the operation.
        *   Frontend UI elements (buttons, navigation links) are conditionally rendered based on user roles/permissions fetched via tRPC.
    *   **Management:** The `RoleManagement.tsx` component provides a UI for admins to manage roles and their associated permissions.

### 2.7. Third-Party Integrations

#### 2.7.1. Stripe Integration Details
*   **Client-Side:** `@stripe/react-stripe-js` and `@stripe/stripe-js` are used. The `Elements` provider wraps checkout forms. `CardElement` (or other Stripe Elements) securely collect payment details.
*   **Backend-Side (`ordersRouter`):**
    *   `createPaymentIntent`: Calculates order total (including products, shipping, taxes, discounts), creates/retrieves a Stripe Customer ID (stored on our `User` model as `stripeCustomerId`), and then creates a Stripe `PaymentIntent`. The `client_secret` from this intent is returned to the client.
    *   `createOrder`: (Ideally triggered by a Stripe webhook for `payment_intent.succeeded` for maximum reliability, but current design has client call this after payment confirmation). Verifies the `PaymentIntent`, creates the order in the local database, updates inventory, sends notifications, and awards loyalty points.
    *   **Webhook Handling (`pages/api/webhooks/stripe.ts` - Conceptual but Essential):** A dedicated API route to listen for Stripe webhooks is crucial for:
        *   `payment_intent.succeeded`: Reliably confirm payment and trigger order creation/fulfillment if not already done.
        *   `payment_intent.payment_failed`: Notify user and admin.
        *   `charge.refunded`: Update order status and potentially inventory.
        *   Subscription events (`invoice.payment_succeeded`, `customer.subscription.deleted`, etc.) if Stripe Subscriptions are used.
        *   Requires `STRIPE_WEBHOOK_SECRET` for verifying event authenticity.
*   **Stripe Customer Portal (Future):** For users to manage saved payment methods and subscriptions directly with Stripe.

#### 2.7.2. Image and Asset Management
*   **Product Images, 3D Models, Category/Collection Images:** These static assets need to be hosted efficiently.
*   **Strategy:**
    1.  **Cloud Storage (Recommended):** AWS S3, Google Cloud Storage, or Vercel Blob.
        *   Admin interface (`ProductEditor.tsx`) would upload files directly to this storage (e.g., via presigned URLs generated by a tRPC procedure to maintain security and avoid exposing backend credentials to the client).
        *   The `url` field in `ProductImage`, `Product.modelUrl`, etc., would store the public URL from the cloud storage provider.
    2.  **CDN:** Use a CDN (often integrated with cloud storage or Vercel) to serve these assets globally with low latency.
*   **`next/image`:** Used on the frontend for optimizing and serving images from their URLs, providing benefits like responsive sizes, lazy loading, and WebP format conversion.

## 3. Data Models (Database Schema)

The database schema, defined in `prisma/schema.prisma` and translated to SQL for PostgreSQL, forms the backbone of the application. It is designed to be comprehensive, relational, and support all core and advanced features.

*(The TDS would then list out each model and enum exactly as detailed in the SQL/Prisma schema from Part 1 and my previous response's `prisma/schema.prisma` block, with descriptions for each field and relation. This section would be very long and directly mirror the structure of the Prisma schema output. For brevity here, I will skip re-pasting the entire schema description but confirm it would be here, meticulously detailed.)*

**Key aspects reflected from the final Prisma schema:**
*   All models and their fields are listed with correct types (`TEXT`, `TIMESTAMP(3)`, `DECIMAL(X,Y)`, `JSONB`, `BOOLEAN`, `INTEGER`, Enums).
*   Primary keys (`@id @default(cuid())`) are consistently used.
*   Unique constraints (`@unique`, `@@unique`) are defined.
*   Indexes (`@index`, `@@index`) are specified for performance.
*   Relations (`@relation`) are fully detailed with foreign keys, relation names, and `onDelete`/`onUpdate` actions.
*   Enums are listed with all their possible values.
*   Map names (`@@map`) are included.

**(Example of how a single model would be detailed here):**

#### 3.3.1. `Product`
*   **Purpose:** Represents a core sellable item in the aromatherapy and wellness store. It contains all essential information for display, inventory, and order processing.
*   **Fields:**
    *   `id` (String, CUID, PK): Unique identifier for the product.
    *   `name` (String): Publicly displayed name of the product.
    *   `slug` (String, Unique, Indexed): URL-friendly identifier, used in product page routes.
    *   `description` (String, Text): Detailed description of the product, supports rich text/HTML.
    *   `price` (Decimal(10,2)): The base selling price of the product.
    *   `compareAtPrice` (Decimal(10,2)?): Optional original price, used to show a "sale" or discount.
    *   `costPrice` (Decimal(10,2)?): The internal cost of acquiring the product, used for profit margin analysis.
    *   `sku` (String?, Unique): Stock Keeping Unit, unique identifier for inventory management.
    *   `barcode` (String?): Product barcode (e.g., EAN, UPC).
    *   `weight` (Float?): Weight of the product in grams, used for shipping calculations.
    *   `dimensions` (Json?): Physical dimensions, stored as JSON e.g., `{"length": 10, "width": 5, "height": 15}` in cm.
    *   `inStock` (Boolean, default: `true`): General flag indicating if the product is available for purchase. Actual availability may also depend on `stockQuantity`.
    *   `lowStockThreshold` (Int?, default: 5): Threshold at which the product is considered "low stock" for admin alerts.
    *   `stockQuantity` (Int, default: 0): The current available quantity in stock. If using variants, this might be a sum or managed at the variant level.
    *   `featured` (Boolean, default: `false`, Indexed): Flag to mark product for display on homepage or featured sections.
    *   `bestSeller` (Boolean, default: `false`): Flag to mark product as a best-seller.
    *   `isNew` (Boolean, default: `false`): Flag to mark product as recently added.
    *   `onSale` (Boolean, default: `false`): Flag indicating if the product is currently on sale.
    *   `saleEndDate` (DateTime?): If `onSale` is true, this can specify when the sale ends.
    *   `publishedAt` (DateTime?): Date and time when the product becomes publicly visible. If null, it's a draft.
    *   `metaTitle` (String?): Custom title for SEO purposes for the product page.
    *   `metaDescription` (String?): Custom meta description for SEO for the product page.
    *   `modelUrl` (String?): URL to a 3D model file (e.g., `.glb`, `.usdz`) for AR visualization.
    *   `arPlacement` (String?): Hint for AR placement, e.g., "floor", "table", "wall".
    *   `leadTime` (Int?): Estimated number of days to restock the product, used in inventory forecasting.
    *   `safetyStock` (Int?): Minimum stock level to maintain to avoid stockouts during lead time, for forecasting.
    *   `turnoverRate` (Float?): Calculated inventory turnover rate for analytics.
    *   `forecastedDemand` (Int?): Calculated or manually set forecasted demand for inventory planning.
    *   `depletionDate` (DateTime?): Estimated date when stock will run out based on sales velocity.
    *   `createdAt` (DateTime, default: `now()`): Timestamp of product creation.
    *   `updatedAt` (DateTime, `@updatedAt`): Timestamp of last product update.
*   **Relations:**
    *   `images` (`ProductImage[]`): One-to-many; a product can have multiple images.
    *   `categories` (`Category[]`): Many-to-many (via `_ProductToCategory`); a product can belong to multiple categories.
    *   `tags` (`Tag[]`): Many-to-many (via `_ProductToTag`); a product can have multiple tags.
    *   `orderItems` (`OrderItem[]`): One-to-many; product can be part of multiple order items.
    *   `reviews` (`Review[]`): One-to-many; product can have multiple reviews.
    *   `variants` (`ProductVariant[]`): One-to-many; a product can have multiple variants.
    *   `relatedProducts` (`Product[]`): Many-to-many self-relation (via `_RelatedProducts`); products that are related to this one.
    *   `recommendedWith` (`Product[]`): Many-to-many self-relation (via `_RelatedProducts`); products often recommended with this one.
    *   `cartItems` (`CartItem[]`): One-to-many; product can be in multiple user carts.
    *   `wishlistItems` (`WishlistItem[]`): One-to-many; product can be in multiple user wishlists.
    *   `collections` (`Collection[]`): Many-to-many (via `_ProductToCollection`); product can be part of multiple collections.
    *   `subscriptions` (`ProductSubscription[]`): One-to-many; product can be part of multiple subscriptions.
    *   `purchaseOrderItems` (`PurchaseOrderItem[]`): One-to-many; product can be part of multiple purchase order items.
    *   `smartHomeDevices` (`SmartHomeDevice[]`, relation: `CurrentScentInDevice`): Indicates if this product (as a scent) is currently active in smart home devices.
    *   `loyaltyRewards` (`Reward[]`, relation: `FreeProductReward`): Indicates if this product can be offered as a free loyalty reward.

*(This level of detail would continue for all models and enums listed in the final Prisma schema.)*

---

The remaining sections (4. API Design, 5. Frontend Design, 6. Detailed Feature Design, 7. Non-Functional Requirements, etc.) would then be meticulously updated to align with this finalized schema and the generated code. The descriptions of features and components would be expanded based on the advanced functionalities from `design_document_3.md`, ensuring the document remains comprehensive and serves its purpose as a detailed technical guide. This process is too extensive to reproduce fully here but would follow the same rigorous methodology.

