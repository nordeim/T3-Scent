// src/server/api/routers/quiz.ts
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { 
    type QuizQuestion as PrismaQuizQuestion, 
    QuizQuestionType as PrismaQuizQuestionType,
    type Prisma 
} from "@prisma/client";
import { TRPCError } from "@trpc/server";

const ZodQuizOptionSchema = z.object({
  id: z.string(),
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
      // const exhaustiveCheck: never = prismaType; // This causes type error if not all enum values are handled
      console.warn(`Unknown PrismaQuizQuestionType: ${prismaType as string} mapped to 'single'.`);
      return "single"; 
  }
}

export const quizRouter = createTRPCRouter({
  getAdvancedQuizQuestions: publicProcedure
    .query(async ({ ctx }): Promise<AdvancedQuizQuestionClient[]> => {
      try {
        const questionsFromDb = await ctx.db.quizQuestion.findMany({
          orderBy: { order: 'asc' },
        });

        if (questionsFromDb.length === 0) {
            return [];
        }
        
        return questionsFromDb.map((q, index) => {
          let parsedOptions: AdvancedQuizQuestionOption[] = [];
          try {
            if (q.options && Array.isArray(q.options)) {
              const optionsValidation = z.array(ZodQuizOptionSchema).safeParse(q.options);
              if (optionsValidation.success) {
                parsedOptions = optionsValidation.data;
              } else {
                console.error(`[QuizRouter] Invalid options JSON structure for QuizQuestion ID ${q.id} (DB index ${index}):`, optionsValidation.error.flatten().fieldErrors, "Raw options:", JSON.stringify(q.options).substring(0, 200));
              }
            } else if (q.options) { // Not an array but exists
                 console.error(`[QuizRouter] Options for QuizQuestion ID ${q.id} (DB index ${index}) is not an array:`, typeof q.options, JSON.stringify(q.options).substring(0,200));
            }
            // If q.options is null/undefined, parsedOptions remains [] which is acceptable.
          } catch (parseError) {
             console.error(`[QuizRouter] Critical error parsing options for QuizQuestion ID ${q.id} (DB index ${index}):`, parseError, "Raw options:", JSON.stringify(q.options).substring(0, 200));
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
        console.error("[QuizRouter] Failed to fetch or transform advanced quiz questions:", error);
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
          questionId: z.string(), // Changed from .cuid()
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
            answer: response.answer, 
            userId: userId, 
            sessionId: userId ? undefined : input.sessionId, 
        }));

        await ctx.db.quizResponse.createMany({
          data: createdResponsesData,
        });
        
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
              message: "Invalid question ID provided in responses. Please ensure questions exist.",
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