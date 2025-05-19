// src/app/gift-cards/page.tsx
import { type Metadata } from "next";
import Image from "next/image";
import { Button } from "~/components/ui/Button"; // Assuming Button component

export const metadata: Metadata = {
  title: "Gift Cards - The Scent",
  description: "Give the gift of choice with The Scent gift cards. Perfect for any occasion.",
};

export default function GiftCardsPage() {
  // Placeholder gift card amounts
  const giftCardOptions = [
    { amount: 25, imageUrl: "/images/giftcard-25.jpg" }, // Ensure these images exist
    { amount: 50, imageUrl: "/images/giftcard-50.jpg" },
    { amount: 100, imageUrl: "/images/giftcard-100.jpg" },
    { amount: 200, imageUrl: "/images/giftcard-200.jpg" },
  ];

  return (
    <div className="container mx-auto min-h-[calc(100vh-theme(space.32))] px-4 py-12 md:py-16">
      <header className="mb-10 md:mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          The Scent Gift Cards
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Share the gift of tranquility and well-being. Our gift cards are perfect for any occasion and let your loved ones choose their favorite scents.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {giftCardOptions.map((option) => (
          <div key={option.amount} className="rounded-lg border border-border bg-card shadow-sm overflow-hidden flex flex-col">
            <div className="relative aspect-video w-full">
              <Image 
                src={option.imageUrl} 
                alt={`The Scent Gift Card - $${option.amount}`} 
                fill 
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            </div>
            <div className="p-6 flex flex-col flex-grow">
              <h2 className="text-2xl font-semibold text-foreground">${option.amount} Gift Card</h2>
              <p className="text-sm text-muted-foreground mt-2 mb-4 flex-grow">
                Redeemable for any product on our store. Delivered by email with instructions.
              </p>
              <Button className="w-full mt-auto">
                Purchase ${option.amount} Card
              </Button>
            </div>
          </div>
        ))}
      </div>

      <section className="mt-16 md:mt-24 text-center max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold text-foreground mb-4">How It Works</h2>
        <ol className="space-y-3 text-muted-foreground text-left">
          <li>1. Choose the gift card amount and complete your purchase.</li>
          <li>2. You'll receive an email with the gift card code and a printable version.</li>
          <li>3. Forward the email or share the code with the recipient.</li>
          <li>4. They can redeem it at checkout for their favorite The Scent products!</li>
        </ol>
        <p className="mt-6 text-sm text-muted-foreground">
          Gift cards are non-refundable and do not expire.
          If you have questions, please <Link href="/contact" className="text-primary hover:underline">contact us</Link>.
        </p>
      </section>
    </div>
  );
}