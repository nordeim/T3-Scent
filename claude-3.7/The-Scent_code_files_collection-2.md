# src/app/collections/[slug]/page.tsx
```tsx
// src/app/collections/[slug]/page.tsx
import { type Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductGrid } from "~/components/products/ProductGrid";
import { createServerActionClient } from "~/trpc/server";
import { env } from "~/env.js";

interface CollectionPageProps {
  params: { slug: string };
  searchParams?: { 
    page?: string;
    sortBy?: string;
  };
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const slug = params.slug; 
  
  const collectionNameFromSlug = slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  const title = `${collectionNameFromSlug} Collection - The Scent`;
  const description = `Discover our exclusive ${collectionNameFromSlug} collection, featuring unique aromatherapy products.`;

  return {
    title,
    description,
    metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
    openGraph: {
      title,
      description,
      url: `${env.NEXT_PUBLIC_SITE_URL}/collections/${slug}`,
    },
  };
}

export default async function CollectionPage({ params, searchParams }: CollectionPageProps) {
  const slug = params.slug; 
  const pageParam = searchParams?.page; 
  const sortByParam = searchParams?.sortBy;

  const serverApi = await createServerActionClient();
  
  // const currentPage = parseInt(pageParam || "1"); // Not used in current API call
  const limit = 12; 

  let productsData;
  let collectionName = slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  let collectionDescription = `Browse through the finest items in our ${collectionName} selection.`;

  // Placeholder: If you have a `serverApi.collections.getBySlug` procedure, you could use it here.
  // try {
  //   const collectionDetails = await serverApi.collections.getBySlug({ slug }); 
  //   if (!collectionDetails) notFound();
  //   collectionName = collectionDetails.name;
  //   collectionDescription = collectionDetails.description || collectionDescription;
  // } catch (error) {
  //   console.error(`Error fetching collection details for ${slug}:`, error);
  //   // Handle error, potentially call notFound()
  // }

  try {
    productsData = await serverApi.products.getAll({
      collectionSlug: slug,
      limit,
      sortBy: sortByParam as any,
    });
  } catch (error) {
    console.error(`Error fetching products for collection ${slug}:`, error);
    productsData = { items: [], nextCursor: undefined }; 
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="mb-8 md:mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {collectionName}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          {collectionDescription}
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <aside className="lg:col-span-1 lg:sticky lg:top-24 self-start">
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-foreground mb-4">Refine This Collection</h2>
                <p className="text-sm text-muted-foreground">(Filters specific to this collection - Placeholder)</p>
                 <ul className="space-y-1.5 text-sm mt-4">
                    <li><Link href={`/collections/${slug}?sortBy=createdAt_desc`} className="text-muted-foreground hover:text-primary transition-colors">Newest</Link></li>
                    <li><Link href={`/collections/${slug}?sortBy=price_asc`} className="text-muted-foreground hover:text-primary transition-colors">Price: Low to High</Link></li>
                    <li><Link href={`/collections/${slug}?sortBy=price_desc`} className="text-muted-foreground hover:text-primary transition-colors">Price: High to Low</Link></li>
                </ul>
            </div>
        </aside>
        <main className="lg:col-span-3">
            {productsData.items.length > 0 ? (
                <ProductGrid products={productsData.items} />
            ) : (
                <div className="py-16 text-center">
                <p className="text-xl text-muted-foreground">
                    No products currently in this collection. Check back soon!
                </p>
                </div>
            )}
            {/* TODO: Add Pagination controls here */}
        </main>
      </div>
    </div>
  );
}
```

# src/app/_components/post.tsx
```tsx
"use client";

import { useState } from "react";

import { api } from "~/trpc/react";

export function LatestPost() {
  const [latestPost] = api.post.getLatest.useSuspenseQuery();

  const utils = api.useUtils();
  const [name, setName] = useState("");
  const createPost = api.post.create.useMutation({
    onSuccess: async () => {
      await utils.post.invalidate();
      setName("");
    },
  });

  return (
    <div className="w-full max-w-xs">
      {latestPost ? (
        <p className="truncate">Your most recent post: {latestPost.name}</p>
      ) : (
        <p>You have no posts yet.</p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createPost.mutate({ name });
        }}
        className="flex flex-col gap-2"
      >
        <input
          type="text"
          placeholder="Title"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-full bg-white/10 px-4 py-2 text-white"
        />
        <button
          type="submit"
          className="rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
          disabled={createPost.isPending}
        >
          {createPost.isPending ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}

```

# src/app/api/auth/[...nextauth]/route.ts
```ts
// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "~/server/auth"; // Import the handlers

// Export the handlers for GET and POST requests as required by NextAuth.js v5 with App Router
export const { GET, POST } = handlers;
```

# src/app/api/trpc/[trpc]/route.ts
```ts
// src/app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";

import { env } from "~/env.mjs";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request via fetch.
 */
const createContext = async (req: NextRequest) => {
  return createTRPCContext({
    headers: req.headers,
    // Note: In App Router Route Handlers, `req` is a NextRequest, not Node's http.IncomingMessage.
    // `createTRPCContext` from Pages Router expected `req` and `res` from `CreateNextContextOptions`.
    // This needs to be adapted if `createTRPCContext` specifically uses Node.js req/res properties not available here.
    // For session, `getServerAuthSession` should work if cookies are forwarded correctly.
    // A common pattern for App Router tRPC context:
    // req: req as any, // Cast if createTRPCContext expects Node req/res
    // res: undefined as any, 
  });
};

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req), // Pass the NextRequest to the context creator
    onError:
      env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };
```

# src/app/gift-cards/page.tsx
```tsx
// src/app/gift-cards/page.tsx
import { type Metadata } from "next";
import Image from "next/image";
import Link from "next/link"; // Ensured Link is imported
import { Button } from "~/components/ui/Button"; 

export const metadata: Metadata = {
  title: "Gift Cards - The Scent",
  description: "Give the gift of choice with The Scent gift cards. Perfect for any occasion.",
};

export default function GiftCardsPage() {
  const giftCardOptions = [
    // NOTE: For these images to load, ensure files like 'public/images/gift_card_25.jpg' exist.
    // If they are missing, you will see 404 errors for these images.
    { amount: 25, imageUrl: "/images/gift_card_25.jpg", altText: "A beautifully designed $25 The Scent gift card" }, 
    { amount: 50, imageUrl: "/images/gift_card_50.jpg", altText: "A beautifully designed $50 The Scent gift card" },
    { amount: 100, imageUrl: "/images/gift_card_100.jpg", altText: "A beautifully designed $100 The Scent gift card" },
    { amount: 200, imageUrl: "/images/gift_card_200.jpg", altText: "A beautifully designed $200 The Scent gift card" },
  ];

  return (
    <div className="container mx-auto min-h-[calc(100vh-theme(space.32))] px-4 py-12 md:py-16">
      <header className="mb-10 md:mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl font-head">
          The Scent Gift Cards
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto font-body">
          Share the gift of tranquility and well-being. Our gift cards are perfect for any occasion and let your loved ones choose their favorite scents.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {giftCardOptions.map((option) => (
          <div key={option.amount} className="rounded-lg border border-border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col group transition-all hover:shadow-xl hover:transform hover:-translate-y-1">
            <div className="relative aspect-video w-full overflow-hidden">
              <Image 
                src={option.imageUrl} 
                alt={option.altText} 
                fill 
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            </div>
            <div className="p-6 flex flex-col flex-grow">
              <h2 className="text-2xl font-semibold text-foreground font-head">${option.amount} Gift Card</h2>
              <p className="text-sm text-muted-foreground mt-2 mb-4 flex-grow font-body">
                Redeemable for any product on our store. Delivered instantly by email with instructions.
              </p>
              <Button className="w-full mt-auto font-accent">
                Purchase ${option.amount} Card
              </Button>
            </div>
          </div>
        ))}
      </div>

      <section className="mt-16 md:mt-24 text-center max-w-3xl mx-auto bg-muted/50 dark:bg-card p-8 rounded-lg shadow">
        <h2 className="text-2xl font-semibold text-foreground font-head mb-6">How It Works</h2>
        <ol className="space-y-4 text-muted-foreground text-left font-body list-decimal list-inside">
          <li>Choose your desired gift card amount and complete your purchase.</li>
          <li>You'll instantly receive an email containing the unique gift card code.</li>
          <li>Forward the email or share the code with your lucky recipient.</li>
          <li>They can redeem it at checkout to experience the world of The Scent!</li>
        </ol>
        <p className="mt-8 text-sm text-muted-foreground font-body">
          Our gift cards are non-refundable and do not expire. 
          For any questions, please don't hesitate to <Link href="/contact" className="text-primary hover:underline font-semibold">contact our support team</Link>.
        </p>
      </section>
    </div>
  );
}
```

# src/app/about/page.tsx
```tsx
// src/app/about/page.tsx
import { type Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About Us - The Scent",
  description: "Learn about the mission, values, and story behind The Scent and our commitment to natural wellness.",
};

export default function AboutPage() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 bg-primary/10 dark:bg-primary-dark/20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Our Journey with Scent
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground">
            Discover the passion, philosophy, and people behind The Scent's commitment to natural well-being through aromatherapy.
          </p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight mb-4">The Essence of The Scent</h2>
              <p className="text-muted-foreground mb-4">
                Founded on the belief that nature holds the key to true wellness, The Scent began as a personal exploration into the healing power of aromatherapy. What started as a quest for balance and tranquility in a fast-paced world blossomed into a mission: to share the purest, most effective botanical essences with others.
              </p>
              <p className="text-muted-foreground mb-4">
                We meticulously source our ingredients from ethical growers around the globe, ensuring that every drop of essential oil and every handcrafted product meets our exacting standards for purity and potency. Our blends are artfully composed, not just for their delightful aromas, but for their ability to soothe, uplift, and rejuvenate.
              </p>
              <p className="text-muted-foreground">
                At The Scent, we're more than just a brand; we're a community dedicated to mindful living and the profound connection between scent and well-being.
              </p>
            </div>
            <div className="relative h-80 md:h-96 rounded-lg overflow-hidden shadow-xl">
              <Image 
                src="/images/about-team-placeholder.jpg" // Replace with actual image in public/images
                alt="The Scent team or founder placeholder" 
                fill 
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold tracking-tight">Our Core Values</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Guiding principles that shape every product and interaction at The Scent.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-card rounded-lg shadow-sm">
              {/* Placeholder Icon */} <span className="text-3xl text-primary">🌿</span>
              <h3 className="text-xl font-semibold mt-4 mb-2">Purity & Quality</h3>
              <p className="text-sm text-muted-foreground">Sourcing the finest natural ingredients, rigorously tested for authenticity and efficacy.</p>
            </div>
            <div className="text-center p-6 bg-card rounded-lg shadow-sm">
              {/* Placeholder Icon */} <span className="text-3xl text-primary">🌍</span>
              <h3 className="text-xl font-semibold mt-4 mb-2">Ethical & Sustainable</h3>
              <p className="text-sm text-muted-foreground">Committed to responsible sourcing, eco-friendly packaging, and cruelty-free practices.</p>
            </div>
            <div className="text-center p-6 bg-card rounded-lg shadow-sm">
              {/* Placeholder Icon */} <span className="text-3xl text-primary">💡</span>
              <h3 className="text-xl font-semibold mt-4 mb-2">Mindful Craftsmanship</h3>
              <p className="text-sm text-muted-foreground">Thoughtfully formulating blends that support holistic well-being and sensory delight.</p>
            </div>
          </div>
        </div>
      </section>
      {/* Add more sections as needed: Our Team, Our Process, Community Involvement, etc. */}
    </div>
  );
}
```

