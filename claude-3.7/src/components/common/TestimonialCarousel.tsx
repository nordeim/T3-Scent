// src/components/common/TestimonialCarousel.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaQuoteLeft } from 'react-icons/fa';
import { Button } from '~/components/ui/Button';
import { cn } from '~/lib/utils';

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role?: string;
  avatarUrl?: string;
}

// Sample data - in a real app, this would come from props or API
const sampleTestimonials: Testimonial[] = [
  {
    id: '1',
    quote: "The lavender essential oil transformed my sleep! I've never felt more rested. The quality is exceptional.",
    author: "Sarah M.",
    role: "Wellness Enthusiast",
    avatarUrl: "/images/avatars/avatar-1.jpg", // Placeholder path
  },
  {
    id: '2',
    quote: "I love the scent quiz! It helped me find the perfect diffuser blend for my home office. So uplifting!",
    author: "John B.",
    role: "Remote Worker",
    avatarUrl: "/images/avatars/avatar-2.jpg",
  },
  {
    id: '3',
    quote: "Customer service was amazing when I had a question about my order. The products arrived quickly and beautifully packaged.",
    author: "Lisa P.",
    role: "Loyal Customer",
    avatarUrl: "/images/avatars/avatar-3.jpg",
  },
];

interface TestimonialCarouselProps {
  testimonials?: Testimonial[];
  autoPlayInterval?: number; // in milliseconds, 0 to disable
}

export const TestimonialCarousel = ({ 
    testimonials = sampleTestimonials,
    autoPlayInterval = 5000 
}: TestimonialCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    );
  };

  const goToNext = React.useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
    );
  }, [testimonials.length]);

  useEffect(() => {
    if (autoPlayInterval && autoPlayInterval > 0 && testimonials.length > 1) {
      const timer = setTimeout(goToNext, autoPlayInterval);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, autoPlayInterval, goToNext, testimonials.length]);

  if (!testimonials || testimonials.length === 0) {
    return null; // Or a placeholder message
  }

  const currentTestimonial = testimonials[currentIndex];

  return (
    <div className="relative w-full max-w-3xl mx-auto overflow-hidden rounded-lg bg-card p-8 shadow-lg md:p-12">
      <FaQuoteLeft className="absolute top-6 left-6 h-8 w-8 text-primary/30 md:h-12 md:w-12" />
      
      <div className="relative min-h-[200px] flex flex-col items-center justify-center text-center transition-opacity duration-500 ease-in-out">
        {/* This is a simple fade transition. For slide, you'd need a more complex setup or a library. */}
        {currentTestimonial && (
          <div key={currentTestimonial.id} className="animate-fadeIn">
            {currentTestimonial.avatarUrl && (
              <img 
                src={currentTestimonial.avatarUrl} 
                alt={currentTestimonial.author} 
                className="w-20 h-20 md:w-24 md:h-24 rounded-full mx-auto mb-6 border-4 border-primary/20 shadow-md"
              />
            )}
            <p className="text-lg md:text-xl font-medium italic text-foreground mb-6">
              "{currentTestimonial.quote}"
            </p>
            <div className="font-semibold text-primary">{currentTestimonial.author}</div>
            {currentTestimonial.role && (
              <div className="text-sm text-muted-foreground">{currentTestimonial.role}</div>
            )}
          </div>
        )}
      </div>

      {testimonials.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-card/50 hover:bg-card/80 md:left-4"
            aria-label="Previous testimonial"
          >
            <FaChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-card/50 hover:bg-card/80 md:right-4"
            aria-label="Next testimonial"
          >
            <FaChevronRight className="h-5 w-5" />
          </Button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to testimonial ${index + 1}`}
                className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                  currentIndex === index ? "bg-primary" : "bg-muted-foreground/50 hover:bg-muted-foreground"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};