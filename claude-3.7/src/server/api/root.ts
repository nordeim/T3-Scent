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
import { newsletterRouter } from "~/server/api/routers/newsletter";
import { postRouter } from "~/server/api/routers/post"; // Added postRouter

import { adminProductsRouter } from "~/server/api/routers/admin/products";
import { adminOrdersRouter } from "~/server/api/routers/admin/orders";
import { adminUsersRouter } from "~/server/api/routers/admin/users";
import { adminRolesRouter } from "~/server/api/routers/admin/roles";
import { adminAnalyticsRouter } from "~/server/api/routers/admin/analytics";
import { adminInventoryRouter } from "~/server/api/routers/admin/inventory";
import { adminSettingsRouter } from "~/server/api/routers/admin/settings";

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
  newsletter: newsletterRouter,
  post: postRouter, // Ensured postRouter is included

  // Admin-specific routers nested under 'admin'
  admin: createTRPCRouter({
    products: adminProductsRouter,
    orders: adminOrdersRouter,
    users: adminUsersRouter,
    roles: adminRolesRouter,
    analytics: adminAnalyticsRouter,
    inventory: adminInventoryRouter,
    settings: adminSettingsRouter,
  }),
});

export type AppRouter = typeof appRouter;