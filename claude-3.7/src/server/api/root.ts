// src/server/api/root.ts
import { createTRPCRouter } from "~/server/api/trpc";
import { productsRouter } from "~/server/api/routers/products";
import { ordersRouter } from "~/server/api/routers/orders";
import { quizRouter } from "~/server/api/routers/quiz";
import { recommendationsRouter } from "~/server/api/routers/recommendations";
import { usersRouter } from "~/server/api/routers/users";
import { wishlistRouter } from "~/server/api/routers/wishlist";
import { reviewsRouter } from "~/server/api/routers/reviews";
import { subscriptionsRouter } from "~/server/api/routers/subscriptions";
import { loyaltyRouter } from "~/server/api/routers/loyalty";
import { smartHomeRouter } from "~/server/api/routers/smartHome";
import { notificationsRouter } from "~/server/api/routers/notifications";
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
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
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
  // Admin routers
  admin: createTRPCRouter({ // Nesting admin routers
    products: adminProductsRouter,
    orders: adminOrdersRouter,
    users: adminUsersRouter,
    roles: adminRolesRouter,
    analytics: adminAnalyticsRouter,
    inventory: adminInventoryRouter,
    settings: adminSettingsRouter,
    // getDashboardStats procedure could be here or in a dedicated admin.dashboardRouter
    getDashboardStats: adminAnalyticsRouter.getDashboardStats, // Example: Re-exporting for direct access if needed by AdminDashboard.tsx
  }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
