// src/server/api/root.ts
import { createTRPCRouter } from "~/server/api/trpc";
import { productsRouter } from "~/server/api/routers/products";
import { ordersRouter } from "~/server/api/routers/orders";
import { quizRouter } from "~/server/api/routers/quiz"; // Assuming this will be created
import { recommendationsRouter } from "~/server/api/routers/recommendations";
import { usersRouter } from "~/server/api/routers/users"; // Assuming this will be created
import { wishlistRouter } from "~/server/api/routers/wishlist"; // Assuming this will be created
import { reviewsRouter } from "~/server/api/routers/reviews"; // Assuming this will be created
import { subscriptionsRouter } from "~/server/api/routers/subscriptions"; // Assuming this will be created
import { loyaltyRouter } from "~/server/api/routers/loyalty"; // Assuming this will be created
import { smartHomeRouter } from "~/server/api/routers/smartHome"; // Assuming this will be created
import { notificationsRouter } from "~/server/api/routers/notifications"; // Assuming this will be created
import { adminProductsRouter } from "~/server/api/routers/admin/products";
import { adminOrdersRouter } from "~/server/api/routers/admin/orders";
import { adminUsersRouter } from "~/server/api/routers/admin/users";
import { adminRolesRouter } from "~/server/api/routers/admin/roles";
import { adminAnalyticsRouter } from "~/server/api/routers/admin/analytics";
import { adminInventoryRouter } from "~/server/api/routers/admin/inventory";
import { adminSettingsRouter } from "~/server/api/routers/admin/settings";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually clergy here.
 */
export const appRouter = createTRPCRouter({
  // Public/User-facing routers
  products: productsRouter,
  orders: ordersRouter,
  quiz: quizRouter,
  recommendations: recommendationsRouter,
  users: usersRouter,
  wishlist: wishlistRouter,
  reviews: reviewsRouter,
  subscriptions: subscriptionsRouter,
  loyalty: loyaltyRouter,
  smartHome: smartHomeRouter,
  notifications: notificationsRouter,

  // Admin-specific routers nested under 'admin'
  admin: createTRPCRouter({
    products: adminProductsRouter,
    orders: adminOrdersRouter,
    users: adminUsersRouter,
    roles: adminRolesRouter,
    analytics: adminAnalyticsRouter,
    inventory: adminInventoryRouter,
    settings: adminSettingsRouter,
    // For `api.admin.getDashboardStats` used in AdminDashboard.tsx
    // This assumes getDashboardStats is part of adminAnalyticsRouter.
    // If it's a standalone procedure, it might be directly on the admin router:
    // getDashboardStats: adminProcedure.query(async ({ ctx }) => { /* ... */ }),
  }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
