// src/app/about/page.tsx
import { type Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About Us - The Scent",
  description: "Learn about the mission, values, and story behind The Scent and our commitment to natural wellness.",
};

export default function AboutPage() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 bg-primary/10 dark:bg-primary-dark/20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Our Journey with Scent
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground">
            Discover the passion, philosophy, and people behind The Scent's commitment to natural well-being through aromatherapy.
          </p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight mb-4">The Essence of The Scent</h2>
              <p className="text-muted-foreground mb-4">
                Founded on the belief that nature holds the key to true wellness, The Scent began as a personal exploration into the healing power of aromatherapy. What started as a quest for balance and tranquility in a fast-paced world blossomed into a mission: to share the purest, most effective botanical essences with others.
              </p>
              <p className="text-muted-foreground mb-4">
                We meticulously source our ingredients from ethical growers around the globe, ensuring that every drop of essential oil and every handcrafted product meets our exacting standards for purity and potency. Our blends are artfully composed, not just for their delightful aromas, but for their ability to soothe, uplift, and rejuvenate.
              </p>
              <p className="text-muted-foreground">
                At The Scent, we're more than just a brand; we're a community dedicated to mindful living and the profound connection between scent and well-being.
              </p>
            </div>
            <div className="relative h-80 md:h-96 rounded-lg overflow-hidden shadow-xl">
              <Image 
                src="/images/about-team-placeholder.jpg" // Replace with actual image in public/images
                alt="The Scent team or founder placeholder" 
                fill 
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold tracking-tight">Our Core Values</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Guiding principles that shape every product and interaction at The Scent.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-card rounded-lg shadow-sm">
              {/* Placeholder Icon */} <span className="text-3xl text-primary">🌿</span>
              <h3 className="text-xl font-semibold mt-4 mb-2">Purity & Quality</h3>
              <p className="text-sm text-muted-foreground">Sourcing the finest natural ingredients, rigorously tested for authenticity and efficacy.</p>
            </div>
            <div className="text-center p-6 bg-card rounded-lg shadow-sm">
              {/* Placeholder Icon */} <span className="text-3xl text-primary">🌍</span>
              <h3 className="text-xl font-semibold mt-4 mb-2">Ethical & Sustainable</h3>
              <p className="text-sm text-muted-foreground">Committed to responsible sourcing, eco-friendly packaging, and cruelty-free practices.</p>
            </div>
            <div className="text-center p-6 bg-card rounded-lg shadow-sm">
              {/* Placeholder Icon */} <span className="text-3xl text-primary">💡</span>
              <h3 className="text-xl font-semibold mt-4 mb-2">Mindful Craftsmanship</h3>
              <p className="text-sm text-muted-foreground">Thoughtfully formulating blends that support holistic well-being and sensory delight.</p>
            </div>
          </div>
        </div>
      </section>
      {/* Add more sections as needed: Our Team, Our Process, Community Involvement, etc. */}
    </div>
  );
}