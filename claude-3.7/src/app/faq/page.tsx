// src/app/faq/page.tsx
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ - The Scent",
  description: "Find answers to frequently asked questions about our products, shipping, and policies.",
};

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-10 text-center">
          Frequently Asked Questions
        </h1>
        
        <div className="space-y-8">
          {/* Question 1 */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">What are essential oils?</h2>
            <p className="text-muted-foreground">
              Essential oils are concentrated plant extracts that retain the natural smell and flavor, or "essence," of their source. They are obtained through distillation (via steam and/or water) or mechanical methods, such as cold pressing...
            </p>
          </div>

          {/* Question 2 */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">How do I use essential oils safely?</h2>
            <p className="text-muted-foreground">
              Always dilute essential oils with a carrier oil before applying to the skin. Perform a patch test first. Keep out of reach of children and pets. Some oils are not safe during pregnancy or for certain medical conditions. Consult a healthcare professional if unsure...
            </p>
          </div>
          
          {/* Add more questions and answers */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">What is your shipping policy?</h2>
            <p className="text-muted-foreground">
              We offer standard shipping (3-5 business days) and express shipping (1-2 business days). Orders over $50 qualify for free standard shipping... For more details, please visit our <a href="/shipping-returns" className="text-primary hover:underline">Shipping & Returns</a> page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}