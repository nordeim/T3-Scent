// src/app/gift-cards/page.tsx
import { type Metadata } from "next";
import Image from "next/image";
import Link from "next/link"; // <<<<----- CORRECTED: Added this import
import { Button } from "~/components/ui/Button"; 

export const metadata: Metadata = {
  title: "Gift Cards - The Scent",
  description: "Give the gift of choice with The Scent gift cards. Perfect for any occasion.",
};

export default function GiftCardsPage() {
  const giftCardOptions = [
    // Ensure these image paths will exist in your /public/images/ directory
    { amount: 25, imageUrl: "/images/gift_card_25.jpg", altText: "A beautifully designed $25 The Scent gift card" }, 
    { amount: 50, imageUrl: "/images/gift_card_50.jpg", altText: "A beautifully designed $50 The Scent gift card" },
    { amount: 100, imageUrl: "/images/gift_card_100.jpg", altText: "A beautifully designed $100 The Scent gift card" },
    { amount: 200, imageUrl: "/images/gift_card_200.jpg", altText: "A beautifully designed $200 The Scent gift card" },
  ];

  return (
    <div className="container mx-auto min-h-[calc(100vh-theme(space.32))] px-4 py-12 md:py-16">
      <header className="mb-10 md:mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl font-head">
          The Scent Gift Cards
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto font-body">
          Share the gift of tranquility and well-being. Our gift cards are perfect for any occasion and let your loved ones choose their favorite scents.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {giftCardOptions.map((option) => (
          <div key={option.amount} className="rounded-lg border border-border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col group transition-all hover:shadow-xl hover:transform hover:-translate-y-1">
            <div className="relative aspect-video w-full overflow-hidden"> {/* Added overflow-hidden */}
              <Image 
                src={option.imageUrl} 
                alt={option.altText} 
                fill 
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            </div>
            <div className="p-6 flex flex-col flex-grow">
              <h2 className="text-2xl font-semibold text-foreground font-head">${option.amount} Gift Card</h2>
              <p className="text-sm text-muted-foreground mt-2 mb-4 flex-grow font-body">
                Redeemable for any product on our store. Delivered instantly by email with instructions.
              </p>
              <Button className="w-full mt-auto font-accent">
                Purchase ${option.amount} Card
              </Button>
            </div>
          </div>
        ))}
      </div>

      <section className="mt-16 md:mt-24 text-center max-w-3xl mx-auto bg-muted/50 dark:bg-card p-8 rounded-lg shadow">
        <h2 className="text-2xl font-semibold text-foreground font-head mb-6">How It Works</h2>
        <ol className="space-y-4 text-muted-foreground text-left font-body list-decimal list-inside">
          <li>Choose your desired gift card amount and complete your purchase.</li>
          <li>You'll instantly receive an email containing the unique gift card code.</li>
          <li>Forward the email or share the code with your lucky recipient.</li>
          <li>They can redeem it at checkout to experience the world of The Scent!</li>
        </ol>
        <p className="mt-8 text-sm text-muted-foreground font-body">
          Our gift cards are non-refundable and do not expire. 
          For any questions, please don't hesitate to <Link href="/contact" className="text-primary hover:underline font-semibold">contact our support team</Link>.
        </p>
      </section>
    </div>
  );
}
