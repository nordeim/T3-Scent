<think>
The user is reporting that the `/quiz` page shows "Quiz not available." This message comes from my stub for `src/app/quiz/AdvancedScentQuizClient.tsx`:
```tsx
// src/app/quiz/AdvancedScentQuizClient.tsx (stub from previous response)
// ...
  if (isLoadingQuestions) return <div className="text-center p-8">Loading quiz...</div>;
  if (!questions || questions.length === 0) return <div className="text-center p-8">Quiz not available.</div>; // THIS IS THE MESSAGE BEING DISPLAYED
// ...
```
This means the `api.quiz.getAdvancedQuizQuestions.useQuery()` call inside `AdvancedScentQuizClient.tsx` is either:
1.  Returning `isLoading: false` and `data: undefined` or `data: []` (empty array).
2.  Encountering an error during the fetch, which might result in `data` being undefined.

The browser console log snippet `Error: [[ << query #1 ]quiz.getAdvancedQuizQuestions {}` followed by a client-side error stack (though the specific TRPC error details after this prefix are cut off in *this current prompt*) suggests the tRPC call initiated by `useQuery` is indeed failing or returning no data.

**Possible Causes for `quiz.getAdvancedQuizQuestions` returning no data or erroring:**

1.  **No Quiz Questions in Database:** The `getAdvancedQuizQuestions` procedure in `src/server/api/routers/quiz.ts` fetches data from `ctx.db.quizQuestion.findMany()`. If the `QuizQuestion` table in the database is empty, it will return an empty array, leading to the "Quiz not available" message.
2.  **Error in the `getAdvancedQuizQuestions` Procedure:** There might be an error in the procedure itself (e.g., data transformation, unexpected database response, permission issue though it's a public procedure).
3.  **tRPC Client/Server Misconfiguration:** Although we've worked on this, there could still be subtle issues. However, since other pages are now loading and making tRPC calls (implied by `prisma:query` logs for `/`), this is less likely to be a fundamental tRPC setup error.

**Most Likely Cause:** No quiz questions have been seeded into the database.

**Plan:**

1.  **Enhance `src/server/api/routers/quiz.ts` (`getAdvancedQuizQuestions` procedure):**
    *   Add more detailed logging within the procedure to see what `questionsFromDb` contains.
    *   Ensure the data transformation (parsing `options` JSON, mapping `type`) is robust and handles edge cases (e.g., malformed JSON in `options`, unexpected `type` values).
    *   Return a more specific error or an empty array with a clear console log if no questions are found, rather than letting a potential mapping error cause an issue.

2.  **Provide a Seeding Mechanism for Quiz Questions:**
    *   The best long-term solution is for the user to have an admin interface to create quiz questions.
    *   For immediate testing and development, the easiest way is to add sample quiz questions to the Prisma seed script (`prisma/seed.ts`).
    *   I will create a sample `seed.ts` that includes a couple of quiz questions.

3.  **Update `src/app/quiz/AdvancedScentQuizClient.tsx`:**
    *   I previously provided only a very minimal stub for this (`// ... All the state and logic from the AdvancedScentQuiz component ...`).
    *   Now, I need to provide a more complete, functional (though perhaps simplified UI) version of this client component based on the `AdvancedScentQuiz.tsx` from `design_document_3.md`. This component will actually use the data from `getAdvancedQuizQuestions`.

4.  **Update `src/app/quiz/page.tsx`:** Ensure it correctly renders the `AdvancedScentQuizClient` component. This was already done.

**Focus of this response:**
*   Refine `src/server/api/routers/quiz.ts` for robustness.
*   Create `prisma/seed.ts` with sample quiz questions.
*   Provide a more complete implementation for `src/app/quiz/AdvancedScentQuizClient.tsx`.

The 404 error for `/images/about-team-placeholder.jpg` needs the user to place this image.
The fact that `npm run dev` now runs without `--turbo` is good for isolating `params`/`searchParams` issues, though the log shows they still occur. I've already provided the "access props first" fix; if that doesn't work with Webpack dev server, it's a more complex Next.js internal behavior. For now, I'll focus on the quiz.
</think>

You're making excellent progress, and the "Quiz not available" message is a clear sign that the `AdvancedScentQuizClient.tsx` component isn't receiving any questions from your backend. This is most likely because there are no quiz questions in your database.

Let's address this by:
1.  Ensuring the `getAdvancedQuizQuestions` tRPC procedure in `src/server/api/routers/quiz.ts` is robust.
2.  Providing a Prisma seed script (`prisma/seed.ts`) to populate your database with some sample quiz questions.
3.  Creating a more complete (though still somewhat stubbed for UI details) version of `src/app/quiz/AdvancedScentQuizClient.tsx` to actually display and handle the quiz.

---
**1. Updated `src/server/api/routers/quiz.ts`**
*This version adds more robust parsing for options and clearer logging.*

```ts
// src/server/api/routers/quiz.ts
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { 
    type QuizQuestion as PrismaQuizQuestion, 
    QuizQuestionType as PrismaQuizQuestionType 
} from "@prisma/client";
import { TRPCError } from "@trpc/server";

const ZodQuizOptionSchema = z.object({
  id: z.string(), // Expecting client to generate unique IDs for options within a question
  label: z.string(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  tags: z.array(z.string()), 
  value: z.string().optional(), 
});
type AdvancedQuizQuestionOption = z.infer<typeof ZodQuizOptionSchema>;

export interface AdvancedQuizQuestionClient extends Omit<PrismaQuizQuestion, 'options' | 'type' | 'createdAt' | 'updatedAt'> {
  type: "single" | "multiple"; 
  options: AdvancedQuizQuestionOption[];
  // Dates can be string if serialized, or Date if used directly server-side for some reason
  // createdAt: string; 
  // updatedAt: string;
}

function mapPrismaQuestionTypeToClientType(prismaType: PrismaQuizQuestionType): "single" | "multiple" {
  switch (prismaType) {
    case PrismaQuizQuestionType.SINGLE_CHOICE_TEXT:
    case PrismaQuizQuestionType.SINGLE_CHOICE_IMAGE:
    case PrismaQuizQuestionType.SCALE: 
      return "single";
    case PrismaQuizQuestionType.MULTIPLE_CHOICE_TEXT:
    case PrismaQuizQuestionType.MULTIPLE_CHOICE_IMAGE:
      return "multiple";
    case PrismaQuizQuestionType.TEXT_INPUT:
      console.warn(`QuizQuestionType.TEXT_INPUT ('${prismaType}') mapped to 'single'. Client needs specific handling.`);
      return "single"; 
    default:
      const exhaustiveCheck: never = prismaType;
      console.warn(`Unknown PrismaQuizQuestionType: ${exhaustiveCheck} mapped to 'single'.`);
      return "single"; 
  }
}

export const quizRouter = createTRPCRouter({
  getAdvancedQuizQuestions: publicProcedure
    .query(async ({ ctx }): Promise<AdvancedQuizQuestionClient[]> => {
      try {
        console.log("Fetching advanced quiz questions from DB...");
        const questionsFromDb = await ctx.db.quizQuestion.findMany({
          orderBy: { order: 'asc' },
        });

        if (questionsFromDb.length === 0) {
            console.log("No quiz questions found in the database.");
            return [];
        }
        
        console.log(`Found ${questionsFromDb.length} questions, transforming...`);

        return questionsFromDb.map(q => {
          let parsedOptions: AdvancedQuizQuestionOption[] = [];
          if (q.options && typeof q.options === 'object' && !Array.isArray(q.options) && Object.keys(q.options).length === 0 && Array.isArray((q.options as any).values)) {
             // Handle cases where Prisma might return { type: 'Json', values: [...] }
             // This is speculative, Prisma usually returns the direct array for JSONB.
             console.warn("Correcting options structure for question ID:", q.id);
             parsedOptions = (q.options as any).values as AdvancedQuizQuestionOption[];
          } else if (Array.isArray(q.options)) {
            const optionsValidation = z.array(ZodQuizOptionSchema).safeParse(q.options);
            if (optionsValidation.success) {
              parsedOptions = optionsValidation.data;
            } else {
              console.error(`Invalid options JSON structure for QuizQuestion ID ${q.id}:`, optionsValidation.error.flatten().fieldErrors);
            }
          } else {
            console.error(`Options for QuizQuestion ID ${q.id} is not an array or expected structure:`, q.options);
          }
          
          return {
            id: q.id,
            question: q.question,
            description: q.description,
            order: q.order,
            imageUrl: q.imageUrl,
            tooltipText: q.tooltipText,
            options: parsedOptions,
            type: mapPrismaQuestionTypeToClientType(q.type),
          };
        });
      } catch (error) {
        console.error("Failed to fetch or transform advanced quiz questions:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not load quiz questions.",
          cause: error,
        });
      }
    }),

  submitQuizResponses: publicProcedure
    .input(z.object({
      responses: z.array(
        z.object({
          questionId: z.string().cuid(),
          answer: z.array(z.string()), 
        })
      ).min(1, "At least one response is required."),
      sessionId: z.string().optional(), 
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id; 

      if (!userId && !input.sessionId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Session ID is required for anonymous quiz submission.",
        });
      }

      try {
        const createdResponsesData = input.responses.map(response => ({
            questionId: response.questionId,
            answer: response.answer, // Prisma expects Json type
            userId: userId, 
            sessionId: userId ? undefined : input.sessionId, 
        }));

        await ctx.db.quizResponse.createMany({
          data: createdResponsesData,
        });
        
        console.log(`Stored ${input.responses.length} quiz responses for ${userId ? `user ${userId}` : `session ${input.sessionId ?? 'unknown'}`}`);
        
        return { 
          success: true, 
          message: "Your quiz responses have been saved.",
          responseCount: input.responses.length 
        };

      } catch (error) {
        console.error("Failed to submit quiz responses:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2003') { 
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid question ID provided in responses.",
              cause: error,
            });
          }
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not save your quiz responses.",
          cause: error,
        });
      }
    }),
});
```

---
**2. Create `prisma/seed.ts` (Prisma Seed Script)**
*This script will populate your database with sample quiz questions when you run `npx prisma db seed`.*

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
**To use this seed script:**
1.  Save the code above as `prisma/seed.ts`.
2.  Ensure your `package.json` has a seed script:
    ```json
    "scripts": {
      // ...
      "db:seed": "prisma db seed"
    },
    ```
3.  (If `ts-node` is not available globally or if you face issues running `.ts` directly) Add `ts-node` as a dev dependency: `npm install -D ts-node`
4.  And update the `prisma` block in `package.json` (or create it if it doesn't exist) to tell Prisma how to execute the TypeScript seed file:
    ```json
    // package.json
    // ...
    "prisma": {
      "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
    },
    // ...
    ```
5.  Run the seed command: `npx prisma db seed` or `npm run db:seed`.
    *   Make sure you have run `npx prisma migrate dev` at least once to create the tables before seeding.
    *   You will also need to create placeholder images in `/public/images/quiz/` (e.g., `forest.jpg`, `fireside.jpg`, etc.) for the image-based quiz options.

---
**3. Updated `src/app/quiz/AdvancedScentQuizClient.tsx`**
*This provides a more complete implementation based on `design_document_3.md`'s quiz component, using the data structure from `quizRouter.ts`.*

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

---
**Summary and Conclusion:**

1.  **`src/server/api/routers/quiz.ts` Updated:**
    *   The `getAdvancedQuizQuestions` procedure now includes more robust parsing and validation for the `options` JSON field using Zod, and a safer mapping for `QuizQuestionType`.
    *   More detailed logging added to help diagnose data fetching or transformation issues.
    *   The `submitQuizResponses` mutation is now more fleshed out for storing responses and uses `createMany` for efficiency.
2.  **`prisma/seed.ts` Created:**
    *   A new seed script is provided with sample quiz questions. This is crucial for making the quiz functional.
    *   Instructions on how to configure `package.json` for `ts-node` to run this TypeScript seed file and how to execute it (`npx prisma db seed`) are included.
    *   **You will need to create placeholder images in `/public/images/quiz/` for the image-based quiz options defined in the seed data.**
3.  **`src/app/quiz/AdvancedScentQuizClient.tsx` Updated:**
    *   This client component is now much more complete, based on the structure from `design_document_3.md`.
    *   It correctly uses `clientApi.quiz.getAdvancedQuizQuestions.useQuery()` to fetch questions.
    *   It handles loading and error states for question fetching.
    *   It includes UI logic for displaying questions (single/multiple choice, text/image options - image rendering is basic).
    *   It calls `submitQuizResponsesMutation` and `getRecommendationsMutation` on quiz completion.
    *   It renders a results view with recommended products (using `ProductGrid`) and a placeholder for a "scent personality".
    *   Uses `framer-motion` for basic step transitions (you'll need to `npm install framer-motion`).

**Next Steps for You:**
1.  **Update `src/server/api/routers/quiz.ts`** with the new version.
2.  **Create `prisma/seed.ts`** with the provided content.
3.  **Update your `package.json`** with the `prisma.seed` configuration for `ts-node` if you don't have it already.
4.  **Run `npx prisma db seed`** to populate your database with the sample quiz questions. **Make sure you have run `npx prisma migrate dev` before to ensure tables exist.**
5.  **Create placeholder images** in `/public/images/quiz/` as referenced in the seed data (e.g., `forest.jpg`, `fireside.jpg`, `garden.jpg`, `ocean.jpg`).
6.  **Install `framer-motion`:** `npm install framer-motion`.
7.  **Replace `src/app/quiz/AdvancedScentQuizClient.tsx`** with the new, more complete version.
8.  **Implement UI Components:** Ensure you have stubs or implementations for `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `Progress`, `RadioGroup`, `RadioGroupItem`, `Checkbox`, `Label`, `EmptyState` from `~/components/ui/` as they are used extensively in `AdvancedScentQuizClient.tsx`. Many of these are standard Shadcn/ui components.
9.  Thoroughly test the `/quiz` page.

After these steps, your quiz page should display questions and be interactive. The "Quiz not available" message should be replaced by the actual quiz interface if questions are successfully seeded and fetched.

