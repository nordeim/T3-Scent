Here’s **a second-round deep dive**—we’ll add search, wish-lists, email notifications, Stripe webhooks, SEO, skeleton loaders, error boundaries, and more. Only files that are **new** or **significantly changed** are shown.

---

## 1. src/server/router/products.ts  
Adds a `search` endpoint (full-text on name & description).
```ts
// src/server/router/products.ts
import { z } from 'zod';
import { createRouter } from './trpc';

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
  })
  .query('search', {
    input: z.object({ term: z.string().min(1) }),
    async resolve({ ctx, input }) {
      const t = `%${input.term.toLowerCase()}%`;
      return ctx.prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: input.term, mode: 'insensitive' } },
            { description: { contains: input.term, mode: 'insensitive' } },
          ],
        },
        take: 20,
      });
    },
  });
```

---

## 2. src/server/router/wishlist.ts  
A simple wish-list (add/remove & list) for logged-in users.
```ts
// src/server/router/wishlist.ts
import { z } from 'zod';
import { createProtectedRouter } from './trpc';

export const wishlistRouter = createProtectedRouter()
  .query('get', {
    async resolve({ ctx }) {
      return ctx.prisma.wishlistItem.findMany({
        where: { userId: ctx.session.user.id },
        include: { product: true },
      });
    },
  })
  .mutation('toggle', {
    input: z.object({ productId: z.string() }),
    async resolve({ ctx, input }) {
      const existing = await ctx.prisma.wishlistItem.findUnique({
        where: { userId_productId: { userId: ctx.session.user.id, productId: input.productId } },
      });
      if (existing) {
        await ctx.prisma.wishlistItem.delete({ where: { id: existing.id } });
        return { removed: true };
      }
      await ctx.prisma.wishlistItem.create({
        data: { userId: ctx.session.user.id, productId: input.productId },
      });
      return { removed: false };
    },
  });
```

And add to your router index:

```ts
// src/server/router/index.ts
import { wishlistRouter } from './wishlist';
…
export const appRouter = createRouter()
  …
  .merge('wishlist.', wishlistRouter)
  …
```

---

## 3. src/utils/mailer.ts  
SendGrid-based mailer for order confirmations.
```ts
// src/utils/mailer.ts
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendOrderConfirmation(to: string, orderId: string, items: any[]) {
  const itemList = items.map(i => `<li>${i.product.name} x${i.quantity}</li>`).join('');
  const msg = {
    to,
    from: process.env.EMAIL_FROM!,
    subject: `Your Order ${orderId} Confirmation`,
    html: `
      <h1>Thank you for your purchase!</h1>
      <p>Order ID: <strong>${orderId}</strong></p>
      <ul>${itemList}</ul>
      <p>We’ll let you know when it ships.</p>
    `,
  };
  await sgMail.send(msg);
}
```

---

## 4. src/server/router/orders.ts  
After order is created, send an email.
```ts
// src/server/router/orders.ts
import { z } from 'zod';
import { createProtectedRouter } from './trpc';
import { sendOrderConfirmation } from '../../utils/mailer';

export const ordersRouter = createProtectedRouter()
  .mutation('create', {
    input: z.object({ paymentIntentId: z.string() }),
    async resolve({ ctx, input }) {
      // …existing checkout logic…
      const order = await ctx.prisma.order.create({
        // …data…
        include: { items: { include: { product: true } } },
      });

      // Send confirmation
      await sendOrderConfirmation(ctx.session.user.email!, order.id, order.items);
      return order;
    },
  });
```

---

## 5. pages/api/webhooks/stripe.ts  
Stripe webhook to catch payment events.
```ts
// pages/api/webhooks/stripe.ts
import { buffer } from 'micro';
import Stripe from 'stripe';
import { prisma } from '../../server/prisma';
import { sendOrderConfirmation } from '../../utils/mailer';

export const config = { api: { bodyParser: false } };
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2022-11-15' });

export default async function handler(req: any, res: any) {
  const sig = req.headers['stripe-signature']!;
  const buf = await buffer(req);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    // lookup cart or metadata to build order in DB...
    // For brevity, pseudo-code:
    /*
      const userId = pi.metadata.userId;
      const cart = ...
      const order = ...
      await sendOrderConfirmation(userEmail, order.id, order.items);
    */
  }
  res.json({ received: true });
}
```

---

## 6. next-seo.config.ts  
Defaults for SEO & social sharing.
```ts
// next-seo.config.ts
export default {
  titleTemplate: '%s | My Aromatherapy Store',
  defaultTitle: 'My Aromatherapy Store',
  description: 'Handcrafted aromatherapy products to calm your mind.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://your-domain.com',
    site_name: 'Aromatherapy Store',
  },
  twitter: {
    handle: '@yourhandle',
    site: '@yourhandle',
    cardType: 'summary_large_image',
  },
};
```

---

