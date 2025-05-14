# The Scent — T3 Stack Aromatherapy E-Commerce Platform 🌿✨

A production-ready, fully featured e-commerce web app using the T3 Stack:  
Next.js · TypeScript · tRPC · Prisma · NextAuth · TailwindCSS · PWA · i18n · Stripe · SendGrid · React-Hot-Toast · headless UI

---

## 🌟 Project Overview

**The Scent** is an advanced aromatherapy store template with:  
- Category & inventory management  
- Search & wishlist  
- Scent recommendation quiz  
- Dark/Light mode & ambient audio  
- SEO, PWA installability & i18n (EN/ES)  
- Email order confirmations (SendGrid)  
- Stripe payments + webhook handling  
- Admin panel with RBAC  
- Skeleton loaders & error boundaries  
- CI pipeline (GitHub Actions)  

This repo is your jump-start for a modern, maintainable, scalable e-commerce platform.

---

## 📦 Technologies

| Layer          | Library/Tool            |
| -------------- | ----------------------- |
| Framework      | Next.js 14               |
| API & Types    | tRPC · Zod               |
| ORM            | Prisma → PostgreSQL      |
| Auth           | NextAuth.js · GitHub/Email |
| Styling        | TailwindCSS · headlessui |
| Theming/Audio  | next-themes · HTML5 audio |
| SEO/PWA        | next-seo · next-pwa      |
| Payments       | Stripe + Webhooks        |
| Email          | SendGrid                 |
| Notifications  | react-hot-toast          |
| i18n           | next-intl                |
| Testing        | Jest · React Testing Library · Playwright |
| CI             | GitHub Actions           |

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-username/the-scent-t3.git
cd the-scent-t3
npm install
```

### 2. Environment Variables

Copy the example and fill in your own keys:

```bash
cp .env.example .env
```

```dotenv
# .env
DATABASE_URL="postgresql://USER:PASS@localhost:5432/the_scent_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<randomly-generated-secret>"

GITHUB_ID="<your-github-oauth-id>"
GITHUB_SECRET="<your-github-oauth-secret>"

EMAIL_SERVER="smtp://USER:PASS@smtp.mailserver.com"
EMAIL_FROM="noreply@thescent.com"
SENDGRID_API_KEY="<your-sendgrid-key>"

STRIPE_SECRET_KEY="<your-stripe-secret-key>"
STRIPE_WEBHOOK_SECRET="<your-stripe-webhook-secret>"
```

### 3. Database Setup

```bash
# Create the database (local Postgres)
createdb the_scent_db

# Run migrations
npx prisma migrate dev --name init

# Seed initial data (admin user, categories, products)
npm run prisma:seed
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🛠️ Available Scripts

```bash
npm run dev              # Next.js development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # ESLint
npm run format           # Prettier
npm run typecheck        # TS type checks
npm test                 # Jest unit tests
npm run test:e2e         # Playwright end-to-end tests

# Prisma
npm run prisma:migrate   # Apply DB migrations
npm run prisma:seed      # Seed DB
```

---

## 📁 Folder Structure

```bash
the-scent-t3/
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.ts
├─ public/
│  ├─ icons/           # PWA icons
│  └─ manifest.json
├─ src/
│  ├─ pages/
│  │  ├─ _app.tsx
│  │  ├─ api/
│  │  │  ├─ auth/[...nextauth].ts
│  │  │  └─ webhooks/stripe.ts
│  │  ├─ index.tsx      # Home
│  │  ├─ shop/
│  │  │  ├─ index.tsx   # Products list + Search
│  │  │  └─ [slug].tsx  # Product detail + Wishlist
│  │  ├─ quiz.tsx       # Scent quiz
│  │  ├─ cart.tsx       # Shopping cart
│  │  ├─ checkout.tsx   # Payment & order
│  │  └─ wishlist.tsx   # User wishlist
│  ├─ components/       # UI components
│  ├─ utils/            # TRPC client, mailer, i18n
│  ├─ server/
│  │  ├─ prisma.ts      # Prisma client
│  │  └─ router/        # tRPC routers (auth, products, cart, orders, wishlist, admin)
│  └─ styles/           # Tailwind globals
├─ .github/             # CI workflows
├─ .env.example         # Env var template
└─ README.md
```

---

## ✨ Key Features

### 1. Category & Inventory  
  – Categorize products & track stock levels.  
  – Admin CRUD for products & categories.

### 2. Search & Wishlist  
  – Debounced full-text search (name/description).  
  – Wishlist: add/remove items, view saved products.

### 3. Scent Quiz  
  – Multi-step quiz to personalize recommendations.

### 4. Cart & Checkout  
  – Cart persistence, quantity management.  
  – Stripe integration & secure webhook handling.

### 5. Email Notifications  
  – Order confirmations via SendGrid.

### 6. UI/UX Enhancements  
  – Dark/Light mode (next-themes).  
  – Ambient background audio toggle.  
  – Skeleton loaders & an ErrorBoundary.  
  – Toast notifications for feedback.  

### 7. SEO, PWA & i18n  
  – next-seo for metadata & social previews.  
  – next-pwa + manifest for offline & installable app.  
  – next-intl for English/Spanish translations.

### 8. Admin Panel (RBAC)  
  – NextAuth with role field (USER | ADMIN).  
  – tRPC middleware to protect admin routes.

### 9. Testing & CI  
  – Unit tests (Jest), E2E tests (Playwright).  
  – GitHub Actions for lint, type-check & tests.

---

## 🚀 Deployment

### Vercel  
1. Push to GitHub.  
2. Import repo in Vercel.  
3. Add all env variables in Vercel dashboard.  
4. Deploy — automatic builds & serverless functions.

### Docker Compose (local prod)

```yaml
# docker-compose.yml
version: '3.7'
services:
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: the_scent_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports: ["5432:5432"]
  web:
    build: .
    command: npm run start
    env_file: .env
    volumes:
      - .:/app
    ports: ["3000:3000"]
    depends_on:
      - db
```

---

## 🤝 Contributing

1. Fork the repo  
2. Create a branch (`git checkout -b feat/awesome`)  
3. Commit (`git commit -m "feat: ..."`), push  
4. Open a Pull Request  

Please follow ESLint and Prettier rules.  

---

## 📄 License

MIT © 2024 [Your Name]

---

Happy coding & happy smelling! 🌿✨
