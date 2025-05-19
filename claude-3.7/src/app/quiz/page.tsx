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