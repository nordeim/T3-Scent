# Creating a T3 App for "The Scent" E-commerce Platform

I'll help you create a comprehensive T3 app for your aromatherapy and wellness e-commerce platform. Let's build this step-by-step, focusing on creating a fully-featured application with local PostgreSQL database integration.

## Getting Started

First, let's create a new T3 app:

```bash
npx create-t3-app@latest the-scent
```

During the setup, select:
- TypeScript
- Next.js
- tRPC
- Tailwind CSS
- Prisma
- NextAuth.js

## Database Schema Setup

Let's create our PostgreSQL database schema in Prisma:

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  password      String?   // Hashed password
  role          Role      @default(CUSTOMER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  accounts      Account[]
  sessions      Session[]
  orders        Order[]
  reviews       Review[]
  quizResponses QuizResponse[]
  
  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  
  @@unique([identifier, token])
  @@map("verification_tokens")
}

model Product {
  id          String      @id @default(cuid())
  name        String
  description String      @db.Text
  price       Decimal     @db.Decimal(10, 2)
  imageUrl    String?
  inStock     Boolean     @default(true)
  featured    Boolean     @default(false)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  categories  Category[]  @relation("ProductToCategory")
  tags        Tag[]       @relation("ProductToTag")
  orderItems  OrderItem[]
  reviews     Review[]
  
  @@map("products")
}

model Category {
  id          String    @id @default(cuid())
  name        String    @unique
  description String?   @db.Text
  imageUrl    String?
  
  products    Product[] @relation("ProductToCategory")
  
  @@map("categories")
}

model Tag {
  id          String    @id @default(cuid())
  name        String    @unique
  
  products    Product[] @relation("ProductToTag")
  
  @@map("tags")
}

model Order {
  id              String      @id @default(cuid())
  userId          String
  status          OrderStatus @default(PENDING)
  total           Decimal     @db.Decimal(10, 2)
  shippingAddress Json
  paymentIntentId String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  user            User        @relation(fields: [userId], references: [id])
  orderItems      OrderItem[]
  
  @@map("orders")
}

model OrderItem {
  id        String   @id @default(cuid())
  orderId   String
  productId String
  quantity  Int
  price     Decimal  @db.Decimal(10, 2)
  
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id])
  
  @@map("order_items")
}

model Review {
  id        String   @id @default(cuid())
  userId    String
  productId String
  rating    Int      @db.SmallInt
  comment   String?  @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@map("reviews")
}

model QuizQuestion {
  id           String         @id @default(cuid())
  question     String
  options      Json           // Array of options with labels and values
  order        Int            // For sequencing the questions
  
  responses    QuizResponse[] @relation("QuizResponseToQuestion")
  
  @@map("quiz_questions")
}

model QuizResponse {
  id         String   @id @default(cuid())
  userId     String?
  questionId String
  answer     String   // The selected option value
  createdAt  DateTime @default(now())
  
  user       User?     @relation(fields: [userId], references: [id], onDelete: SetNull)
  question   QuizQuestion @relation("QuizResponseToQuestion", fields: [questionId], references: [id])
  
  @@map("quiz_responses")
}

model NewsletterSubscriber {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  
  @@map("newsletter_subscribers")
}

enum Role {
  ADMIN
  CUSTOMER
}

enum OrderStatus {
  PENDING
  PAID
  SHIPPED
  DELIVERED
  CANCELLED
}
```

## Creating Key Components

Let's implement some of the core components for the application:

### 1. Setting Up Authentication

```typescript
// src/server/auth.ts
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { db } from "~/server/db";
import { compare } from "bcryptjs";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
      role: "ADMIN" | "CUSTOMER";
    };
  }

  interface User {
    role: "ADMIN" | "CUSTOMER";
  }
}

export const authOptions: NextAuthOptions = {
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
        role: user.role,
      },
    }),
  },
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await compare(credentials.password, user.password);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    newUser: "/auth/signup",
  },
  session: {
    strategy: "jwt",
  },
};

