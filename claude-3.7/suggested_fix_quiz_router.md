<think>
The user has provided the content of `src/server/api/routers/quiz.ts` that I previously generated as a stub. They want me to review it, validate it, and provide a complete and updated version if necessary, especially considering the client-side error `<< query #1 ]quiz.getAdvancedQuizQuestions {}` which hinted at a potential issue with this procedure or its invocation.

**Review of the existing `src/server/api/routers/quiz.ts`:**

1.  **Imports:** `createTRPCRouter`, `publicProcedure`, `z`, `PrismaQuizQuestion`. These are fine.
2.  **Type Definitions (`AdvancedQuizQuestionOption`, `AdvancedQuizQuestion`):**
    *   These interfaces are defined to shape the data returned to the client (`AdvancedScentQuizClient.tsx`).
    *   `AdvancedQuizQuestion` omits `options` and `type` from `PrismaQuizQuestion` and redefines them.
    *   `PrismaQuizQuestion.options` is `Json`. The code correctly attempts to parse it: `(typeof q.options === 'string' ? JSON.parse(q.options) : q.options) as AdvancedQuizQuestionOption[]`. This is a common pattern but relies on the JSON string stored in the database being an array of objects matching `AdvancedQuizQuestionOption`.
    *   `PrismaQuizQuestion.type` is an enum `QuizQuestionType`. The code casts it: `type: q.type as "single" | "multiple"`. The `AdvancedScentQuiz.tsx` (from `design_document_3.md`) expects `type: "single" | "multiple"`. My Prisma enum `QuizQuestionType` was more detailed (`SINGLE_CHOICE_TEXT`, etc.). This needs reconciliation. The client component `AdvancedScentQuiz` probably only cares about the single/multiple distinction for rendering radio buttons vs checkboxes. The more specific enum types are good for DB storage and potentially for backend logic.
    *   **Potential Issue:** If `q.options` is already a parsed JSON object from Prisma (which it usually is if the DB type is `JSONB`), then `typeof q.options === 'string'` will be false, and it will directly cast `q.options as AdvancedQuizQuestionOption[]`. This assumes the structure in the DB perfectly matches `AdvancedQuizQuestionOption[]`. This is generally okay if the data is seeded correctly.

3.  **`getAdvancedQuizQuestions` Procedure:**
    *   It's a `publicProcedure`, which is appropriate for a quiz accessible to anyone.
    *   It fetches all `quizQuestion` from the DB, ordered by `order`. This is good.
    *   The `map` function transforms the DB data.
    *   **Return Type:** `Promise<AdvancedQuizQuestion[]>`. This matches the client's expectation.

