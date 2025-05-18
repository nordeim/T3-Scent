// src/components/common/NewsletterForm.tsx
"use client";

import React, { useState } from 'react';
import { Input } from '~/components/ui/Input';
import { Button } from '~/components/ui/Button';
import { api as clientApi } from '~/trpc/react'; // Using clientApi for client-side mutations
import { toast } from 'react-hot-toast';
import { FaEnvelope, FaSpinner } from 'react-icons/fa';

interface NewsletterFormProps {
  className?: string;
  compact?: boolean; // For a more compact version if needed
}

export const NewsletterForm = ({ className, compact = false }: NewsletterFormProps) => {
  const [email, setEmail] = useState('');

  const subscribeMutation = clientApi.newsletter.subscribe.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "Successfully subscribed to the newsletter!");
      setEmail(''); // Clear input on success
    },
    onError: (error) => {
      toast.error(error.message || "Subscription failed. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    subscribeMutation.mutate({ email });
  };

  if (compact) {
    return (
        <form onSubmit={handleSubmit} className={cn("flex w-full max-w-sm items-center space-x-2", className)}>
            <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={subscribeMutation.isPending}
            className="h-10 flex-1"
            aria-label="Email for newsletter"
            />
            <Button type="submit" disabled={subscribeMutation.isPending} size="icon" className="h-10 w-10" aria-label="Subscribe">
            {subscribeMutation.isPending ? <FaSpinner className="animate-spin h-4 w-4" /> : <FaEnvelope className="h-4 w-4" />}
            </Button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={cn("w-full max-w-lg mx-auto", className)}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="email"
          name="email"
          id="newsletter-email"
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={subscribeMutation.isPending}
          className="h-12 flex-1 px-4 text-base"
          aria-label="Email address for newsletter subscription"
        />
        <Button 
            type="submit" 
            disabled={subscribeMutation.isPending} 
            className="h-12 px-6 text-base"
            loadingText="Subscribing..."
            isLoading={subscribeMutation.isPending}
        >
          Subscribe
        </Button>
      </div>
      <p className="mt-3 text-xs text-center text-muted-foreground">
        By subscribing, you agree to our Privacy Policy. Unsubscribe at any time.
      </p>
    </form>
  );
};

// You'll need a tRPC router for newsletter:
// src/server/api/routers/newsletter.ts
// import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
// import { z } from "zod";
//
// export const newsletterRouter = createTRPCRouter({
//   subscribe: publicProcedure
//     .input(z.object({ email: z.string().email() }))
//     .mutation(async ({ ctx, input }) => {
//       // Check if email already exists
//       const existingSubscriber = await ctx.db.newsletterSubscriber.findUnique({
//         where: { email: input.email },
//       });
//       if (existingSubscriber) {
//         if (existingSubscriber.active) {
//            return { success: true, message: "You are already subscribed!" };
//         } else {
//            // Reactivate existing inactive subscriber
//            await ctx.db.newsletterSubscriber.update({
//                where: { email: input.email },
//                data: { active: true }
//            });
//            return { success: true, message: "Welcome back! You've been resubscribed." };
//         }
//       }
//       await ctx.db.newsletterSubscriber.create({
//         data: { email: input.email, active: true },
//       });
//       return { success: true, message: "Successfully subscribed!" };
//     }),
// });
//
// Remember to add newsletterRouter to your root.ts