export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
```

### 2. Theme Toggle Component

```tsx
// src/components/ui/ThemeToggle.tsx
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { FaSun, FaMoon } from "react-icons/fa";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted on the client to avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    
    // Store preference in localStorage
    localStorage.setItem("theme", theme === "dark" ? "light" : "dark");
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <FaSun className="h-5 w-5 text-yellow-400" />
      ) : (
        <FaMoon className="h-5 w-5 text-primary" />
      )}
    </button>
  );
};
```

### 3. Ambient Audio Toggle

```tsx
// src/components/ui/AudioToggle.tsx
import { useState, useRef, useEffect } from "react";
import { FaVolumeUp, FaVolumeMute } from "react-icons/fa";

export const AudioToggle = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element on client side
    audioRef.current = new Audio("/sounds/ambient.mp3");
    audioRef.current.loop = true;
    
    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <button
      onClick={toggleAudio}
      className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
      aria-label={isPlaying ? "Mute ambient sound" : "Play ambient sound"}
    >
      {isPlaying ? (
        <FaVolumeUp className="h-5 w-5 text-primary" />
      ) : (
        <FaVolumeMute className="h-5 w-5 text-primary" />
      )}
    </button>
  );
};
```

### 4. Products API Router

```typescript
// src/server/api/routers/products.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";

export const productsRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        categoryId: z.string().optional(),
        tagIds: z.array(z.string()).optional(),
        featured: z.boolean().optional(),
        search: z.string().optional(),
        limit: z.number().optional(),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 10;
      const { cursor, categoryId, tagIds, featured, search } = input;

      const items = await ctx.db.product.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: "desc",
        },
        where: {
          ...(categoryId ? {
            categories: {
              some: {
                id: categoryId,
              },
            },
          } : {}),
          ...(tagIds && tagIds.length > 0 ? {
            tags: {
              some: {
                id: {
                  in: tagIds,
                },
              },
            },
          } : {}),
          ...(featured !== undefined ? { featured } : {}),
          ...(search ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          } : {}),
        },
        include: {
          categories: true,
          tags: true,
          reviews: {
            select: {
              rating: true,
            },
          },
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem?.id;
      }

      const productsWithAvgRating = items.map(product => {
        const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
        const avgRating = product.reviews.length ? totalRating / product.reviews.length : 0;
        
        return {
          ...product,
          avgRating,
        };
      });

      return {
        items: productsWithAvgRating,
        nextCursor,
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUnique({
        where: { id: input.id },
        include: {
          categories: true,
          tags: true,
          reviews: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      if (!product) {
        throw new Error("Product not found");
      }

      const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
      const avgRating = product.reviews.length ? totalRating / product.reviews.length : 0;

      return {
        ...product,
        avgRating,
      };
    }),
    
  // Additional methods for product management...
});
```

### 5. Scent Quiz Component

```tsx
// src/components/quiz/ScentQuiz.tsx
import { useState } from "react";
import { api } from "~/utils/api";
import { ProductCard } from "~/components/products/ProductCard";
import { Button } from "~/components/ui/Button";
import { LoadingSpinner } from "~/components/ui/LoadingSpinner";