# src/app/faq/page.tsx
```tsx
// src/app/faq/page.tsx
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ - The Scent",
  description: "Find answers to frequently asked questions about our products, shipping, and policies.",
};

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-10 text-center">
          Frequently Asked Questions
        </h1>
        
        <div className="space-y-8">
          {/* Question 1 */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">What are essential oils?</h2>
            <p className="text-muted-foreground">
              Essential oils are concentrated plant extracts that retain the natural smell and flavor, or "essence," of their source. They are obtained through distillation (via steam and/or water) or mechanical methods, such as cold pressing...
            </p>
          </div>

          {/* Question 2 */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">How do I use essential oils safely?</h2>
            <p className="text-muted-foreground">
              Always dilute essential oils with a carrier oil before applying to the skin. Perform a patch test first. Keep out of reach of children and pets. Some oils are not safe during pregnancy or for certain medical conditions. Consult a healthcare professional if unsure...
            </p>
          </div>
          
          {/* Add more questions and answers */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">What is your shipping policy?</h2>
            <p className="text-muted-foreground">
              We offer standard shipping (3-5 business days) and express shipping (1-2 business days). Orders over $50 qualify for free standard shipping... For more details, please visit our <a href="/shipping-returns" className="text-primary hover:underline">Shipping & Returns</a> page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

# src/app/HomePageClientInteractions.tsx
```tsx
// src/app/HomePageClientInteractions.tsx
"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";
// import Image from "next/image"; // Not directly used here for rendering, but parent might.
import { AudioToggle } from "~/components/ui/AudioToggle"; // Import AudioToggle
import type { RouterOutputs } from "~/utils/api";

interface HomePageClientInteractionsProps {
  children: ReactNode; // Static hero content passed from Server Component
  // featuredProducts are fetched by parent, passed if this component needs them, but not used in this version.
  // featuredProducts: RouterOutputs["products"]["getAll"]["items"]; 
}

