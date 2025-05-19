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