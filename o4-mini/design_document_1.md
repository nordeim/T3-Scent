<think>
I need to propose a full-blown T3 stack application inspired by “The Scent” README. That means Next.js + TypeScript + TailwindCSS + tRPC + Prisma + NextAuth facing a local PostgreSQL.  
I’ll outline:
1. Project setup & dependencies  
2. .env and Prisma schema  
3. tRPC routers (products, cart, orders, auth)  
4. NextAuth config  
5. Folder structure & sample pages (Home, Shop, Product, Quiz, Cart, Checkout)  
6. Key UI components: ProductCard, Quiz, Dark/Light toggle, Audio toggle  
7. Run/migrate instructions  

Make it engaging with Markdown, tables, code blocks, and emojis. Then deliver final answer.  
</think>

---

# 🌿 My E-Commerce Platform (T3 Stack)

A fully-featured e-commerce platform built with the T3 Stack (Next.js, TypeScript, tRPC, Prisma, NextAuth, TailwindCSS) and a local PostgreSQL database.

## 🚀 1. Quick Start

```bash
# 1. Create T3 App
npx create-t3-app@latest my-ecommerce
cd my-ecommerce

# 2. Install extras (Stripe for payments, next-themes for dark mode)
npm install stripe @stripe/stripe-js next-themes

# 3. Create .env
cp .env.example .env

# 4. Configure your .env with PostgreSQL URL
# DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/my_ecom_db"
# NEXTAUTH_SECRET, NEXTAUTH_URL, STRIPE_SECRET_KEY

# 5. Prisma migration
npx prisma migrate dev --name init

# 6. Run dev
npm run dev
```

---

## 🗂️ 2. Folder Structure

```bash
my-ecommerce/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── pages/
│   │   ├── _app.tsx
│   │   ├── api/auth/[...nextauth].ts
│   │   ├── index.tsx         # Home
│   │   ├── shop/
│   │   │   └── index.tsx     # Products Grid
│   │   ├── shop/[slug].tsx   # Product Detail
│   │   ├── quiz.tsx          # Scent Quiz
│   │   ├── cart.tsx
│   │   └── checkout.tsx
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── ProductCard.tsx
│   │   ├── QuizStep.tsx
│   │   └── AudioToggle.tsx
│   ├── server/
│   │   ├── prisma.ts
│   │   └── router/
│   │       ├── index.ts      # appRouter
│   │       ├── auth.ts
│   │       ├── products.ts
│   │       ├── cart.ts
│   │       └── orders.ts
│   └── styles/
│       └── globals.css       # TailwindCSS
└── package.json
```

---

## ⚙️ 3. Prisma Schema (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String   @id @default(cuid())
  name          String?
  email         String   @unique
  emailVerified DateTime?
  image         String?
  orders        Order[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Product {
  id          String    @id @default(cuid())
  name        String
  slug        String    @unique
  description String
  priceCents  Int
  image       String
  tags        String[]  @default([])
  createdAt   DateTime  @default(now())
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
  id        String   @id @default(cuid())
  order     Order    @relation(fields: [orderId], references: [id])
  orderId   String
  product   Product  @relation(fields: [productId], references: [id])
  productId String
  quantity  Int
  priceCents Int
}
```

---

## 🔗 4. tRPC Routers

### src/server/router/products.ts

```ts
import { z } from 'zod';
import { createRouter } from '../trpc';

export const productsRouter = createRouter()
  .query('list', {
    async resolve({ ctx }) {
      return ctx.prisma.product.findMany();
    },
  })
  .query('bySlug', {
    input: z.object({ slug: z.string() }),
    async resolve({ ctx, input }) {
      return ctx.prisma.product.findUniqueOrThrow({ where: { slug: input.slug } });
    },
  });
```

### src/server/router/cart.ts

```ts
import { z } from 'zod';
import { createProtectedRouter } from '../trpc';

export const cartRouter = createProtectedRouter()
  .query('get', {
    async resolve({ ctx }) {
      return ctx.prisma.cartItem.findMany({
        where: { userId: ctx.session.user.id },
        include: { product: true },
      });
    },
  })
  .mutation('add', {
    input: z.object({ productId: z.string(), qty: z.number().min(1) }),
    async resolve({ input, ctx }) {
      return ctx.prisma.cartItem.upsert({
        where: {
          userId_productId: { userId: ctx.session.user.id, productId: input.productId },
        },
        create: { userId: ctx.session.user.id, productId: input.productId, quantity: input.qty },
        update: { quantity: { increment: input.qty } },
      });
    },
  });
```

### src/server/router/orders.ts

```ts
import { z } from 'zod';
import { createProtectedRouter } from '../trpc';

export const ordersRouter = createProtectedRouter()
  .mutation('create', {
    input: z.object({ paymentIntentId: z.string() }),
    async resolve({ ctx, input }) {
      // Fetch cart and calculate total
      const cart = await ctx.prisma.cartItem.findMany({
        where: { userId: ctx.session.user.id },
        include: { product: true },
      });
      const total = cart.reduce((sum, c) => sum + c.product.priceCents * c.quantity, 0);

      // Create Stripe PaymentIntent confirmation would go here...

      const order = await ctx.prisma.order.create({
        data: {
          userId: ctx.session.user.id,
          totalCents: total,
          items: {
            create: cart.map((c) => ({
              productId: c.productId,
              quantity: c.quantity,
              priceCents: c.product.priceCents,
            })),
          },
        },
      });
      // Clear cart
      await ctx.prisma.cartItem.deleteMany({ where: { userId: ctx.session.user.id } });
      return order;
    },
  });
```

### src/server/router/index.ts

```ts
import { createRouter } from './trpc';
import { authRouter } from './auth';
import { productsRouter } from './products';
import { cartRouter } from './cart';
import { ordersRouter } from './orders';

export const appRouter = createRouter()
  .merge('auth.', authRouter)
  .merge('products.', productsRouter)
  .merge('cart.', cartRouter)
  .merge('orders.', ordersRouter);

export type AppRouter = typeof appRouter;
```

---

## 🔒 5. NextAuth Configuration

`src/pages/api/auth/[...nextauth].ts`

```ts
import NextAuth from 'next-auth';
import Providers from 'next-auth/providers';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '../../../server/prisma';

export default NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Providers.Email({ server: process.env.EMAIL_SERVER, from: process.env.EMAIL_FROM }),
    Providers.GitHub({ clientId: process.env.GITHUB_ID!, clientSecret: process.env.GITHUB_SECRET! }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
});
```

---

## 🎨 6. Key UI Components

### Dark/Light Toggle (`components/ThemeToggle.tsx`)

```tsx
import { useTheme } from 'next-themes';
export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? '🌞' : '🌙'}
    </button>
  );
};
```

### Ambient Audio Toggle (`components/AudioToggle.tsx`)

```tsx
import { useState, useRef } from 'react';

