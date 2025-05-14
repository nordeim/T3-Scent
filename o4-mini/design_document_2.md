Here’s a deeper, more systematic evolution of our T3‐stack e-commerce platform—including inventory, categories, i18n, PWA, toast notifications, an admin panel with RBAC, seed data, CI, etc. Below are **only** the files that are new or have changed dramatically.  

---

### 1. prisma/schema.prisma  
Adds `Role` enum, `Category` model, `inventory` on `Product`, and relations for RBAC.  
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  USER
  ADMIN
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  role          Role      @default(USER)
  orders        Order[]
  cart          CartItem[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Category {
  id       String    @id @default(cuid())
  name     String    @unique
  slug     String    @unique
  products Product[]
}

model Product {
  id          String     @id @default(cuid())
  name        String
  slug        String     @unique
  description String
  priceCents  Int
  image       String
  tags        String[]   @default([])
  inventory   Int        @default(0)
  category    Category?  @relation(fields: [categoryId], references: [id])
  categoryId  String?
  createdAt   DateTime   @default(now())
}

model CartItem {
  id        String   @id @default(cuid())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  product   Product  @relation(fields: [productId], references: [id])
  productId String
  quantity  Int      @default(1)
  addedAt   DateTime @default(now())
}

model Order {
  id           String      @id @default(cuid())
  user         User        @relation(fields: [userId], references: [id])
  userId       String
  items        OrderItem[]
  totalCents   Int
  status       String      @default("PENDING")
  createdAt    DateTime    @default(now())
}

model OrderItem {
  id         String   @id @default(cuid())
  order      Order    @relation(fields: [orderId], references: [id])
  orderId    String
  product    Product  @relation(fields: [productId], references: [id])
  productId  String
  quantity   Int
  priceCents Int
}
```

---

### 2. prisma/seed.ts  
Populate roles, categories, sample products & an admin user.
```ts
// prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const pw = await bcrypt.hash('AdminPass123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@store.com' },
    update: {},
    create: {
      email: 'admin@store.com',
      name: 'Store Admin',
      role: Role.ADMIN,
      password: pw, // assume you added a password field
    },
  });

  // Categories
  const cats = ['Oil', 'Soap', 'Candle'].map((name) =>
    prisma.category.upsert({
      where: { slug: name.toLowerCase() },
      create: { name, slug: name.toLowerCase() },
      update: {},
    })
  );
  const [oil, soap, candle] = await Promise.all(cats);

  // Products
  await prisma.product.createMany({
    data: [
      {
        name: 'Serenity Blend Oil',
        slug: 'serenity-blend-oil',
        description: 'Calming Lavender & Chamomile',
        priceCents: 1999,
        image: '/images/serenity.jpg',
        tags: ['relax', 'floral'],
        inventory: 120,
        categoryId: oil.id,
      },
      {
        name: 'Energizing Citrus Soap',
        slug: 'energizing-citrus-soap',
        description: 'Zesty Orange & Lemon',
        priceCents: 1299,
        image: '/images/citrus.jpg',
        tags: ['energize', 'citrus'],
        inventory: 80,
        categoryId: soap.id,
      },
      // …more
    ],
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

### 3. next.config.js  
Enable PWA, i18n, image domains, and SWC minify.
```js
// next.config.js
const withPWA = require('next-pwa');

module.exports = withPWA({
  reactStrictMode: true,
  swcMinify: true,
  pwa: {
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
  },
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
  },
  images: {
    domains: ['your-cdn.com', 'via.placeholder.com'],
  },
});
```

---

### 4. package.json (partial)  
Added dependencies for i18n, PWA, toasts, bcrypt, headlessui, testing.
```jsonc
// package.json
{
  "dependencies": {
    "@headlessui/react": "^1.7.7",
    "bcrypt": "^5.1.0",
    "next-intl": "^2.2.2",
    "next-pwa": "^5.6.0",
    "react-hot-toast": "^2.4.0",
    "stripe": "^12.3.0",
    "@stripe/stripe-js": "^1.25.0"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "eslint-plugin-jest": "^29.2.1",
    "jest": "^29.4.3",
    "playwright": "^1.31.1"
  }
}
```

---

### 5. src/pages/_app.tsx  
Wraps in Session, Theme, TRPC, Intl, Toast and global Layout.
```tsx
// src/pages/_app.tsx
import { AppType } from 'next/dist/shared/lib/utils';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { NextIntlProvider } from 'next-intl';
import { trpc } from '../utils/trpc';
import '../styles/globals.css';

const MyApp: AppType = ({ Component, pageProps: { session, ...pageProps } }) => {
  const messages = pageProps.messages || {};
  return (
    <SessionProvider session={session}>
      <NextIntlProvider messages={messages}>
        <ThemeProvider attribute="class" defaultTheme="system">
          <Component {...pageProps} />
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </NextIntlProvider>
    </SessionProvider>
  );
};

export default trpc.withTRPC(MyApp);
```

---

### 6. src/utils/i18n.ts  
Helper to load locale messages.
```ts
// src/utils/i18n.ts
import { NextIntlProvider } from 'next-intl';

export function loadLocale(locale: string) {
  return import(`../messages/${locale}.json`).then((m) => m.default);
}
```

Create `/src/messages/en.json` and `es.json` with your keys.

---

### 7. src/server/router/admin.ts  
Admin‐only tRPC router for product management.
```ts
// src/server/router/admin.ts
import { z } from 'zod';
import { createProtectedRouter } from './trpc';

export const adminRouter = createProtectedRouter()
  .middleware(async ({ ctx, next }) => {
    if (ctx.session.user.role !== 'ADMIN') {
      throw new Error('UNAUTHORIZED');
    }
    return next();
  })
  .query('products.list', {
    async resolve({ ctx }) {
      return ctx.prisma.product.findMany({ include: { category: true } });
    },
  })
  .mutation('product.create', {
    input: z.object({
      name: z.string(),
      slug: z.string(),
      description: z.string(),
      priceCents: z.number().int(),
      image: z.string(),
      tags: z.array(z.string()),
      inventory: z.number().int(),
      categoryId: z.string().nullable(),
    }),
    async resolve({ ctx, input }) {
      return ctx.prisma.product.create({ data: input });
    },
  })
  // … update, delete
```

---

### 8. src/server/router/index.ts  
Merge the new `adminRouter`.
```ts
// src/server/router/index.ts
import { createRouter } from './trpc';
import { authRouter }    from './auth';
import { productsRouter } from './products';
import { cartRouter }    from './cart';
import { ordersRouter }  from './orders';
import { adminRouter }   from './admin';

export const appRouter = createRouter()
  .merge('auth.', authRouter)
  .merge('products.', productsRouter)
  .merge('cart.', cartRouter)
  .merge('orders.', ordersRouter)
  .merge('admin.', adminRouter);

export type AppRouter = typeof appRouter;
```

---

### 9. src/components/AdminLayout.tsx  
Basic admin sidebar/layout.
```tsx
// src/components/AdminLayout.tsx
import Link from 'next/link';
import { ReactNode } from 'react';

export const AdminLayout = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
    <aside className="w-64 p-6 bg-white dark:bg-gray-800">
      <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
      <nav className="space-y-4">
        <Link href="/admin/products"><a>Products</a></Link>
        <Link href="/admin/orders"><a>Orders</a></Link>
        <Link href="/"><a>Back to Store</a></Link>
      </nav>
    </aside>
    <main className="flex-1 p-8">{children}</main>
  </div>
);
```

---

### 10. src/pages/admin/products/index.tsx  
List & manage products (simplified).
```tsx
// src/pages/admin/products/index.tsx
import { trpc } from '../../../utils/trpc';
import { AdminLayout } from '../../../components/AdminLayout';

export default function AdminProductsPage() {
  const { data = [], isLoading } = trpc.useQuery(['admin.products.list']);
  if (isLoading) return <p>Loading…</p>;

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-4">Products</h1>
      <table className="min-w-full bg-white dark:bg-gray-800">
        <thead>
          <tr>
            <th className="p-2">Name</th>
            <th className="p-2">Price</th>
            <th className="p-2">Inventory</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p) => (
            <tr key={p.id}>
              <td className="p-2">{p.name}</td>
              <td className="p-2">${(p.priceCents/100).toFixed(2)}</td>
              <td className="p-2">{p.inventory}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminLayout>
  );
}
```

---

### 11. public/manifest.json & icons  
_PWA manifest_  
```json
// public/manifest.json
{
  "name": "My E-Commerce Store",
  "short_name": "Store",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#2a7c8a",
  "background_color": "#ffffff"
}
```
Place matching `icons/*.png` in `/public`.

---

### 12. .github/workflows/ci.yml  
Basic CI: lint, type‐check, test.
```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x]
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with: { node-version: ${{ matrix.node-version }} }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
```

---

## 🧠 Summary of Improvements  
- **Inventory & Categories** in Prisma schema  
- **Admin panel** (RBAC via NextAuth + tRPC middleware)  
- **Internationalization** (next-intl)  
- **PWA support** (next-pwa + manifest)  
- **Toast notifications** (react-hot-toast)  
- **Seed script** for easy local data  
- **CI pipeline** for lint/type/test  
- **Image optimization, strict TS, Headless UI**  

With these changes your platform becomes:  
– enterprise-ready (RBAC, categories, inventory)  
– cross-language (i18n)  
– installable (PWA)  
– user-friendly (toasts)  
– maintainable (seed, CI).  

Happy building! 🚀