4.  **Client-Side Error `<< query #1 ]quiz.getAdvancedQuizQuestions {}`:**
    *   This error in the browser console usually indicates that the tRPC client initiated a query, but the log line itself is just the start of the tRPC logger output. The *actual error* would typically follow this line in the console (e.g., "No procedure found," "Internal server error," or a Zod validation error if the output didn't match).
    *   The user's last full error log did *not* contain the full error details *after* this `<< query #1 ...` line for the quiz. It was followed by other errors.
    *   However, if this procedure *was* causing a "No procedure found" type error, it would imply it's not correctly registered in `appRouter` or there's a path mismatch. Assuming it *is* registered (as per my `root.ts` stubs), the problem might be an *internal error within the procedure itself* that causes tRPC to not return a valid response, which the client then interprets in a way that looks like a procedure not found or a generic failure.

**Potential Improvements and Validation Points for `quizRouter.ts`:**

1.  **Reconcile `QuizQuestionType` Enum:**
    *   Prisma: `enum QuizQuestionType { SINGLE_CHOICE_TEXT, MULTIPLE_CHOICE_TEXT, SINGLE_CHOICE_IMAGE, MULTIPLE_CHOICE_IMAGE, SCALE, TEXT_INPUT }`
    *   `AdvancedQuizQuestion.type`: `"single" | "multiple"`
    *   The `AdvancedScentQuizClient.tsx` from `design_document_3.md` had logic like:
        ```typescript
        // currentQuestion.type: "single" | "multiple"
        // ...
        {currentQuestion.type === "single" ? ( <RadioGroup> ... ) : ( <Checkbox> ... ) }
        ```
    *   The mapping `type: q.type as "single" | "multiple"` is too broad and unsafe. We need to map the specific Prisma enum values to the simpler "single" or "multiple" that the client component expects.
    *   For example, `SINGLE_CHOICE_TEXT` and `SINGLE_CHOICE_IMAGE` map to `"single"`. `MULTIPLE_CHOICE_TEXT` and `MULTIPLE_CHOICE_IMAGE` map to `"multiple"`. `SCALE` might be treated as "single" (if it's like a radio button scale) or might need special client handling. `TEXT_INPUT` is neither and might need its own type on the client or be filtered out if the client doesn't support it.

2.  **JSON Parsing for `options`:**
    *   Prisma with PostgreSQL `JSONB` type usually returns the JSON as a parsed JavaScript object/array, not a string. So, `typeof q.options === 'string'` will likely always be false.
    *   The direct cast `q.options as AdvancedQuizQuestionOption[]` is okay if the data integrity is guaranteed. For robustness, it would be better to validate the structure of each option using Zod, especially if the `options` JSON comes from an admin interface where malformed data could be entered. For a stub, the direct cast is acceptable if we assume well-formed data.

3.  **Error Handling within the Procedure:** Add a `try...catch` block within the query handler for robustness, though tRPC handles most errors automatically.

4.  **Completeness of `AdvancedQuizQuestionOption`:**
    *   The interface `AdvancedQuizQuestionOption` includes `id: string; label: string; description?: string; imageUrl?: string; tags: string[]; value?: string;`. This should be the structure stored in the `options` JSON array in the `QuizQuestion` table.

**Plan for Update:**

1.  **Refine Type Mapping for `QuizQuestion.type`:** Implement a proper mapping from the Prisma `QuizQuestionType` enum to the client-expected `"single" | "multiple"` string literal union. Handle or filter out types not directly supported by the client component's current logic (like `SCALE` or `TEXT_INPUT` if they need special rendering).
2.  **JSON `options` Parsing/Validation (Optional but good practice):** For a more robust solution, I'd iterate through `q.options` and validate each element against a Zod schema for `AdvancedQuizQuestionOption`. For this "fully working stub" request, I'll keep the direct cast but add a comment about validation.
3.  **Add `submitQuizResponse` procedure:** The commented-out `submitQuizResponse` procedure should be uncommented and made functional as it's used by `AdvancedScentQuizClient.tsx` (the client calls `submitQuiz.mutate({ responses: formattedResponses, sessionId })` which implies a mutation on a `quiz` or `recommendations` router). `design_document_2.md` had `api.quiz.submitResponse.useMutation`.
    *   The `recommendationsRouter` from `design_document_2.md` *also* had a `getQuizRecommendations` mutation that took responses and stored them. This is a conflict of responsibility.
    *   **Decision:** It's cleaner for `quizRouter` to handle quiz response *submission/storage*, and for `recommendationsRouter` to handle *generating recommendations based on* those (or other) inputs. So, `quizRouter` should have a mutation to store responses.
    *   The `QuizResponse.answer` in Prisma is `Json`. It should store an array of selected option *IDs* or *values*. The client formulates this.

Let's proceed with the updated `quizRouter.ts`.
</think>

You're right to focus on `quizRouter.ts`, especially if client-side calls to its procedures are causing issues or if its stub needs to be more robust for the `AdvancedScentQuizClient` component.

Here's a complete and updated version of `src/server/api/routers/quiz.ts`. This version includes:
1.  A more robust mapping for `QuizQuestion.type`.
2.  A note on validating the `options` JSON structure.
3.  A functional `submitQuizResponses` mutation (renamed for clarity from the earlier `submitResponse` stub) to store user's quiz answers.

---
**Updated `src/server/api/routers/quiz.ts`**

```ts
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
```

**Explanation of Changes and Review:**

1.  **`AdvancedQuizQuestionOption` & `AdvancedQuizQuestion` Types:**
    *   `AdvancedQuizQuestionOption` is now defined using `z.infer<typeof ZodQuizOptionSchema>`. This leverages Zod for defining the shape, which can also be used for runtime validation if needed.
    *   The `AdvancedQuizQuestion` interface remains to clearly define the shape expected by the client.

2.  **`mapPrismaQuestionTypeToClientType` Helper:**
    *   This function now correctly maps the more detailed `PrismaQuizQuestionType` enum values (e.g., `SINGLE_CHOICE_TEXT`, `MULTIPLE_CHOICE_IMAGE`) to the simpler `"single"` or `"multiple"` strings that `AdvancedScentQuizClient.tsx` expects for rendering logic.
    *   It includes a `console.warn` for unhandled or ambiguously mapped types (like `TEXT_INPUT`), reminding that the client component might need specific logic for them or they should be filtered.

3.  **`getAdvancedQuizQuestions` Procedure:**
    *   **Options Parsing/Validation:** Instead of a simple cast `q.options as AdvancedQuizQuestionOption[]`, it now uses `z.array(ZodQuizOptionSchema).safeParse(q.options)`. This provides runtime validation that the JSON data stored in the `options` field of `QuizQuestion` actually matches the expected `AdvancedQuizQuestionOption` structure. If parsing/validation fails for a question's options, it logs an error and returns empty options for that question (this behavior can be adjusted, e.g., to filter out the question or throw an error). This makes the procedure more robust to malformed data in the database.
    *   **Type Mapping:** Uses the new `mapPrismaQuestionTypeToClientType` helper.
    *   **Error Handling:** Wrapped the database call and mapping in a `try...catch` block to return a more user-friendly tRPC error if fetching fails.

4.  **`submitQuizResponses` Mutation (Previously Commented Out):**
    *   This procedure is now fully implemented. It's a `publicProcedure` because anonymous users can take the quiz.
    *   **Input:** Takes an array of responses, where each response includes `questionId` and `answer` (which is an array of strings, e.g., selected option IDs). It also takes an optional `sessionId`.
    *   **Logic:**
        *   Requires either a logged-in user (`userId`) or a `sessionId`.
        *   Uses `ctx.db.$transaction` to create multiple `QuizResponse` records, one for each answer provided. This ensures atomicity.
        *   Stores `response.answer` (the array of selected option IDs/values) directly into the `QuizResponse.answer` JSON field.
    *   **Note on Responsibility:** I've added a comment highlighting the potential overlap with `recommendationsRouter.getQuizRecommendations` (from `design_document_2.md`) which also seemed to store responses. This `quizRouter.submitQuizResponses` is now the dedicated place to store raw quiz answers. The recommendations router would then consume these.
    *   **Error Handling:** Includes basic error handling for database operations and input validation.

**Verification Against Client-Side Error:**
The client-side error `<< query #1 ]quiz.getAdvancedQuizQuestions {}` (if it was followed by a "No procedure found" or an internal server error from this procedure) should be addressed if:
*   The procedure name and path (`quiz.getAdvancedQuizQuestions`) match exactly what the client (`AdvancedScentQuizClient.tsx` using `api.quiz.getAdvancedQuizQuestions.useQuery()`) is calling. (This seems correct).
*   The `quizRouter` is correctly imported and added to `appRouter` in `src/server/api/root.ts`. (My previous `root.ts` stub included this).
*   The procedure now runs without internal errors (e.g., due to malformed options JSON or incorrect type mapping). The added Zod validation for options and the refined type mapping should make it more robust.

---
**Summary and Conclusion:**

The `src/server/api/routers/quiz.ts` file has been significantly updated:
*   **Type Safety and Mapping:** Implemented a robust mapping from the detailed Prisma `QuizQuestionType` enum to the simpler `"single" | "multiple"` types expected by the client component.
*   **Data Validation:** Added Zod-based validation for the structure of the `options` JSON data retrieved from the database, making the `getAdvancedQuizQuestions` procedure more resilient to malformed data.
*   **Error Handling:** Incorporated `try...catch` blocks in `getAdvancedQuizQuestions` for better error reporting.
*   **`submitQuizResponses` Mutation:** Fully implemented this mutation to allow storing quiz answers in the database, handling both authenticated users and anonymous sessions. This provides the backend support for the quiz submission functionality in `AdvancedScentQuizClient.tsx`.
*   **Code Clarity:** Added comments and refined logic for better understanding and maintenance.

This updated `quizRouter.ts` should provide a solid backend for your advanced scent quiz feature and hopefully resolve any server-side issues related to the `quiz.getAdvancedQuizQuestions` tRPC call. Remember to ensure it's correctly registered in your `src/server/api/root.ts`.

---
https://drive.google.com/file/d/10qxhCB7k2c3G73SUaEIfKVKSqgWSjkQo/view?usp=sharing, https://drive.google.com/file/d/19R6AOLUeAYzo73Zkt5WTqLrdQLvjfEq9/view?usp=sharing, https://drive.google.com/file/d/1CStMFip4olEr25G2Dnf2qi6In2rG10uE/view?usp=sharing, https://drive.google.com/file/d/1M29mvmeDZQQ5X72Yfx2_0-vycXBG5pF8/view?usp=sharing, https://drive.google.com/file/d/1NC4s3DVR1LDzX-LCZlMMd5NrShFBidnd/view?usp=sharing, https://aistudio.google.com/app/prompts?state=%7B%22ids%22:%5B%221QNYodene0vrlxMvFDFKJ0CSSeS2lX2t2%22%5D,%22action%22:%22open%22,%22userId%22:%22103961307342447084491%22,%22resourceKeys%22:%7B%7D%7D&usp=sharing, https://drive.google.com/file/d/1bBoDvYW3h0V7U0Qa5Q49Yhsfa5VxC7E_/view?usp=sharing, https://drive.google.com/file/d/1qxPDWhlmzq9-R3H1YDAVwCyPjpwQ4ZJO/view?usp=sharing, https://drive.google.com/file/d/1ygJBpjxQV2uG9MM784epU5zfih3Cnjz3/view?usp=sharing

