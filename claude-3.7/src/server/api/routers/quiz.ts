// src/server/api/routers/quiz.ts
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { type QuizQuestion as PrismaQuizQuestion } from "@prisma/client"; // Assuming Prisma type

// Define expected shape for AdvancedQuizQuestion based on component usage
// This should align with your actual Prisma model if it's more detailed
interface AdvancedQuizQuestionOption {
  id: string;
  label: string;
  description?: string;
  imageUrl?: string;
  tags: string[]; // Important for recommendation logic
  value?: string; // if value is different from id for submission
}

interface AdvancedQuizQuestion extends Omit<PrismaQuizQuestion, 'options' | 'type'> {
  type: "single" | "multiple"; // Or your QuizQuestionType enum
  options: AdvancedQuizQuestionOption[];
}


export const quizRouter = createTRPCRouter({
  getAdvancedQuizQuestions: publicProcedure
    .query(async ({ ctx }): Promise<AdvancedQuizQuestion[]> => {
      // Placeholder: Fetch advanced quiz questions from the database
      // This should match the structure expected by AdvancedScentQuiz.tsx
      const questionsFromDb = await ctx.db.quizQuestion.findMany({
        orderBy: { order: 'asc' },
        // Include any necessary relations or select specific fields
      });

      // Transform data if needed to match AdvancedQuizQuestion type
      return questionsFromDb.map(q => ({
        ...q,
        // Ensure options are parsed correctly if stored as JSON string
        options: (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) as AdvancedQuizQuestionOption[],
        type: q.type as "single" | "multiple", // Cast to the more specific type
      }));
    }),

  // Example: submitQuizResponse (if you want to store individual responses as they happen)
  // submitQuizResponse: publicProcedure
  //   .input(z.object({
  //     questionId: z.string(),
  //     answer: z.array(z.string()), // Array of selected option IDs
  //     sessionId: z.string().optional(),
  //   }))
  //   .mutation(async ({ ctx, input }) => {
  //     const userId = ctx.session?.user?.id;
  //     await ctx.db.quizResponse.create({
  //       data: {
  //         questionId: input.questionId,
  //         answer: input.answer, // Storing as JSON array
  //         userId: userId,
  //         sessionId: userId ? undefined : input.sessionId,
  //       },
  //     });
  //     return { success: true };
  //   }),
});