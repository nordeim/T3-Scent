// src/server/api/routers/quiz.ts
import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { 
    type QuizQuestion as PrismaQuizQuestion, 
    QuizQuestionType as PrismaQuizQuestionType 
} from "@prisma/client";
import { TRPCError } from "@trpc/server";

// Define the structure of options as stored in PrismaQuizQuestion.options (JSONB)
// This Zod schema can be used for validation if desired.
const ZodQuizOptionSchema = z.object({
  id: z.string().cuid(), // Assuming options also have CUIDs if they are separate entities or need unique keys
  label: z.string(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  tags: z.array(z.string()), // Tags associated with choosing this option
  value: z.string().optional(), // Optional value if different from label/id for submission
});
type AdvancedQuizQuestionOption = z.infer<typeof ZodQuizOptionSchema>;

// Define the shape of the question object returned to the client
interface AdvancedQuizQuestion extends Omit<PrismaQuizQuestion, 'options' | 'type'> {
  type: "single" | "multiple"; // Simplified type for client rendering logic
  options: AdvancedQuizQuestionOption[];
}

// Helper function to map Prisma's detailed QuizQuestionType to simpler client types
function mapPrismaQuestionTypeToClientType(prismaType: PrismaQuizQuestionType): "single" | "multiple" {
  switch (prismaType) {
    case PrismaQuizQuestionType.SINGLE_CHOICE_TEXT:
    case PrismaQuizQuestionType.SINGLE_CHOICE_IMAGE:
    case PrismaQuizQuestionType.SCALE: // Assuming scale is a single selection
      return "single";
    case PrismaQuizQuestionType.MULTIPLE_CHOICE_TEXT:
    case PrismaQuizQuestionType.MULTIPLE_CHOICE_IMAGE:
      return "multiple";
    case PrismaQuizQuestionType.TEXT_INPUT:
      // TEXT_INPUT might need special handling or a different client type.
      // For now, defaulting to "single" if it were to be rendered similarly,
      // but AdvancedScentQuizClient might not support it directly.
      // Consider filtering these out or adding client support.
      console.warn(`QuizQuestionType.TEXT_INPUT ('${prismaType}') mapped to 'single'. Client may need specific handling.`);
      return "single"; 
    default:
      // Exhaustive check, should not happen if all enum members are covered
      console.warn(`Unknown PrismaQuizQuestionType: ${prismaType} mapped to 'single'.`);
      return "single"; 
  }
}

export const quizRouter = createTRPCRouter({
  /**
   * Fetches all quiz questions, formatted for the AdvancedScentQuizClient.
   */
  getAdvancedQuizQuestions: publicProcedure
    .query(async ({ ctx }): Promise<AdvancedQuizQuestion[]> => {
      try {
        const questionsFromDb = await ctx.db.quizQuestion.findMany({
          orderBy: { order: 'asc' },
          // You might want to select only necessary fields if the model becomes very large
        });

        return questionsFromDb.map(q => {
          let parsedOptions: AdvancedQuizQuestionOption[] = [];
          try {
            // Prisma typically returns JSON(B) fields as parsed JS objects/arrays.
            // This validation step is good practice.
            const optionsArray = z.array(ZodQuizOptionSchema).safeParse(q.options);
            if (optionsArray.success) {
              parsedOptions = optionsArray.data;
            } else {
              console.error(`Invalid options format for QuizQuestion ID ${q.id}:`, optionsArray.error.flatten());
              // Depending on strictness, you might throw, return empty options, or filter this question.
              // For now, returning empty options for this question if parsing fails.
            }
          } catch (e) {
            console.error(`Error parsing options for QuizQuestion ID ${q.id}:`, e);
            // Return empty options for this question if parsing fails
          }
          
          return {
            ...q,
            options: parsedOptions,
            type: mapPrismaQuestionTypeToClientType(q.type),
          };
        });
      } catch (error) {
        console.error("Failed to fetch advanced quiz questions:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not load quiz questions. Please try again later.",
          cause: error,
        });
      }
    }),

  /**
   * Submits a user's (or anonymous session's) responses to the quiz.
   * This procedure is for storing the raw responses.
   * Generating recommendations based on these might be a separate step or router.
   */
  submitQuizResponses: publicProcedure // publicProcedure as anonymous users can take quiz
    .input(z.object({
      responses: z.array(
        z.object({
          questionId: z.string().cuid(),
          // `answer` in QuizResponse model is JSON. Client sends selected option IDs/values.
          // Assuming client sends array of selected option IDs (or values if `value` field is used in option)
          answer: z.array(z.string()), 
        })
      ).min(1, "At least one response is required."),
      sessionId: z.string().optional(), // For anonymous users
      // Potentially add quizVersionId if quizzes can change over time
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id; // Get logged-in user ID if available

      if (!userId && !input.sessionId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Either a user session or a quiz sessionId is required to submit responses.",
        });
      }

      try {
        // Use a transaction if you're creating multiple related records
        // For QuizResponse, each answer is usually a separate record.
        const createdResponses = await ctx.db.$transaction(
          input.responses.map(response =>
            ctx.db.quizResponse.create({
              data: {
                questionId: response.questionId,
                answer: response.answer, // Storing as JSON array (as defined in Prisma schema `answer Json`)
                userId: userId, // Will be null if user is not logged in
                sessionId: userId ? undefined : input.sessionId, // Only store sessionId if no userId
                // Potentially link to a QuizAttempt record if you have one
              },
            })
          )
        );
        
        console.log(`Stored ${createdResponses.length} quiz responses for ${userId ? `user ${userId}` : `session ${input.sessionId ?? 'unknown'}`}`);
        
        // Note: The `recommendationsRouter.getQuizRecommendations` also handles storing responses
        // in design_document_2.md. This creates a duplication of responsibility.
        // Ideally, this `quizRouter.submitQuizResponses` should be the single source for storing.
        // Then, `getQuizRecommendations` would take a `quizResponseSetId` or `sessionId`/`userId`
        // to fetch these stored responses and generate recommendations.
        // For now, this procedure just stores the raw responses.

        return { 
          success: true, 
          message: "Your quiz responses have been saved.",
          responseCount: createdResponses.length 
        };

      } catch (error) {
        console.error("Failed to submit quiz responses:", error);
        // Check for specific Prisma errors, e.g., if a questionId doesn't exist
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2003') { // Foreign key constraint failed
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid question ID provided in responses.",
              cause: error,
            });
          }
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not save your quiz responses. Please try again.",
          cause: error,
        });
      }
    }),
});