## 7. src/pages/_app.tsx  
Wrap in `DefaultSeo` and include error boundary.
```tsx
// src/pages/_app.tsx
import { DefaultSeo } from 'next-seo';
import SEO from '../../next-seo.config';
import ErrorBoundary from '../components/ErrorBoundary';
… // other imports

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <DefaultSeo {...SEO} />
      <ThemeProvider attribute="class">
        <ErrorBoundary>
          <Component {...pageProps} />
          <Toaster position="bottom-right" />
        </ErrorBoundary>
      </ThemeProvider>
    </SessionProvider>
  );
}
```

---

## 8. src/components/SearchBar.tsx  
Debounced search input.
```tsx
// src/components/SearchBar.tsx
import { useState, useEffect } from 'react';
import { trpc } from '../utils/trpc';
import debounce from 'lodash.debounce';

export function SearchBar({ onResults }: { onResults: any }) {
  const [term, setTerm] = useState('');
  const { data, refetch } = trpc.useQuery(['products.search', { term }], {
    enabled: false,
  });

  // Debounce calls
  const handleSearch = debounce((t: string) => {
    if (t.length > 1) refetch();
  }, 300);

  useEffect(() => {
    handleSearch(term);
    return () => handleSearch.cancel();
  }, [term]);

  useEffect(() => {
    if (data) onResults(data);
  }, [data]);

  return (
    <input
      type="search"
      value={term}
      onChange={e => setTerm(e.target.value)}
      placeholder="Search products…"
      className="w-full p-2 border rounded mb-4"
    />
  );
}
```

---

## 9. src/components/SkeletonProductCard.tsx  
A loading placeholder.
```tsx
// src/components/SkeletonProductCard.tsx
export const SkeletonProductCard = () => (
  <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-80" />
);
```

---

## 10. src/components/ErrorBoundary.tsx  
Catches runtime errors.
```tsx
// src/components/ErrorBoundary.tsx
import React from 'react';

type State = { hasError: boolean };
export default class ErrorBoundary extends React.Component<{}, State> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return <div className="p-8 text-center">😢 Something went wrong.</div>;
    }
    return this.props.children;
  }
}
```

---

## 11. src/components/WishlistButton.tsx  
Toggle heart icon.
```tsx
// src/components/WishlistButton.tsx
import { useState, useEffect } from 'react';
import { trpc } from '../utils/trpc';
import toast from 'react-hot-toast';

export function WishlistButton({ productId }: { productId: string }) {
  const [inList, setInList] = useState(false);
  const listQ = trpc.useQuery(['wishlist.get']);
  const toggle = trpc.useMutation('wishlist.toggle', {
    onSuccess: (res) => {
      setInList(!res.removed);
      toast.success(res.removed ? 'Removed from wishlist' : 'Added to wishlist');
    },
  });

  useEffect(() => {
    if (listQ.data) {
      setInList(listQ.data.some(i => i.productId === productId));
    }
  }, [listQ.data]);

  return (
    <button onClick={() => toggle.mutate({ productId })} aria-label="Wishlist">
      {inList ? '❤️' : '🤍'}
    </button>
  );
}
```

---

## 12. pages/shop/index.tsx  
Combine search, skeleton, and wishlist.
```tsx
// src/pages/shop/index.tsx
import { useState } from 'react';
import { trpc } from '../../utils/trpc';
import { ProductCard } from '../../components/ProductCard';
import { SkeletonProductCard } from '../../components/SkeletonProductCard';
import { SearchBar } from '../../components/SearchBar';

export default function ShopPage() {
  const [results, setResults] = useState<any[] | null>(null);
  const allQ = trpc.useQuery(['products.list']);
  const products = results ?? allQ.data ?? [];

  return (
    <div className="container mx-auto py-8">
      <SearchBar onResults={setResults!} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {allQ.isLoading && !results
          ? Array(8).fill(0).map((_, i) => <SkeletonProductCard key={i} />)
          : products.map(p => <ProductCard key={p.id} product={p} />)
        }
      </div>
    </div>
  );
}
```

---

## 13. pages/wishlist.tsx  
Your saved items.
```tsx
// pages/wishlist.tsx
import { trpc } from '../utils/trpc';
import { ProductCard } from '../components/ProductCard';

export default function WishlistPage() {
  const { data = [], isLoading } = trpc.useQuery(['wishlist.get']);
  if (isLoading) return <p>Loading…</p>;
  if (!data.length) return <p>Your wishlist is empty.</p>;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Your Wishlist</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.map(item => <ProductCard key={item.productId} product={item.product} />)}
      </div>
    </div>
  );
}
```

---

## 14. prisma/schema.prisma  
Add `WishlistItem` model.
```prisma
model WishlistItem {
  id        String   @id @default(cuid())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  product   Product  @relation(fields: [productId], references: [id])
  productId String
  addedAt   DateTime @default(now())

  @@unique([userId, productId])
}
```

---

### 🔑 Summary of Enhancements  
- **Search Bar** with debounced tRPC search  
- **Wishlist** feature + UI  
- **Skeleton loaders** for UX  
- **Error boundary** for resilience  
- **SEO defaults** via `next-seo`  
- **Email confirmations** (SendGrid)  
- **Stripe webhook** scaffold  
- **Toasts** for feedback  

With these you’ll have a **rock-solid**, user-centric, and production-ready e-commerce app. Enjoy! 🚀