export const ScentQuiz = () => {
  const { data: questions, isLoading: isLoadingQuestions } = api.quiz.getQuestions.useQuery();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Array<{ questionId: string; answer: string }>>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  
  const submitResponses = api.quiz.submitResponse.useMutation({
    onSuccess: () => {
      setQuizCompleted(true);
    },
  });
  
  if (isLoadingQuestions) {
    return <LoadingSpinner />;
  }
  
  if (!questions || questions.length === 0) {
    return <div>No quiz questions available.</div>;
  }
  
  const currentQuestion = questions[currentStep];
  const options = currentQuestion?.options as Array<{ label: string; value: string }>;
  
  const handleOptionSelect = (value: string) => {
    const newResponses = [...responses];
    newResponses[currentStep] = {
      questionId: currentQuestion.id,
      answer: value,
    };
    setResponses(newResponses);
    
    // Move to next question or submit
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      submitResponses.mutate({ responses: newResponses });
    }
  };
  
  if (quizCompleted) {
    return (
      <div className="animate-fadeIn">
        <h2 className="mb-6 text-2xl font-bold text-center text-gray-900 dark:text-white">
          Your Personalized Recommendations
        </h2>
        {submitResponses.data?.recommendedProducts.length ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {submitResponses.data.recommendedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600 dark:text-gray-400">
            We couldn't find perfect matches for your preferences. 
            Try our featured products instead!
          </p>
        )}
        <div className="mt-8 text-center">
          <Button onClick={() => {
            setCurrentStep(0);
            setResponses([]);
            setQuizCompleted(false);
          }}>
            Take Quiz Again
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center">
          {questions.map((_, index) => (
            <div key={index} className="flex-1">
              <div
                className={`h-2 rounded ${
                  index <= currentStep 
                    ? "bg-primary dark:bg-primary-light" 
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 text-sm text-center text-gray-500 dark:text-gray-400">
          Question {currentStep + 1} of {questions.length}
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 transition-all">
        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
          {currentQuestion.question}
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleOptionSelect(option.value)}
              className="flex flex-col items-center p-4 border-2 rounded-lg transition-all hover:border-primary hover:bg-primary/5 dark:hover:bg-primary-dark/10 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700"
            >
              <span className="text-lg font-medium text-gray-900 dark:text-white">
                {option.label}
              </span>
            </button>
          ))}
        </div>
        
        {currentStep > 0 && (
          <div className="mt-6 text-center">
            <Button
              variant="secondary"
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              Previous Question
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
```

### 6. Shopping Cart Context

```tsx
// src/contexts/CartContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  total: number;
}

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [items, setItems] = useState<CartItem[]>([]);
  
  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Failed to parse cart from localStorage:", error);
      }
    }
  }, []);
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);
  
  const addItem = (item: CartItem) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id);
      
      if (existingItem) {
        // Update quantity if item already exists
        return prevItems.map((i) =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      } else {
        // Add new item
        return [...prevItems, item];
      }
    });
  };
  
  const removeItem = (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };
  
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };
  
  const clearCart = () => {
    setItems([]);
  };
  
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);
  
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  
  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
```

### 7. TailwindCSS Configuration

```js
// tailwind.config.ts
import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2a7c8a",
          light: "#4fd1c5",
          dark: "#1a5b68",
        },
        accent: {
          DEFAULT: "#e0a86f",
          light: "#f6ad55",
          dark: "#c67c3e",
        },
        cta: {
          DEFAULT: "#ff7b4f",
          light: "#ff8c69",
          dark: "#e25c39",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-in-out",
        slideInRight: "slideInRight 0.5s ease-in-out",
        slideInLeft: "slideInLeft 0.5s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
} satisfies Config;
```

### 8. Home Page with Interactive Features

```tsx
// src/pages/index.tsx
import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useRef, useEffect, useState } from "react";
import { api } from "~/utils/api";
import { Button } from "~/components/ui/Button";
import { AudioToggle } from "~/components/ui/AudioToggle";
import { ProductGrid } from "~/components/products/ProductGrid";
import { TestimonialCarousel } from "~/components/TestimonialCarousel";
import { NewsletterForm } from "~/components/NewsletterForm";

const Home: NextPage = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  
  // Fetch featured products
  const { data: featuredProducts } = api.products.getAll.useQuery({
    featured: true,
    limit: 4,
  });
  
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  // Calculate parallax effect for hero section
  const heroOpacity = Math.max(0, Math.min(1, 1 - scrollY / 700));
  const heroTransform = `translateY(${scrollY * 0.5}px)`;
  
  // Calculate parallax effect for about section images
  const aboutParallax = scrollY - (aboutRef.current?.offsetTop ?? 0) + 300;
  const aboutImageTransform1 = `translateY(${aboutParallax * 0.1}px)`;
  const aboutImageTransform2 = `translateY(${aboutParallax * -0.05}px)`;
  
  return (
    <>
      <Head>
        <title>The Scent | Signature Aromatherapy & Wellness</title>
        <meta
          name="description"
          content="Discover handcrafted aromatherapy products for wellness and self-care."
        />
      </Head>
      
      {/* Hero Section with Video Background */}
      <div
        ref={heroRef}
        className="relative h-screen overflow-hidden"
      >
        <div
          className="absolute inset-0 z-0"
          style={{
            opacity: heroOpacity,
            transform: heroTransform,
          }}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover"
          >
            <source src="/videos/hero-bg.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/20 dark:bg-black/40" />
        </div>
        
        <div className="absolute right-4 top-4 z-50">
          <AudioToggle />
        </div>
        
        <div className="container relative z-10 mx-auto flex h-full items-center px-4">
          <div className="max-w-2xl animate-fadeIn">
            <h1 className="mb-4 text-4xl font-bold text-white drop-shadow-lg md:text-6xl">
              Discover Your Perfect Scent
            </h1>
            <p className="mb-8 text-lg text-white drop-shadow-md md:text-xl">
              Handcrafted aromatherapy products for wellness and self-care.
              Experience the transformative power of nature.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button href="/products" size="lg">
                Shop Collection
              </Button>
              <Button href="/quiz" variant="secondary" size="lg">
                Take Scent Quiz
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* About Section with Parallax Images */}
      <section
        id="about"
        ref={aboutRef}
        className="py-20"
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <div className="order-2 md:order-1">
              <h2 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
                Our Story
              </h2>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                The Scent was born from a deep passion for aromatherapy and
                natural wellness. Our founder, after years of struggling with
                stress and anxiety, discovered the transformative power of
                essential oils and aromatherapy.
              </p>
              <p className="mb-6 text-gray-700 dark:text-gray-300">
                We believe in the power of scent to transform mood, enhance
                wellbeing, and create moments of tranquility in our busy lives.
              </p>
              <Button href="/about">Learn More About Us</Button>
            </div>
            
            <div className="relative order-1 h-[500px] md:order-2">
              <div
                className="absolute left-0 top-0 h-64 w-48 overflow-hidden rounded-lg md:h-72 md:w-56"
                style={{ transform: aboutImageTransform1 }}
              >
                <Image
                  src="/images/about-1.jpg"
                  alt="Handcrafting process"
                  fill
                  className="object-cover"
                />
              </div>
              <div
                className="absolute bottom-0 right-0 h-64 w-48 overflow-hidden rounded-lg md:h-72 md:w-56"
                style={{ transform: aboutImageTransform2 }}
              >
                <Image
                  src="/images/about-2.jpg"
                  alt="Natural ingredients"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Featured Products Section */}
      <section className="bg-gradient-to-r from-primary/5 to-accent/5 py-20 dark:from-primary-dark/10 dark:to-accent-dark/10">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Featured Products
            </h2>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Our most popular aromatherapy creations
            </p>
          </div>
          
          {featuredProducts?.items && (
            <ProductGrid products={featuredProducts.items} />
          )}
          
          <div className="mt-12 text-center">
            <Button href="/products">View All Products</Button>
          </div>
        </div>
      </section>
      
      {/* Remaining sections... */}
    </>
  );
};

export default Home;
```

## Setup Instructions

Here's how to set up your T3 app with PostgreSQL:

1. Create a `.env` file with your PostgreSQL connection string:

```
DATABASE_URL="postgresql://username:password@localhost:5432/the-scent"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

2. Initialize and push your database schema:

```bash
npx prisma db push
```

3. Seed your database with initial data (you'll need to create a seed script):

```bash
npx prisma db seed
```

4. Start the development server:

```bash
npm run dev
```

## Key Features Implemented

1. **Authentication** - User login and registration with NextAuth.js
2. **Product Management** - Product listing, filtering, and details
3. **Interactive Quiz** - Personalized product recommendations
4. **Shopping Cart** - Add/remove items with localStorage persistence
5. **Theme Switching** - Dark/light mode toggle
6. **Ambient Audio** - Background sound toggle for immersive experience
7. **Responsive Design** - Mobile-first approach with TailwindCSS
8. **Parallax Effects** - Dynamic scrolling animations
9. **PostgreSQL Database** - Persisting user data, products, orders, etc.

## Database Structure

The database includes tables for:
- Users (customers and admins)
- Products with categories and tags
- Orders and order items
- Reviews and ratings
- Quiz questions and responses
- Newsletter subscribers

Would you like me to explain any specific part of the implementation in more detail?