export const AudioToggle = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else audioRef.current.play().catch(console.error);
    setPlaying(!playing);
  };

  return (
    <>
      <button onClick={toggle}>{playing ? '🔇' : '🎧'}</button>
      <audio ref={audioRef} loop src="/ambient.mp3" />
    </>
  );
};
```

### Product Card (`components/ProductCard.tsx`)

```tsx
import Link from 'next/link';
import { Product } from '@prisma/client';

export const ProductCard = ({ product }: { product: Product }) => (
  <Link href={`/shop/${product.slug}`}>
    <a className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow hover:shadow-lg transition">
      <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="text-lg font-semibold">{product.name}</h3>
        <p className="mt-2 text-primary">${(product.priceCents/100).toFixed(2)}</p>
      </div>
    </a>
  </Link>
);
```

---

## 📄 7. Sample Page: Shop Grid

```tsx
// src/pages/shop/index.tsx
import { trpc } from '../../utils/trpc';
import { ProductCard } from '../../components/ProductCard';

export default function ShopPage() {
  const { data: products = [] } = trpc.useQuery(['products.list']);
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Shop</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}
```

---

## 🎲 8. Scent Quiz Flow

- A client-only page `quiz.tsx`  
- Multi-step using local state  
- At end, filter products and show recommendations  

**QuizStep Component**  
```tsx
// src/components/QuizStep.tsx
import React from 'react';
type Option = { label: string; value: string; icon: string };
export const QuizStep = ({ question, options, onSelect }) => (
  <div>
    <h2 className="text-2xl font-semibold">{question}</h2>
    <div className="grid grid-cols-2 gap-4 mt-4">
      {options.map((o) => (
        <button key={o.value}
          onClick={() => onSelect(o.value)}
          className="p-4 bg-primary/10 hover:bg-primary/20 rounded-lg flex flex-col items-center">
          <i className={`fa fa-${o.icon} fa-2x mb-2`} />
          {o.label}
        </button>
      ))}
    </div>
  </div>
);
```

---

## 🧪 9. Run & Migrate

```bash
# Create DB if not exists
createdb my_ecom_db

# Run Prisma migrations
npx prisma migrate dev

# Start development server
npm run dev
```

---

## 🚀 10. Deployment

- Vercel: 🎯 seamless with T3  
- Docker Compose for local + Postgres  

```yaml
# docker-compose.yml
version: '3.7'
services:
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: my_ecom_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports: ["5432:5432"]
```

---

## 📈 Roadmap

- ✅ Product browsing & detail  
- ✅ Scent Quiz  
- ✅ Cart & Checkout  
- ✅ Dark/Light & Audio  
- 🚧 User profile & Order history  
- 🚧 Payment gateway integration  

---

Enjoy building your signature aromatherapy e-commerce platform! 🌿✨ Feel free to customize colors, assets, and business logic to match your brand.