export default function HomePageClientInteractions({ children }: HomePageClientInteractionsProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [isMounted, setIsMounted] = useState(false); // For AudioToggle or other client-only elements

  useEffect(() => {
    setIsMounted(true); // Component has mounted on client
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const heroOpacity = isMounted ? Math.max(0.2, Math.min(1, 1 - scrollY / 700)) : 1; // Ensure some visibility initially
  const heroTransform = `translateY(${isMounted ? scrollY * 0.4 : 0}px)`; // Reduced parallax factor

  return (
    <>
      <div ref={heroRef} className="relative h-screen overflow-hidden bg-gray-900"> {/* Added bg for video load fallback */}
        <div
          className="absolute inset-0 z-0 transition-opacity duration-300" // Added transition
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
            poster="/images/hero-poster.jpg" // Ensure this poster image exists in /public/images
          >
            <source src="/videos/hero-bg.mp4" type="video/mp4" /> {/* Ensure this video exists */}
            Your browser does not support the video tag.
          </video>
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60" /> {/* Darker overlay */}
        </div>
        
        {/* AudioToggle positioned within the hero */}
        {isMounted && ( // Only render AudioToggle on the client after mount
          <div className="absolute right-4 top-4 z-50 md:right-6 md:top-6">
            <AudioToggle audioSrc="/sounds/ambient-nature.mp3" /> {/* Ensure sound file exists */}
          </div>
        )}
        
        {/* Render children (static hero text content) passed from Server Component */}
        {/* The children (text content) will also appear to have parallax due to parent transform */}
        <div className="relative z-10 flex h-full items-center justify-center text-center md:justify-start md:text-left">
            {children}
        </div>
      </div>
    </>
  );
}
```

# src/app/quiz/AdvancedScentQuizClient.tsx
```tsx
// src/app/quiz/AdvancedScentQuizClient.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { api as clientApi } from "~/trpc/react"; // Use clientApi for client-side tRPC
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "~/components/ui/Card"; // Assuming these exist from Shadcn/ui pattern
import { Progress } from "~/components/ui/Progress";
import { RadioGroup, RadioGroupItem } from "~/components/ui/RadioGroup"; // Assuming RadioGroupItem from Shadcn/ui
import { Checkbox } from "~/components/ui/Checkbox"; // Assuming Checkbox from Shadcn/ui
import { Label } from "~/components/ui/Label";
import { ProductGrid } from "~/components/products/ProductGrid";
import { EmptyState } from "~/components/ui/EmptyState"; // Assuming EmptyState component
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowRight, FaArrowLeft, FaMagic, FaRegLightbulb, FaCheck, FaStar, FaSpinner, FaImage } from "react-icons/fa";
import Image from "next/image";
import { cn } from "~/lib/utils";
import type { AdvancedQuizQuestionClient, AdvancedQuizQuestionOption } from "~/server/api/routers/quiz"; // Import types

export default function AdvancedScentQuizClient() {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, string[]>>({}); // questionId -> array of selected option IDs/values
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizSessionId, setQuizSessionId] = useState<string | undefined>(undefined);
  
  const [personalityProfile, setPersonalityProfile] = useState<{
    type: string;
    description: string;
    traits: string[];
  } | null>(null);

  const { data: questions, isLoading: isLoadingQuestions, error: questionsError } = 
    clientApi.quiz.getAdvancedQuizQuestions.useQuery(undefined, {
      staleTime: Infinity, // Quiz questions don't change often
      cacheTime: Infinity,
    });

  const submitResponsesMutation = clientApi.quiz.submitQuizResponses.useMutation();
  const getRecommendationsMutation = clientApi.recommendations.getQuizRecommendations.useMutation({
    onSuccess: (data) => {
      // Assuming getQuizRecommendations returns products and personality
      // This is simplified, actual data structure from recommendationsRouter.getQuizRecommendations will dictate this
      if (data.personality) {
        setPersonalityProfile(data.personality as any); // Cast if type is complex
      }
      setQuizCompleted(true); // Mark quiz as completed to show results
    },
    onError: (error) => {
      toast.error(`Could not get recommendations: ${error.message}`);
      setQuizCompleted(true); // Still mark as completed to show at least an error or fallback
    },
  });
  
  useEffect(() => {
    if (!session?.user) {
      // Generate a simple session ID for anonymous users to group their responses if needed
      let localQuizSessionId = localStorage.getItem("quizSessionId");
      if (!localQuizSessionId) {
        localQuizSessionId = `anon-quiz-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem("quizSessionId", localQuizSessionId);
      }
      setQuizSessionId(localQuizSessionId);
    }
  }, [session]);

  const currentQuestion: AdvancedQuizQuestionClient | undefined = questions?.[currentStep];

  const handleOptionSelect = (questionId: string, optionId: string) => {
    if (!currentQuestion) return;
    const isMultipleChoice = currentQuestion.type === "multiple";
    
    setResponses(prev => {
      const currentSelection = prev[questionId] || [];
      let newSelection: string[];

      if (isMultipleChoice) {
        if (currentSelection.includes(optionId)) {
          newSelection = currentSelection.filter(id => id !== optionId);
        } else {
          newSelection = [...currentSelection, optionId];
        }
      } else {
        newSelection = [optionId]; // Single choice replaces previous
      }
      return { ...prev, [questionId]: newSelection };
    });
  };

  const isOptionSelected = (questionId: string, optionId: string) => {
    return (responses[questionId] || []).includes(optionId);
  };

  const canProceed = useMemo(() => {
    if (!currentQuestion) return false;
    return (responses[currentQuestion.id] || []).length > 0;
  }, [responses, currentQuestion]);

  const handleSubmitQuiz = async () => {
    if (!questions) return;
    const formattedResponses = questions.map(q => ({
        questionId: q.id,
        answer: responses[q.id] || [], // Send empty array if no answer for a question (should not happen if 'canProceed' is used)
    }));

    try {
      // First, submit the raw responses
      await submitResponsesMutation.mutateAsync({
        responses: formattedResponses,
        sessionId: quizSessionId,
      });
      toast.success("Quiz responses saved!");

      // Then, get recommendations based on these responses
      // The getQuizRecommendations mutation also saves responses as per design_document_2,
      // this might need reconciliation. For now, assuming it can take raw responses.
      // It's better if getQuizRecommendations takes a quizAttemptId or (userId/sessionId)
      // and fetches stored responses itself. This example passes responses directly.
      const recommendationInputResponses = formattedResponses.map(r => ({
        questionId: r.questionId,
        answer: r.answer.join(','), // recommendationsRouter expects comma-separated string for multi-answers
      }));

      getRecommendationsMutation.mutate({
        responses: recommendationInputResponses,
        sessionId: quizSessionId,
      });

    } catch (error) {
      console.error("Error submitting quiz or getting recommendations:", error);
      toast.error("Something went wrong. Please try again.");
      // Don't setQuizCompleted(true) on storage error, let user retry submit?
      // Or, if recommendations fail but storage succeeded, still show some message.
    }
  };

  const handleNextStep = () => {
    if (questions && currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmitQuiz();
    }
  };
  
  const handlePreviousStep = () => setCurrentStep(prev => Math.max(0, prev - 1));
  const handleRetakeQuiz = () => {
    setCurrentStep(0);
    setResponses({});
    setQuizCompleted(false);
    setPersonalityProfile(null);
    // Optionally clear previous responses for this session/user from DB if desired
  };

  if (isLoadingQuestions) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
        <FaSpinner className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Crafting your scent journey...</p>
      </div>
    );
  }

  if (questionsError || !questions || questions.length === 0) {
    return (
      <EmptyState
        icon={<FaRegLightbulb className="h-12 w-12 text-muted-foreground" />}
        title="Scent Quiz Temporarily Unavailable"
        description={questionsError?.message || "We're fine-tuning our scent discovery experience. Please check back soon or explore our collections."}
        action={<Button onClick={() => router.push("/products")}>Browse Products</Button>}
      />
    );
  }

  // Quiz Completed View
  if (quizCompleted || getRecommendationsMutation.isSuccess || getRecommendationsMutation.isError) {
    const recommendedProducts = getRecommendationsMutation.data?.recommendedProducts || [];
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="text-center">
          <FaMagic className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-foreground mb-2">Your Scent Profile & Recommendations</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Based on your preferences, here's what we've discovered for you!
          </p>
        </div>

        {personalityProfile && (
          <Card className="overflow-hidden shadow-lg">
            <CardHeader className="bg-primary/10 dark:bg-primary-dark/20">
              <CardTitle className="text-2xl flex items-center gap-2"><FaStar /> Your Scent Personality: {personalityProfile.type}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-3">{personalityProfile.description}</p>
              <div className="flex flex-wrap gap-2">
                {personalityProfile.traits.map((trait, idx) => (
                  <span key={idx} className="px-2 py-0.5 text-xs rounded-full bg-secondary/20 text-secondary-foreground">{trait}</span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {getRecommendationsMutation.isLoading && (
            <div className="text-center p-8"><FaSpinner className="h-8 w-8 animate-spin text-primary mx-auto mb-2" /> Fetching recommendations...</div>
        )}
        {getRecommendationsMutation.isError && (
            <p className="text-center text-destructive">Could not load recommendations: {getRecommendationsMutation.error.message}</p>
        )}
        {getRecommendationsMutation.isSuccess && recommendedProducts.length > 0 && (
          <ProductGrid products={recommendedProducts as any} /> // Cast if type mismatch after processing
        )}
        {getRecommendationsMutation.isSuccess && recommendedProducts.length === 0 && (
          <p className="text-center text-muted-foreground py-8">We found some interesting insights from your quiz, but no specific product recommendations matched perfectly this time. Explore our <Link href="/products" className="text-primary hover:underline">full collection</Link>!</p>
        )}

        <div className="text-center pt-6">
          <Button onClick={handleRetakeQuiz} variant="outline" size="lg">
            Retake Quiz
          </Button>
        </div>
      </div>
    );
  }

  // Quiz In Progress View
  if (!currentQuestion) return null; // Should be caught by loading/error states
  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between text-sm text-muted-foreground mb-1">
          <span>Question {currentStep + 1} of {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: currentStep > 0 ? 50 : -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl">{currentQuestion.question}</CardTitle>
              {currentQuestion.description && <CardDescription className="text-md pt-2">{currentQuestion.description}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-4">
              {currentQuestion.type === "single" ? (
                <RadioGroup
                  value={(responses[currentQuestion.id]?.[0]) || ""}
                  onValueChange={(value) => handleOptionSelect(currentQuestion.id, value)}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  {currentQuestion.options.map((option) => (
                    <Label 
                        key={option.id}
                        htmlFor={`q${currentQuestion.id}-opt${option.id}`}
                        className={cn(
                            "flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all hover:border-primary",
                            isOptionSelected(currentQuestion.id, option.id) ? "border-primary bg-primary/5" : "border-border"
                        )}
                    >
                      <RadioGroupItem value={option.id} id={`q${currentQuestion.id}-opt${option.id}`} className="sr-only" />
                      {option.imageUrl && <div className="relative w-full h-32 mb-2 rounded overflow-hidden"><Image src={option.imageUrl} alt={option.label} fill className="object-cover"/></div>}
                      {!option.imageUrl && option.label.length < 20 && <div className="text-4xl mb-2"><FaImage /></div> /* Placeholder for text options */}
                      <span className="text-center font-medium text-foreground">{option.label}</span>
                      {option.description && <span className="text-xs text-center text-muted-foreground mt-1">{option.description}</span>}
                    </Label>
                  ))}
                </RadioGroup>
              ) : ( // Multiple choice
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentQuestion.options.map((option) => (
                    <Label 
                        key={option.id}
                        htmlFor={`q${currentQuestion.id}-opt${option.id}`}
                        className={cn(
                            "flex items-start space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all hover:border-primary",
                            isOptionSelected(currentQuestion.id, option.id) ? "border-primary bg-primary/5" : "border-border"
                        )}
                    >
                      <Checkbox
                        id={`q${currentQuestion.id}-opt${option.id}`}
                        checked={isOptionSelected(currentQuestion.id, option.id)}
                        onCheckedChange={() => handleOptionSelect(currentQuestion.id, option.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        {option.imageUrl && <div className="relative w-full h-32 mb-2 rounded overflow-hidden"><Image src={option.imageUrl} alt={option.label} fill className="object-cover"/></div>}
                        <span className="font-medium text-foreground">{option.label}</span>
                        {option.description && <p className="text-xs text-muted-foreground">{option.description}</p>}
                      </div>
                    </Label>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between pt-6">
              <Button variant="outline" onClick={handlePreviousStep} disabled={currentStep === 0}>
                <FaArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <Button onClick={handleNextStep} disabled={!canProceed() || submitResponsesMutation.isPending || getRecommendationsMutation.isPending} isLoading={submitResponsesMutation.isPending || getRecommendationsMutation.isPending}>
                {currentStep === questions.length - 1 ? "Find My Scents" : "Next"}
                <FaArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
```

# src/app/quiz/page.tsx
```tsx
// src/app/quiz/page.tsx
import { type Metadata } from "next";
import AdvancedScentQuizClient from "./AdvancedScentQuizClient"; // Wrapper client component

export const metadata: Metadata = {
  title: "Scent Quiz",
  description: "Discover your perfect scent profile with our interactive quiz.",
};

export default function QuizPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="mx-auto max-w-3xl text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Find Your Signature Scent</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Answer a few simple questions and let us curate personalized aromatherapy recommendations just for you.
        </p>
      </div>
      <AdvancedScentQuizClient />
    </div>
  );
}
```

# src/components/layout/Footer.tsx
```tsx
// src/components/layout/Footer.tsx
"use client"; 

import Link from "next/link";
import React from "react";
import { FaFacebookF, FaInstagram, FaTwitter } from 'react-icons/fa';
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { api as clientApi } from "~/trpc/react"; // For newsletter submission
import { toast } from "react-hot-toast";
import { cn } from "~/lib/utils";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const newsletterMutation = clientApi.newsletter.subscribe.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "Successfully subscribed!");
      // e.currentTarget.reset(); // Cannot access form directly here
    },
    onError: (error) => {
      toast.error(error.message || "Subscription failed. Please try again.");
    },
  });

  const handleNewsletterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    newsletterMutation.mutate({ email });
    e.currentTarget.reset(); // Reset form after attempting submission
  };

  return (
    <footer className={cn(
        "bg-card text-card-foreground border-t border-border", // Use card as footer bg, similar to sample
        "dark:bg-background dark:text-foreground" // Dark mode specifics from sample_landing_page (darker footer)
    )}>
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-12 mb-10 md:mb-14">
          {/* Column 1: About/Brand */}
          <div className="sm:col-span-2 lg:col-span-1"> {/* Span 2 on small, 1 on large */}
            <Link href="/" className="inline-block mb-4">
              <span className="text-2xl font-bold font-head text-primary dark:text-primary">The Scent</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4 pr-4">
              Crafting natural aromatherapy experiences for your mind, body, and spirit. Inspired by nature's harmony.
            </p>
            <div className="flex space-x-4">
              <Link href="#" aria-label="Facebook" className="text-muted-foreground hover:text-primary transition-colors"><FaFacebookF size={18}/></Link>
              <Link href="#" aria-label="Instagram" className="text-muted-foreground hover:text-primary transition-colors"><FaInstagram size={18}/></Link>
              <Link href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary transition-colors"><FaTwitter size={18}/></Link>
            </div>
          </div>

          {/* Column 2: Shop Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase text-foreground tracking-wider mb-4 font-accent">Shop</h3>
            <ul className="space-y-2.5">
              <li><Link href="/products" className="text-sm text-muted-foreground hover:text-primary transition-colors">All Products</Link></li>
              <li><Link href="/collections/new-arrivals" className="text-sm text-muted-foreground hover:text-primary transition-colors">New Arrivals</Link></li>
              <li><Link href="/collections/best-sellers" className="text-sm text-muted-foreground hover:text-primary transition-colors">Best Sellers</Link></li>
              <li><Link href="/quiz" className="text-sm text-muted-foreground hover:text-primary transition-colors">Scent Quiz</Link></li>
              <li><Link href="/gift-cards" className="text-sm text-muted-foreground hover:text-primary transition-colors">Gift Cards</Link></li>
            </ul>
          </div>

          {/* Column 3: Customer Service */}
          <div>
            <h3 className="text-sm font-semibold uppercase text-foreground tracking-wider mb-4 font-accent">Support</h3>
            <ul className="space-y-2.5">
              <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link href="/faq" className="text-sm text-muted-foreground hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link href="/account/orders" className="text-sm text-muted-foreground hover:text-primary transition-colors">Order Tracking</Link></li>
              <li><Link href="/shipping-returns" className="text-sm text-muted-foreground hover:text-primary transition-colors">Shipping & Returns</Link></li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h3 className="text-sm font-semibold uppercase text-foreground tracking-wider mb-4 font-accent">Stay Connected</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Subscribe for wellness tips, new arrivals, and exclusive offers.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex items-center">
                <Input 
                    type="email" 
                    name="email" 
                    placeholder="Your email address" 
                    required
                    className="h-10 rounded-r-none focus-visible:ring-offset-0 !border-r-0 flex-1 min-w-0"
                    aria-label="Email for newsletter"
                />
                <Button 
                    type="submit" 
                    className="h-10 rounded-l-none"
                    aria-label="Subscribe to newsletter"
                    isLoading={newsletterMutation.isPending}
                    loadingText="Wait"
                >
                    Subscribe
                </Button>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">
                By subscribing, you agree to our <Link href="/privacy-policy" className="hover:text-primary underline">Privacy Policy</Link>.
            </p>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center md:flex md:justify-between md:items-center">
          <p className="text-sm text-muted-foreground mb-4 md:mb-0">
            &copy; {currentYear} The Scent LLC. All rights reserved.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/terms-of-service" className="text-xs text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="/privacy-policy" className="text-xs text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
```

# src/components/layout/Navbar.tsx
```tsx
// src/components/layout/Navbar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, type ReactNode } from "react";
import { FaBars, FaTimes, FaShoppingCart, FaUserCircle, FaMoon, FaSun, FaSignOutAlt } from "react-icons/fa";
import { Button } from "~/components/ui/Button";
import { ThemeToggle } from "~/components/ui/ThemeToggle";
import { useCart } from "~/contexts/CartContext";
import { cn } from "~/lib/utils";

const mainNavLinks = [
  { href: "/products", label: "All Products" },
  { href: "/collections/essential-oils", label: "Essential Oils" },
  { href: "/collections/diffusers", label: "Diffusers" },
  { href: "/quiz", label: "Scent Quiz" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact"},
];

interface UserNavLink {
    href: string;
    label: string;
    icon?: ReactNode;
}

const userNavLinks: UserNavLink[] = [
    { href: "/account/profile", label: "My Profile" },
    { href: "/account/orders", label: "My Orders" },
    { href: "/account/subscriptions", label: "My Subscriptions" },
    { href: "/account/wishlist", label: "My Wishlist" },
    { href: "/account/loyalty", label: "Rewards & Loyalty" },
];

export const Navbar = () => {
  const { data: session, status } = useSession();
  const { itemCount: cartItemCount, toggleCart } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/20 bg-background/80 shadow-sm backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 dark:bg-card/80 dark:border-border/30">
      <div className="container flex h-16 items-center sm:h-20">
        <div className="mr-4 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle mobile menu">
            {isMobileMenuOpen ? <FaTimes className="h-5 w-5" /> : <FaBars className="h-5 w-5" />}
          </Button>
        </div>

        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
            <span className="text-2xl font-bold text-foreground font-head">The Scent</span>
          </Link>
        </div>

        <nav className="hidden md:flex flex-1 items-center justify-center gap-6 lg:gap-8 text-sm">
          {mainNavLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="font-accent font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary text-[0.9rem]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className={cn("flex items-center space-x-2 sm:space-x-3", {"md:ml-auto": true } )}>
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={toggleCart} aria-label="Open cart" className="relative">
            <FaShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {cartItemCount}
              </span>
            )}
          </Button>

          {status === "loading" && ( <div className="h-9 w-20 rounded-md bg-muted animate-pulse"></div> )}
          {status === "unauthenticated" && ( <Button onClick={() => signIn()} variant="outline" size="sm">Sign In</Button> )}
          {status === "authenticated" && session?.user && (
            <div className="relative group">
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 sm:h-10 sm:w-10">
                {session.user.image ? (
                  <Image src={session.user.image} alt={session.user.name || "User"} width={36} height={36} className="rounded-full" />
                ) : ( <FaUserCircle className="h-6 w-6 text-muted-foreground" /> )}
              </Button>
              <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-popover text-popover-foreground shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible focus-within:opacity-100 focus-within:visible transition-all duration-150 ease-out"
                   role="menu" aria-orientation="vertical">
                <div className="py-1" role="none">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold truncate">{session.user.name || "Valued Customer"}</p>
                    <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                  </div>
                  {userNavLinks.map(link => (
                     <Link key={link.href} href={link.href} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted" role="menuitem" onClick={closeMobileMenu}>
                        {link.icon && <span className="w-4 h-4">{link.icon}</span>} {link.label}
                     </Link>
                  ))}
                  {(session.user.role === "ADMIN" || session.user.role === "MANAGER") && (
                    <Link href="/admin/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted" role="menuitem" onClick={closeMobileMenu}>
                        Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => { signOut({ callbackUrl: '/' }); closeMobileMenu(); }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-destructive hover:bg-destructive/10"
                    role="menuitem"
                  >
                    <FaSignOutAlt /> Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-background shadow-lg border-t border-border z-40">
          <nav className="flex flex-col space-y-1 px-3 py-4">
            {mainNavLinks.map((link) => (
              <Link key={link.label} href={link.href} onClick={closeMobileMenu}
                className="block rounded-md px-3 py-2.5 text-base font-medium text-muted-foreground hover:bg-muted hover:text-primary">
                {link.label}
              </Link>
            ))}
            <div className="my-3 border-t border-border"></div>
            {status === "authenticated" && session?.user ? (
                <>
                     {userNavLinks.map(link => (
                         <Link key={link.href} href={link.href} onClick={closeMobileMenu}
                            className="block rounded-md px-3 py-2.5 text-base font-medium text-muted-foreground hover:bg-muted hover:text-primary">
                            {link.label}
                         </Link>
                      ))}
                      {(session.user.role === "ADMIN" || session.user.role === "MANAGER") && (
                        <Link href="/admin/dashboard" onClick={closeMobileMenu}
                            className="block rounded-md px-3 py-2.5 text-base font-medium text-muted-foreground hover:bg-muted hover:text-primary">
                            Admin Dashboard
                        </Link>
                      )}
                     <button onClick={() => { signOut({ callbackUrl: '/' }); closeMobileMenu(); }}
                        className="block w-full rounded-md px-3 py-2.5 text-left text-base font-medium text-destructive hover:bg-destructive/10">
                        Sign Out
                      </button>
                </>
            ) : status === "unauthenticated" ? (
                <Button onClick={() => { signIn(); closeMobileMenu(); }} variant="default" className="w-full mt-2">Sign In</Button>
            ) : null}
          </nav>
        </div>
      )}
    </header>
  );
};
```

# src/components/ui/Breadcrumbs.tsx
```tsx
// src/components/ui/Breadcrumbs.tsx
"use client"; // If using usePathname or client-side logic, otherwise can be server component

import Link from "next/link";
import { FaChevronRight } from "react-icons/fa";
import { cn } from "~/lib/utils";

export interface BreadcrumbItem {
  name: string;
  href: string;
  isCurrent?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  separator?: React.ReactNode;
}

export const Breadcrumbs = ({ items, className, separator = <FaChevronRight className="h-3 w-3" /> }: BreadcrumbsProps) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm text-muted-foreground", className)}>
      <ol role="list" className="flex items-center space-x-1.5 md:space-x-2">
        {items.map((item, index) => (
          <li key={item.name}>
            <div className="flex items-center">
              {index > 0 && (
                <span className="mx-1.5 md:mx-2 text-muted-foreground/70" aria-hidden="true">
                  {separator}
                </span>
              )}
              {item.isCurrent || index === items.length - 1 ? (
                <span className="font-medium text-foreground" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-primary"
                >
                  {item.name}
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};
```

# src/components/ui/Rating.tsx
```tsx
// src/components/ui/Rating.tsx
"use client";

import React, { useState } from 'react';
import { FaStar, FaRegStar, FaStarHalfAlt } from 'react-icons/fa';
import { cn } from '~/lib/utils';

interface RatingProps {
  value: number; // The current rating value (e.g., 3.5)
  count?: number; // Total number of stars (e.g., 5)
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; // Size of the stars
  color?: string; // Tailwind color class for filled stars (e.g., 'text-yellow-400')
  readOnly?: boolean;
  onChange?: (value: number) => void;
  className?: string;
  showValue?: boolean | "fraction"; // Whether to show the numeric value next to stars, or as fraction e.g. 3.5/5
  precision?: 0.5 | 1; // Rating precision, 0.5 for half stars, 1 for full stars
}

export const Rating: React.FC<RatingProps> = ({
  value,
  count = 5,
  size = 'md',
  color = 'text-yellow-400',
  readOnly = true,
  onChange,
  className,
  showValue = false,
  precision = 0.5, // Default to allowing half-star precision in display
}) => {
  const [hoverValue, setHoverValue] = useState<number | undefined>(undefined);

  const starsToRender = Array.from({ length: count }, (_, i) => i + 1);

  const handleClick = (newValue: number) => {
    if (!readOnly && onChange) {
      onChange(newValue);
    }
  };

  const handleMouseEnter = (newValue: number) => {
    if (!readOnly) {
      setHoverValue(newValue);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverValue(undefined);
    }
  };

  const starSizeClass = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
  }[size];

  return (
    <div className={cn("flex items-center gap-0.5", className)} 
         onMouseLeave={handleMouseLeave}
         role={readOnly ? undefined : "slider"}
         aria-valuenow={readOnly ? undefined : value}
         aria-valuemin={readOnly ? undefined : 0}
         aria-valuemax={readOnly ? undefined : count}
         aria-label={readOnly ? `Rating: ${value} out of ${count} stars` : "Interactive star rating"}
         tabIndex={readOnly ? undefined : 0}
         onKeyDown={(e) => {
            if (!readOnly && onChange) {
                if (e.key === 'ArrowRight' && value < count) onChange(value + (precision === 0.5 ? 0.5 : 1));
                if (e.key === 'ArrowLeft' && value > 0) onChange(value - (precision === 0.5 ? 0.5 : 1));
            }
         }}
    >
      {starsToRender.map((starValue) => {
        const displayValue = hoverValue ?? value;
        let StarIcon = FaRegStar;

        if (precision === 0.5) {
            if (displayValue >= starValue) {
                StarIcon = FaStar;
            } else if (displayValue >= starValue - 0.5) {
                StarIcon = FaStarHalfAlt;
            }
        } else { // precision is 1
            if (displayValue >= starValue) {
                StarIcon = FaStar;
            }
        }
        
        return (
          <button
            type="button"
            key={starValue}
            className={cn(
              "p-0.5", // Add some padding for easier clicking/hovering
              !readOnly && 'cursor-pointer transition-transform hover:scale-125 focus:scale-110 focus:outline-none focus:ring-1 focus:ring-ring rounded-sm'
            )}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            disabled={readOnly}
            aria-label={readOnly ? undefined : `Set rating to ${starValue} star${starValue > 1 ? 's' : ''}`}
          >
            <StarIcon
              className={cn(
                starSizeClass,
                (precision === 0.5 ? (displayValue >= starValue - 0.5) : (displayValue >= starValue)) 
                    ? color 
                    : 'text-gray-300 dark:text-gray-600'
              )}
            />
          </button>
        );
      })}
      {showValue && (
        <span className={cn("ml-2 text-sm font-medium text-muted-foreground", `text-${size}`)}>
            {value.toFixed(1)}
            {showValue === "fraction" && `/${count}`}
        </span>
      )}
    </div>
  );
};
```

# src/components/ui/Select.tsx
```tsx
// src/components/ui/Select.tsx
"use client";

import * as React from "react";
import { cn } from "~/lib/utils";
import { FaChevronDown } from "react-icons/fa";

// This is a VERY simplified Select component placeholder.
// A production-ready Select (like Shadcn/ui's) would use Radix UI Select for accessibility and functionality.

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  placeholder?: string;
  // For a custom styled trigger if not using native select:
  // onValueChange?: (value: string) => void;
  // value?: string;
  // buttonClassName?: string; // if using a custom trigger button
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, ...props }, ref) => {
    return (
      <div className={cn("relative w-full", className)}>
        <select
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none",
            // props.buttonClassName // Only if this select is a custom styled one
          )}
          ref={ref}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };

// Note: A full Shadcn/ui style Select would be much more complex:
// import * as SelectPrimitive from "@radix-ui/react-select";
// const SelectTrigger = React.forwardRef<...>(({ className, children, ...props }, ref) => (
//   <SelectPrimitive.Trigger ref={ref} className={cn(...)} {...props}>
//     {children}
//     <SelectPrimitive.Icon asChild><FaChevronDown ... /></SelectPrimitive.Icon>
//   </SelectPrimitive.Trigger>
// ));
// const SelectContent = React.forwardRef<...>(({ className, children, position="popper", ...props }, ref) => (
//   <SelectPrimitive.Portal>
//     <SelectPrimitive.Content ref={ref} className={cn(...)} position={position} {...props}>
//       <SelectPrimitive.Viewport className={cn(...)}>{children}</SelectPrimitive.Viewport>
//     </SelectPrimitive.Content>
//   </SelectPrimitive.Portal>
// ));
// etc. for Item, Label, Separator...
// export { SelectRoot: SelectPrimitive.Root, SelectValue: SelectPrimitive.Value, SelectTrigger, SelectContent, ... }
```

# src/components/ui/Checkbox.tsx
```tsx
// src/components/ui/Checkbox.tsx
"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { FaCheck } from "react-icons/fa"; // Using react-icons for the checkmark

import { cn } from "~/lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <FaCheck className="h-3 w-3" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };

```

# src/components/ui/Card.tsx
```tsx
// src/components/ui/Card.tsx
import * as React from "react";
import { cn } from "~/lib/utils"; // Assuming your cn utility for class merging

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border border-border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };

```

# src/components/ui/Input.tsx
```tsx
// src/components/ui/Input.tsx
"use client"; // Generally, form inputs might have client-side aspects or be used in client components

import * as React from "react";
import { cn } from "~/lib/utils"; // For Tailwind class merging

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // You can add custom props here if needed, e.g., error states, icons
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leftIcon, rightIcon, ...props }, ref) => {
    const hasLeftIcon = !!leftIcon;
    const hasRightIcon = !!rightIcon;

    return (
      <div className={cn("relative flex items-center w-full", className)}>
        {hasLeftIcon && (
          <span className="absolute left-3 inline-flex items-center justify-center text-muted-foreground">
            {leftIcon}
          </span>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            hasLeftIcon && "pl-10", // Add padding if left icon exists
            hasRightIcon && "pr-10"  // Add padding if right icon exists
            // className // User-provided className should override default padding if necessary, or be applied to wrapper.
            // For direct input styling, apply className here. If wrapper needs styling, apply to the div.
            // Let's keep className on the input for direct styling, but wrapper might need its own prop.
          )}
          ref={ref}
          {...props}
        />
        {hasRightIcon && (
          <span className="absolute right-3 inline-flex items-center justify-center text-muted-foreground">
            {rightIcon}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
```

# src/components/ui/Label.tsx
```tsx
// src/components/ui/Label.tsx
"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label"; // Base for accessibility
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

// Note: Radix Label already handles forwarding refs correctly.
// Extending HTMLAttributes<HTMLLabelElement> and props from LabelPrimitive.Root
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants> & { required?: boolean } // Add optional 'required' prop
>(({ className, required, children, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  >
    {children}
    {required && <span className="ml-0.5 text-destructive">*</span>}
  </LabelPrimitive.Root>
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
```

# src/components/ui/ThemeToggle.tsx
```tsx
// src/components/ui/ThemeToggle.tsx
"use client"; // Required because it uses client-side hooks (useTheme, useState, useEffect)

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { FaSun, FaMoon } from "react-icons/fa";
import { Button } from "~/components/ui/Button"; // Assuming a Button component exists

export const ThemeToggle = () => {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted on the client to avoid hydration mismatch
  // when determining the initial theme.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine the current effective theme (light or dark)
  const currentTheme = theme === "system" ? systemTheme : theme;

  const toggleTheme = () => {
    setTheme(currentTheme === "dark" ? "light" : "dark");
  };

  // Until mounted, an explicit null return is better than rendering potentially mismatched UI
  if (!mounted) {
    // Render a placeholder or null to avoid hydration errors during SSR vs client render
    // This button will be invisible until mounted and theme is determined.
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 opacity-0" // Placeholder, invisible
        aria-label="Toggle theme"
        disabled
      />
    );
  }

  return (
    <Button
      variant="ghost" // Using a common Button variant
      size="icon"     // For icon-only buttons
      onClick={toggleTheme}
      aria-label={`Switch to ${currentTheme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${currentTheme === "dark" ? "light" : "dark"} mode`} // Tooltip for clarity
    >
      {currentTheme === "dark" ? (
        <FaSun className="h-5 w-5 text-yellow-400 transition-all hover:text-yellow-300" />
      ) : (
        <FaMoon className="h-5 w-5 text-slate-600 transition-all hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};
```

# src/components/ui/DatePicker.tsx
```tsx
// src/components/ui/DatePicker.tsx
"use client";

import * as React from "react";
import { cn } from "~/lib/utils";
import { Input } from "./Input"; // Uses your Input component
import { FaCalendarAlt } from "react-icons/fa";

// This is a VERY basic placeholder for a DatePicker.
// A full implementation often uses a library like react-day-picker.

export interface DatePickerProps {
  value?: Date | string | null; // Can be Date object or ISO string
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ value, onChange, placeholder = "Select a date", className, disabled, ...props }, ref) => {
    const [dateString, setDateString] = React.useState<string>("");

    React.useEffect(() => {
      if (value instanceof Date) {
        // Format Date object to YYYY-MM-DD for input type="date"
        setDateString(value.toISOString().split('T')[0] ?? "");
      } else if (typeof value === 'string') {
        // If it's already a string, assume it's in correct format or handle parsing
        setDateString(value.split('T')[0] ?? "");
      } else {
        setDateString("");
      }
    }, [value]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newDateString = event.target.value;
      setDateString(newDateString);
      if (onChange) {
        if (newDateString) {
          const [year, month, day] = newDateString.split('-').map(Number);
          if (year && month && day) {
            // Construct date in UTC to avoid timezone issues with date-only inputs
            onChange(new Date(Date.UTC(year, month - 1, day)));
          } else {
            onChange(null); // Invalid date string
          }
        } else {
          onChange(null); // Empty input
        }
      }
    };

    return (
      // Using a simple HTML5 date input for this stub
      // A full component would use a calendar popover.
      <div className={cn("relative", className)}>
         <Input
            type="date"
            ref={ref}
            value={dateString}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            className="pr-10" // Make space for icon
            {...props} // Spread other HTML input attributes
        />
        <FaCalendarAlt className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
    );
  }
);
DatePicker.displayName = "DatePicker";

export { DatePicker };
```

# src/components/ui/AudioToggle.tsx
```tsx
// src/components/ui/AudioToggle.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FaVolumeUp, FaVolumeMute } from "react-icons/fa";
import { Button } from "~/components/ui/Button"; 
import { toast } from "react-hot-toast"; 

interface AudioToggleProps {
  audioSrc?: string; 
  initiallyPlaying?: boolean; 
}

export const AudioToggle = ({
  audioSrc = "/sounds/ambient-nature.mp3", 
  initiallyPlaying = false, 
}: AudioToggleProps) => {
  const [isPlaying, setIsPlaying] = useState(initiallyPlaying);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false); 
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audioElement = new Audio(audioSrc);
    audioElement.loop = true;
    audioElement.preload = "auto"; 

    audioElement.oncanplaythrough = () => {
      setIsAudioReady(true);
      if (initiallyPlaying && hasInteracted && audioRef.current && audioRef.current.paused) {
        // Only attempt to play if it's supposed to be playing and is currently paused
        audioRef.current.play().catch(e => {
          console.error("Initial audio play failed after canplaythrough:", e);
          setIsPlaying(false);
        });
      }
    };

    audioElement.onerror = (e) => {
      // Improved error logging:
      let errorDetails = "Unknown audio error.";
      if (audioElement.error) {
        switch (audioElement.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorDetails = "Audio playback aborted by the user or script.";
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorDetails = `A network error caused the audio download to fail. Path: ${audioSrc}`;
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorDetails = "The audio playback was aborted due to a corruption problem or because the audio used features your browser did not support.";
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorDetails = `The audio source was not suitable. Path: ${audioSrc}. Check if the file exists and the format is supported.`;
            break;
          default:
            errorDetails = `An unknown error occurred with the audio element. Code: ${audioElement.error.code}. Message: ${audioElement.error.message}`;
        }
      }
      console.error("Error loading audio. Event:", e, "AudioElement Error:", errorDetails);
      toast.error(`Failed to load ambient sound: ${errorDetails.substring(0,100)}...`); // Show a more specific part of error
      setIsAudioReady(false);
    };

    audioRef.current = audioElement;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src'); // Release the source
        audioRef.current.load(); // Abort pending loads
        audioRef.current.oncanplaythrough = null; // Remove listeners
        audioRef.current.onerror = null;
        audioRef.current = null;
      }
    };
  }, [audioSrc, initiallyPlaying, hasInteracted]); // Dependencies

  const toggleAudio = useCallback(async () => {
    if (!audioRef.current) {
      toast.error("Audio element not initialized.");
      return;
    }
    if (!isAudioReady && audioRef.current.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
        // If not ready, try to load it. Useful if preload="none" or error occurred.
        try {
            audioRef.current.load(); // Attempt to load/reload
            await audioRef.current.play(); // Then try to play
            setIsPlaying(true);
            if (!hasInteracted) setHasInteracted(true);
        } catch (error) {
            toast.error("Ambient sound is not ready yet or failed to play.");
            console.error("Audio not ready / play failed on toggle:", error);
            setIsPlaying(false);
        }
        return;
    }


    if (!hasInteracted) {
      setHasInteracted(true); 
    }

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error("Audio play/pause toggle failed:", error);
      toast.error("Could not toggle ambient sound.");
      // Attempt to sync state if an error occurred during play/pause
      if (audioRef.current) {
        setIsPlaying(!audioRef.current.paused);
      }
    }
  }, [isPlaying, isAudioReady, hasInteracted]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleAudio}
      disabled={!isAudioReady && !hasInteracted} // Slightly more lenient disabled state initially, allows first click to attempt load/play
      aria-label={isPlaying ? "Mute ambient sound" : "Play ambient sound"}
      title={isPlaying ? "Mute ambient sound" : "Play ambient sound"}
    >
      {isPlaying ? (
        <FaVolumeUp className="h-5 w-5 text-primary transition-all group-hover:text-primary-dark dark:text-primary-light dark:group-hover:text-primary" />
      ) : (
        <FaVolumeMute className="h-5 w-5 text-muted-foreground transition-all group-hover:text-foreground" />
      )}
      <span className="sr-only">{isPlaying ? "Mute ambient sound" : "Play ambient sound"}</span>
    </Button>
  );
};

```

# src/components/ui/DateRangePicker.tsx
```tsx
// src/components/ui/DateRangePicker.tsx
"use client";

import * as React from "react";
import { cn } from "~/lib/utils";
import { DatePicker, type DatePickerProps } from "./DatePicker"; // Uses your DatePicker component

// This is a VERY basic placeholder for a DateRangePicker.
// A full implementation often uses react-day-picker with range selection.

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  className?: string;
  disabled?: boolean;
  // calendarProps?: any; // For passing props to an underlying calendar library
}

const DateRangePicker = ({ value, onChange, className, disabled }: DateRangePickerProps) => {
  const handleFromChange = (date: Date | null) => {
    if (onChange) {
      onChange({ from: date, to: value?.to ?? null });
    }
  };

  const handleToChange = (date: Date | null) => {
    if (onChange) {
      onChange({ from: value?.from ?? null, to: date });
    }
  };

  return (
    <div className={cn("flex flex-col sm:flex-row gap-2 items-center", className)}>
      <DatePicker
        value={value?.from}
        onChange={handleFromChange}
        placeholder="Start date"
        disabled={disabled}
        className="w-full sm:w-auto"
        aria-label="Start date"
      />
      <span className="text-muted-foreground hidden sm:inline">-</span>
      <DatePicker
        value={value?.to}
        onChange={handleToChange}
        placeholder="End date"
        disabled={disabled}
        className="w-full sm:w-auto"
        aria-label="End date"
      />
    </div>
  );
};
DateRangePicker.displayName = "DateRangePicker";

export { DateRangePicker };

```

# src/components/ui/Textarea.tsx
```tsx
// src/components/ui/Textarea.tsx
"use client";

import * as React from "react";
import { cn } from "~/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
```

# src/components/ui/Toaster.tsx
```tsx
// src/components/ui/Toaster.tsx
"use client"; // Toaster component from react-hot-toast is a client component

// This component simply re-exports the Toaster from react-hot-toast.
// You would then render this <Toaster /> component in your root layout or providers.
// This approach is common if you want all UI components, even re-exports,
// to live under `~/components/ui`.
export { Toaster } from "react-hot-toast";

// If you wanted to provide default props or a custom wrapper:
// import { Toaster as HotToaster } from "react-hot-toast";
//
// export const Toaster = () => {
//   return (
//     <HotToaster
//       position="top-right"
//       toastOptions={{
//         duration: 5000,
//         // Default styles can be set here
//         // style: {
//         //   background: '#333',
//         //   color: '#fff',
//         // },
//       }}
//     />
//   );
// };
```

# src/components/ui/Button.tsx
```tsx
// src/components/ui/Button.tsx
"use client"; // If it uses client-side hooks or event handlers not passed as props

import * as React from "react";
import { Slot } from "@radix-ui/react-slot"; // For asChild prop
import { cva, type VariantProps } from "class-variance-authority";
import { FaSpinner } from "react-icons/fa"; // Example loading icon

import { cn } from "~/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, isLoading = false, loadingText = "Loading...", children, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <>
            <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
            {loadingText || children} 
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

# src/components/ui/RadioGroup.tsx
```tsx
// src/components/ui/RadioGroup.tsx
"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { FaCircle } from "react-icons/fa"; // Using react-icons for the indicator

import { cn } from "~/lib/utils";

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, children, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <FaCircle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };

```

# src/components/ui/EmptyState.tsx
```tsx
// src/components/ui/EmptyState.tsx
"use client"; // Can be client or server depending on usage, but client is safer if action is interactive

import React, { type ReactNode } from 'react';
import { Button } from '~/components/ui/Button'; // Assuming Button component
import { cn } from '~/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    text: string;
    onClick?: () => void;
    href?: string;
  } | ReactNode; // Allow passing a full button/link component
  className?: string;
  contentClassName?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
  contentClassName,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-lg border-2 border-dashed border-border bg-card min-h-[300px]",
        className
      )}
    >
      <div className={cn("max-w-md", contentClassName)}>
        {icon && (
          <div className="mb-6 text-muted-foreground opacity-70 text-5xl md:text-6xl">
            {icon}
          </div>
        )}
        <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
          {title}
        </h2>
        {description && (
          <p className="text-muted-foreground mb-6">
            {description}
          </p>
        )}
        {action && (
          <div className="mt-6">
            {React.isValidElement(action) ? (
              action
            ) : action && typeof action === 'object' && 'text' in action ? (
              <Button
                onClick={action.onClick}
                asChild={!!action.href}
              >
                {action.href ? <a href={action.href}>{action.text}</a> : action.text}
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
```

# src/components/ui/Switch.tsx
```tsx
// src/components/ui/Switch.tsx
"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "~/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
```

# src/components/ui/Progress.tsx
```tsx
// src/components/ui/Progress.tsx
"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "~/lib/utils";

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, indicatorClassName, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary/20 dark:bg-secondary/30", // Adjusted background for visibility
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 bg-primary transition-all duration-300 ease-out",
        indicatorClassName
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };

```

# src/components/ui/Badge.tsx
```tsx
// src/components/ui/Badge.tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        success: // Custom variant
          "border-transparent bg-green-500 text-white hover:bg-green-500/80 dark:bg-green-600 dark:hover:bg-green-600/80",
        warning: // Custom variant
          "border-transparent bg-yellow-500 text-black hover:bg-yellow-500/80 dark:bg-yellow-600 dark:text-white dark:hover:bg-yellow-600/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
```

# prisma/schema.prisma
```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client" // CORRECTED explicit output path
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Core Models
model User {
  id                String           @id @default(cuid())
  name              String?
  email             String?          @unique
  emailVerified     DateTime?
  image             String?
  password          String? // Hashed password
  roleDefinitionId  String?          // For advanced RBAC, FK to RoleDefinition
  role              Role             @default(CUSTOMER) // Simple role, can coexist or be replaced by RoleDefinition
  stripeCustomerId  String?          @unique // For Stripe subscriptions and customer management
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt

  definedRole       RoleDefinition?  @relation(fields: [roleDefinitionId], references: [id])
  accounts          Account[]
  sessions          Session[]
  orders            Order[]
  reviews           Review[]
  quizResponses     QuizResponse[]
  addresses         Address[]
  wishlist          WishlistItem[]
  cart              CartItem[]
  notifications     Notification[]
  subscriptions     ProductSubscription[]
  loyaltyPointLogs  LoyaltyPointLog[]
  userRewards       UserReward[]
  smartHomeConnections SmartHomePlatformConnection[]
  createdPurchaseOrders PurchaseOrder[] @relation("POCreatedBy")
  updatedPurchaseOrders PurchaseOrder[] @relation("POUpdatedBy")
  automationRules   AutomationRule[]
  scentSchedules    ScentSchedule[]

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

// Product Catalog Models
model Product {
  id                String              @id @default(cuid())
  name              String
  slug              String              @unique
  description       String              @db.Text
  price             Decimal             @db.Decimal(10, 2)
  compareAtPrice    Decimal?            @db.Decimal(10, 2)
  costPrice         Decimal?            @db.Decimal(10, 2)
  sku               String?             @unique
  barcode           String?
  weight            Float?              // in grams
  dimensions        Json?               // {length, width, height} in cm
  inStock           Boolean             @default(true)
  lowStockThreshold Int?                @default(5)
  stockQuantity     Int                 @default(0) // Default to 0, manage through variants or direct updates
  featured          Boolean             @default(false)
  bestSeller        Boolean             @default(false)
  isNew             Boolean             @default(false)
  onSale            Boolean             @default(false)
  saleEndDate       DateTime?
  publishedAt       DateTime?
  metaTitle         String?
  metaDescription   String?
  modelUrl          String?             // For AR Visualization
  arPlacement       String?             // e.g., "floor", "table", "wall" for AR hints
  leadTime          Int?                // Days for inventory reordering
  safetyStock       Int?                // Minimum stock before reordering (for forecasting)
  turnoverRate      Float?              // For inventory analytics
  forecastedDemand  Int?                // For inventory analytics
  depletionDate     DateTime?           // For inventory analytics
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  images            ProductImage[]
  categories        Category[]          @relation("ProductToCategory")
  tags              Tag[]               @relation("ProductToTag")
  orderItems        OrderItem[]
  reviews           Review[]
  variants          ProductVariant[]
  relatedProducts   Product[]           @relation("RelatedProducts") 
  recommendedWith   Product[]           @relation("RelatedProducts") 
  cartItems         CartItem[]
  wishlistItems     WishlistItem[]
  collections       Collection[]        @relation("ProductToCollection")
  subscriptions     ProductSubscription[]
  purchaseOrderItems PurchaseOrderItem[]
  smartHomeDevices  SmartHomeDevice[]   @relation("CurrentScentInDevice") 
  loyaltyRewards    Reward[]            @relation("FreeProductReward") 

  @@index([slug])
  @@index([featured])
  @@map("products")
}

model ProductImage {
  id          String    @id @default(cuid())
  productId   String
  url         String
  altText     String?
  width       Int?
  height      Int?
  position    Int       @default(0)

  product     Product   @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@map("product_images")
}

model ProductVariant {
  id            String    @id @default(cuid())
  productId     String
  name          String    
  sku           String?   @unique
  price         Decimal?  @db.Decimal(10, 2) 
  stockQuantity Int       @default(0)
  options       Json      
  imageUrl      String?   
  isDefault     Boolean   @default(false)

  product       Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  cartItems     CartItem[]
  orderItems    OrderItem[] @relation("VariantOrderItems") 
  
  @@map("product_variants")
}

model Category {
  id          String    @id @default(cuid())
  name        String    @unique
  slug        String    @unique
  description String?   @db.Text
  imageUrl    String?
  parentId    String?
  position    Int       @default(0)

  parent      Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete:SetNull)
  children    Category[] @relation("CategoryHierarchy")
  products    Product[]  @relation("ProductToCategory")

  @@index([slug])
  @@map("categories")
}

model Tag {
  id          String    @id @default(cuid())
  name        String    @unique
  slug        String    @unique

  products    Product[] @relation("ProductToTag")

  @@index([slug])
  @@map("tags")
}

model Collection {
  id          String    @id @default(cuid())
  name        String    @unique
  slug        String    @unique
  description String?   @db.Text
  imageUrl    String?
  active      Boolean   @default(true)
  featured    Boolean   @default(false)
  startDate   DateTime?
  endDate     DateTime?

  products    Product[] @relation("ProductToCollection")

  @@index([slug])
  @@map("collections")
}

model Order {
  id              String       @id @default(cuid())
  userId          String
  status          OrderStatus  @default(PENDING)
  subtotal        Decimal      @db.Decimal(10, 2)
  shippingCost    Decimal      @db.Decimal(10, 2) @default(0.00)
  tax             Decimal      @db.Decimal(10, 2) @default(0.00)
  discountAmount  Decimal      @db.Decimal(10, 2) @default(0.00)
  total           Decimal      @db.Decimal(10, 2)
  shippingAddress Json         
  billingAddress  Json?        
  paymentMethod   String?
  paymentIntentId String?      @unique
  currency        String       @default("USD")
  notes           String?      @db.Text 
  trackingNumber  String?
  shippingMethod  String?
  refundAmount    Decimal?     @db.Decimal(10, 2)
  cancelReason    String?
  orderNumber     String       @unique 
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  user            User         @relation(fields: [userId], references: [id])
  orderItems      OrderItem[]
  history         OrderHistory[]
  loyaltyPointLog LoyaltyPointLog[] 
  userRewardsUsed UserReward[]    

  @@index([orderNumber])
  @@map("orders")
}

model OrderItem {
  id            String   @id @default(cuid())
  orderId       String
  productId     String
  variantId     String?
  name          String   
  sku           String?  
  price         Decimal  @db.Decimal(10, 2) 
  quantity      Int
  subtotal      Decimal  @db.Decimal(10, 2) 
  imageUrl      String?
  productData   Json     

  order         Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product       Product  @relation(fields: [productId], references: [id], onDelete:Restrict) 
  variant       ProductVariant? @relation("VariantOrderItems", fields: [variantId], references: [id], onDelete:Restrict)

  @@map("order_items")
}

model OrderHistory {
  id        String      @id @default(cuid())
  orderId   String
  status    OrderStatus
  comment   String?     @db.Text
  createdAt DateTime    @default(now())
  createdBy String?     

  order     Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@map("order_history")
}

model Address {
  id           String    @id @default(cuid())
  userId       String
  addressLine1 String
  addressLine2 String?
  city         String
  state        String    
  postalCode   String
  country      String    
  phoneNumber  String?
  isDefaultShipping Boolean @default(false)
  isDefaultBilling  Boolean @default(false)
  addressType  AddressType 

  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("addresses")
}

model Review {
  id                 String   @id @default(cuid())
  userId             String
  productId          String
  orderItemId        String?  @unique 
  rating             Int      @db.SmallInt 
  title              String?
  comment            String?  @db.Text
  status             ReviewStatus @default(PENDING)
  helpfulCount       Int      @default(0)
  notHelpfulCount    Int      @default(0)
  isVerifiedPurchase Boolean  @default(false)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  user               User     @relation(fields: [userId], references: [id])
  product            Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@map("reviews")
}

model QuizQuestion {
  id           String         @id @default(cuid())
  question     String
  description  String?        @db.Text
  options      Json           
  order        Int            
  type         QuizQuestionType @default(SINGLE_CHOICE_TEXT) 
  imageUrl     String?
  tooltipText  String?

  responses    QuizResponse[] @relation("QuizResponseToQuestion")

  @@map("quiz_questions")
}

model QuizResponse {
  id         String   @id @default(cuid())
  userId     String?  
  questionId String
  answer     Json     
  sessionId  String?  
  createdAt  DateTime @default(now())

  user       User?        @relation(fields: [userId], references: [id], onDelete: SetNull)
  question   QuizQuestion @relation("QuizResponseToQuestion", fields: [questionId], references: [id], onDelete:Cascade)

  @@map("quiz_responses")
}

model NewsletterSubscriber {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  active    Boolean  @default(true)
  source    String?  
  interests String[] 
  createdAt DateTime @default(now())
  
  @@map("newsletter_subscribers")
}

model CartItem {
  id          String    @id @default(cuid())
  userId      String?   
  sessionId   String?   
  productId   String
  variantId   String?
  quantity    Int
  addedAt     DateTime  @default(now())

  user        User?     @relation(fields: [userId], references: [id], onDelete: Cascade)
  product     Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  variant     ProductVariant? @relation(fields: [variantId], references: [id], onDelete: SetNull)

  @@unique([sessionId, productId, variantId], name: "guestCartUniqueItem")
  @@unique([userId, productId, variantId], name: "userCartUniqueItem")
  @@map("cart_items")
}

model WishlistItem {
  id          String    @id @default(cuid())
  userId      String
  productId   String
  variantId   String?   
  addedAt     DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  product     Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@unique([userId, productId, variantId])
  @@map("wishlist_items")
}

model ProductSubscription {
  id                String    @id @default(cuid())
  userId            String
  productId         String
  variantId         String?   
  frequency         SubscriptionFrequency
  status            SubscriptionStatus @default(ACTIVE) 
  nextBillingDate   DateTime? 
  nextShipDate      DateTime? 
  lastBilledDate    DateTime?
  lastShippedDate   DateTime?
  stripeSubscriptionId String? @unique 
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  cancelledAt       DateTime?

  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  product           Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@map("product_subscriptions")
}

model LoyaltyTier {
  id         String    @id @default(cuid())
  name       String    @unique 
  minPoints  Int       @unique 
  benefits   Json      
  color      String?   
  icon       String?   

  rewards    Reward[]  
  @@map("loyalty_tiers")
}

model LoyaltyPointLog {
  id          String    @id @default(cuid())
  userId      String
  points      Int       
  type        LoyaltyPointLogType 
  description String    
  orderId     String?   
  userRewardId String?  
  expiresAt   DateTime? 
  createdAt   DateTime  @default(now())

  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  order       Order?     @relation(fields: [orderId], references: [id], onDelete:SetNull)
  userReward  UserReward? @relation(fields: [userRewardId], references: [id], onDelete:SetNull)
  
  @@map("loyalty_point_logs")
}

model Reward {
  id                     String    @id @default(cuid())
  name                   String
  description            String?
  pointsCost             Int
  type                   RewardType 
  value                  Json      
  requiredTierId         String?   
  imageUrl               String?
  isActive               Boolean   @default(true)
  validFrom              DateTime?
  validUntil             DateTime? 
  maxRedemptions         Int?      
  maxRedemptionsPerUser  Int?      @default(1) 

  tier                   LoyaltyTier? @relation(fields: [requiredTierId], references: [id])
  userRewards            UserReward[]
  freeProduct            Product?     @relation("FreeProductReward", fields: [freeProductId], references: [id])
  freeProductId          String?

  @@map("rewards")
}

model UserReward {
  id          String    @id @default(cuid())
  userId      String
  rewardId    String
  redeemedAt  DateTime  @default(now())
  status      UserRewardStatus @default(AVAILABLE) 
  couponCode  String?   @unique 
  expiresAt   DateTime? 
  orderId     String?   

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  reward      Reward    @relation(fields: [rewardId], references: [id])
  order       Order?    @relation(fields: [orderId], references: [id], onDelete:SetNull)
  loyaltyPointLogs LoyaltyPointLog[]

  @@map("user_rewards")
}

model RoleDefinition {
  id            String    @id @default(cuid())
  name          String    @unique 
  description   String?
  isSystemRole  Boolean   @default(false) 
  permissions   PermissionAssignment[]
  users         User[]

  @@map("role_definitions")
}

model Permission {
  id          String    @id @default(cuid())
  action      String    
  subject     String    
  category    String    
  description String?
  assignments PermissionAssignment[]

  @@unique([action, subject]) 
  @@map("permissions")
}

model PermissionAssignment {
  roleId        String
  permissionId  String
  
  role          RoleDefinition @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission    Permission     @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([roleId, permissionId])
  @@map("permission_assignments")
}

model Supplier {
  id            String    @id @default(cuid())
  name          String    @unique
  contactName   String?
  contactEmail  String?   @unique
  contactPhone  String?
  address       Json?     
  notes         String?   @db.Text
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  purchaseOrders PurchaseOrder[]

  @@map("suppliers")
}

model PurchaseOrder {
  id                  String    @id @default(cuid())
  orderNumber         String    @unique 
  supplierId          String
  status              PurchaseOrderStatus @default(DRAFT) 
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  expectedDeliveryDate DateTime?
  actualDeliveryDate  DateTime?
  shippingCost        Decimal?  @db.Decimal(10, 2)
  subtotal            Decimal   @db.Decimal(12, 2) @default(0.00)
  totalCost           Decimal   @db.Decimal(12, 2) @default(0.00) 
  notes               String?   @db.Text
  createdById         String?   
  updatedById         String?   

  supplier            Supplier  @relation(fields: [supplierId], references: [id])
  items               PurchaseOrderItem[]
  createdBy           User?     @relation("POCreatedBy", fields: [createdById], references: [id], onDelete:SetNull)
  updatedBy           User?     @relation("POUpdatedBy", fields: [updatedById], references: [id], onDelete:SetNull)

  @@map("purchase_orders")
}

model PurchaseOrderItem {
  id                String    @id @default(cuid())
  purchaseOrderId   String
  productId         String
  quantityOrdered   Int
  quantityReceived  Int       @default(0)
  unitCost          Decimal   @db.Decimal(10, 2) 

  purchaseOrder     PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
  product           Product       @relation(fields: [productId], references: [id])

  @@map("purchase_order_items")
}

model SmartHomePlatformConnection {
  id            String    @id @default(cuid())
  userId        String
  platformKey   String    
  platformName  String    
  accessToken   String    @db.Text 
  refreshToken  String?   @db.Text 
  tokenExpiresAt DateTime?
  scopesGranted String[]
  externalUserId String?  
  lastSyncedAt  DateTime?
  syncStatus    String?   
  syncMessage   String?   @db.Text
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user          User      @relation(fields: [userId], references: [id], onDelete:Cascade)
  devices       SmartHomeDevice[]

  @@unique([userId, platformKey])
  @@map("smart_home_platform_connections")
}

model SmartHomeDevice {
  id             String    @id @default(cuid())
  connectionId   String
  externalDeviceId String  
  name           String    
  type           SmartHomeDeviceType 
  roomName       String?
  isOnline       Boolean   @default(false)
  isActive       Boolean   @default(false) 
  capabilities   Json?     
  currentState   Json?     
  currentScentProductId String?
  lastActivityAt DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  connection     SmartHomePlatformConnection @relation(fields: [connectionId], references: [id], onDelete:Cascade)
  currentScent   Product?  @relation("CurrentScentInDevice", fields: [currentScentProductId], references: [id], onDelete:SetNull)
  schedules      ScentSchedule[]
  automationActions AutomationAction[]

  @@unique([connectionId, externalDeviceId])
  @@map("smart_home_devices")
}

model AutomationRule {
  id            String    @id @default(cuid())
  userId        String
  name          String
  description   String?
  enabled       Boolean   @default(true)
  triggerType   AutomationTriggerType
  triggerConfig Json      
  lastTriggered DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user          User      @relation(fields: [userId], references: [id], onDelete:Cascade)
  actions       AutomationAction[]

  @@map("automation_rules")
}

model AutomationAction {
  id            String    @id @default(cuid())
  ruleId        String
  deviceId      String    
  actionType    String    
  parameters    Json?     
  executionOrder Int      @default(0) 

  rule          AutomationRule    @relation(fields: [ruleId], references: [id], onDelete:Cascade)
  device        SmartHomeDevice   @relation(fields: [deviceId], references: [id], onDelete:Cascade)

  @@map("automation_actions")
}

model ScentSchedule {
  id            String    @id @default(cuid())
  userId        String
  deviceId      String    
  name          String
  description   String?
  enabled       Boolean   @default(true)
  entries       Json      
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user          User            @relation(fields: [userId], references: [id], onDelete:Cascade)
  device        SmartHomeDevice @relation(fields: [deviceId], references: [id], onDelete:Cascade)

  @@map("scent_schedules")
}

model Notification {
  id          String    @id @default(cuid())
  userId      String
  type        NotificationType
  title       String
  message     String    @db.Text
  isRead      Boolean   @default(false)
  readAt      DateTime?
  link        String?   
  data        Json?     
  createdAt   DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notifications")
}

model SiteSettings {
  id                String  @id @default("global_settings") 
  siteName          String  @default("The Scent")
  logoUrl           String?
  faviconUrl        String?
  primaryColor      String  @default("#2a7c8a")
  secondaryColor    String  @default("#e0a86f")
  accentColor       String  @default("#ff7b4f")
  defaultCurrency   String  @default("USD") 
  defaultLanguage   String  @default("en")  
  contactEmail      String?
  contactPhone      String?
  socialLinks       Json?   
  shippingMethods   Json?   
  taxRates          Json?   
  defaultMetaTitle  String?
  defaultMetaDescription String?
  maintenanceMode   Boolean @default(false)
  storeAddress      Json?   
  updatedAt         DateTime @updatedAt
  
  @@map("site_settings")
}

enum Role {
  ADMIN     
  MANAGER   
  CUSTOMER  
}

enum OrderStatus {
  PENDING     
  AWAITING_PAYMENT 
  PROCESSING  
  PAID        
  ON_HOLD     
  SHIPPED     
  IN_TRANSIT  
  OUT_FOR_DELIVERY 
  DELIVERED   
  COMPLETED   
  CANCELLED   
  REFUND_PENDING 
  REFUNDED    
  FAILED      
}

enum AddressType {
  SHIPPING
  BILLING
}

enum ReviewStatus {
  PENDING   
  APPROVED
  REJECTED
}

enum NotificationType {
  ORDER_CONFIRMATION
  ORDER_PAYMENT_SUCCESS
  ORDER_PAYMENT_FAILED
  ORDER_STATUS_UPDATE 
  ORDER_SHIPPED
  ORDER_OUT_FOR_DELIVERY
  ORDER_DELIVERED
  ORDER_CANCELLED
  ORDER_REFUNDED
  WELCOME_EMAIL
  PASSWORD_RESET
  EMAIL_VERIFICATION
  PROFILE_UPDATE
  LOW_STOCK_ALERT     
  BACK_IN_STOCK       
  NEW_PRODUCT_LAUNCHED
  PRICE_DROP_ALERT    
  SUBSCRIPTION_CREATED
  SUBSCRIPTION_REMINDER 
  SUBSCRIPTION_PAYMENT_SUCCESS
  SUBSCRIPTION_PAYMENT_FAILED
  SUBSCRIPTION_CANCELLED
  SUBSCRIPTION_UPDATED
  LOYALTY_POINTS_EARNED
  LOYALTY_TIER_UPGRADE
  LOYALTY_REWARD_REDEEMED
  LOYALTY_POINTS_EXPIRING_SOON
  SMART_HOME_DEVICE_CONNECTED
  SMART_HOME_DEVICE_OFFLINE
  SMART_HOME_AUTOMATION_TRIGGERED
  SMART_HOME_SCENT_LOW 
  PROMOTIONAL_OFFER
  NEWSLETTER_UPDATE
  SURVEY_INVITATION
  SYSTEM_ANNOUNCEMENT 
  ADMIN_ALERT         
}

enum SubscriptionFrequency {
  WEEKLY
  BIWEEKLY  
  MONTHLY
  EVERY_TWO_MONTHS
  QUARTERLY 
  EVERY_SIX_MONTHS
  ANNUALLY
}

enum SubscriptionStatus {
  ACTIVE
  PAUSED
  CANCELLED         
  EXPIRED           
  PENDING_PAYMENT   
  ADMIN_SUSPENDED   
}

enum LoyaltyPointLogType {
  EARN_PURCHASE
  EARN_REVIEW_PRODUCT
  EARN_SIGNUP_BONUS
  EARN_REFERRAL_BONUS
  EARN_COMPLETE_QUIZ
  EARN_BIRTHDAY_BONUS
  EARN_SOCIAL_SHARE
  REDEEM_REWARD
  ADJUST_ADMIN_CREDIT 
  ADJUST_ADMIN_DEBIT  
  EXPIRE_POINTS       
  REFUND_POINTS       
}

enum RewardType {
  DISCOUNT_PERCENTAGE 
  DISCOUNT_FIXED_AMOUNT 
  FREE_SHIPPING
  FREE_PRODUCT        
  VOUCHER_CODE        
  EXCLUSIVE_ACCESS    
  GIFT_CARD
}

enum UserRewardStatus {
  AVAILABLE 
  APPLIED   
  USED      
  EXPIRED   
}

enum PurchaseOrderStatus {
  DRAFT     
  PENDING   
  CONFIRMED 
  SHIPPED   
  PARTIALLY_RECEIVED 
  RECEIVED  
  CANCELLED 
  CLOSED    
}

enum SmartHomeDeviceType {
  AROMA_DIFFUSER
  SMART_PLUG_DIFFUSER 
  AIR_PURIFIER_WITH_SCENT
  SMART_LIGHT_SCENT_SYNC 
  OTHER_WELLNESS_DEVICE
}

enum AutomationTriggerType {
  TIME_OF_DAY
  SUNRISE
  SUNSET
  USER_ENTERS_LOCATION 
  USER_LEAVES_LOCATION
  DEVICE_STATE_CHANGE  
  SENSOR_READING       
  VOICE_COMMAND        
  APP_EVENT            
}

enum QuizQuestionType {
  SINGLE_CHOICE_TEXT
  MULTIPLE_CHOICE_TEXT
  SINGLE_CHOICE_IMAGE
  MULTIPLE_CHOICE_IMAGE
  SCALE 
  TEXT_INPUT 
}

```

# prisma/seed.ts
```ts
// prisma/seed.ts
import { PrismaClient, QuizQuestionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // --- Seed Quiz Questions ---
  const quizQuestionsData = [
    {
      id: 'clwzquiz0001', // Use fixed IDs for consistency if you re-run seed
      question: 'What type of scents are you usually drawn to?',
      description: 'Think about perfumes, candles, or natural smells you enjoy.',
      order: 1,
      type: QuizQuestionType.MULTIPLE_CHOICE_TEXT,
      options: [
        { id: 'opt001', label: 'Fresh & Clean (Citrus, Aquatic, Green)', tags: ['citrus', 'fresh', 'aquatic', 'green', 'uplifting'] },
        { id: 'opt002', label: 'Warm & Cozy (Vanilla, Amber, Spices)', tags: ['warm', 'cozy', 'vanilla', 'amber', 'spicy', 'comforting'] },
        { id: 'opt003', label: 'Earthy & Woody (Sandalwood, Cedar, Patchouli)', tags: ['earthy', 'woody', 'grounding', 'sandalwood', 'cedarwood'] },
        { id: 'opt004', label: 'Floral & Sweet (Rose, Jasmine, Lavender)', tags: ['floral', 'sweet', 'rose', 'jasmine', 'lavender', 'calming'] },
      ],
    },
    {
      id: 'clwzquiz0002',
      question: 'What mood are you hoping to cultivate?',
      description: 'Select the primary feeling you want your aromatherapy to support.',
      order: 2,
      type: QuizQuestionType.SINGLE_CHOICE_TEXT,
      options: [
        { id: 'opt005', label: 'Relaxation & Calm', tags: ['calming', 'relaxing', 'stress-relief', 'lavender', 'chamomile'] },
        { id: 'opt006', label: 'Energy & Focus', tags: ['energizing', 'focus', 'uplifting', 'citrus', 'peppermint', 'rosemary'] },
        { id: 'opt007', label: 'Comfort & Grounding', tags: ['comforting', 'grounding', 'woody', 'vanilla', 'sandalwood'] },
        { id: 'opt008', label: 'Uplift & Joy', tags: ['joyful', 'uplifting', 'happy', 'citrus', 'floral', 'bergamot'] },
      ],
    },
    {
      id: 'clwzquiz0003',
      question: 'Which of these images best represents your ideal ambiance?',
      description: 'Choose the one that resonates most with you.',
      order: 3,
      type: QuizQuestionType.SINGLE_CHOICE_IMAGE, // Client needs to render images for these options
      options: [
        { id: 'opt009', label: 'Sunlit Forest Path', imageUrl: '/images/quiz/forest.jpg', tags: ['woody', 'green', 'natural', 'grounding'] },
        { id: 'opt010', label: 'Cozy Fireside Reading', imageUrl: '/images/quiz/fireside.jpg', tags: ['warm', 'cozy', 'comforting', 'spicy'] },
        { id: 'opt011', label: 'Blooming Spring Garden', imageUrl: '/images/quiz/garden.jpg', tags: ['floral', 'fresh', 'sweet', 'uplifting'] },
        { id: 'opt012', label: 'Ocean Breeze at Dawn', imageUrl: '/images/quiz/ocean.jpg', tags: ['fresh', 'aquatic', 'clean', 'energizing'] },
      ],
    },
    // Add more questions as needed
  ];

  for (const qData of quizQuestionsData) {
    await prisma.quizQuestion.upsert({
      where: { id: qData.id },
      update: {
        ...qData,
        options: qData.options as any, // Prisma expects JsonValue for Json type
      },
      create: {
        ...qData,
        options: qData.options as any, // Prisma expects JsonValue for Json type
      },
    });
  }
  console.log('Quiz questions seeded.');

  // --- Seed other data if necessary (e.g., initial admin user, site settings, categories) ---
  // Example: Default Site Settings
  await prisma.siteSettings.upsert({
    where: { id: "global_settings" },
    update: {}, // No specific updates, just ensure it exists
    create: {
      id: "global_settings",
      siteName: "The Scent",
      // Add other default settings from your SiteSettings model
    },
  });
  console.log('Default site settings ensured.');


  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

