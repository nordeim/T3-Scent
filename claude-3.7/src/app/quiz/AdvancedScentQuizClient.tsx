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