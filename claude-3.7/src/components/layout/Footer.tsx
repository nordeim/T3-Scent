// src/components/layout/Footer.tsx
"use client"; 

import Link from "next/link";
import React from "react";
import { FaFacebookF, FaInstagram, FaTwitter } from 'react-icons/fa';
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { api as clientApi } from "~/trpc/react"; // For newsletter submission
import { toast } from "react-hot-toast";
import { cn } from "~/lib/utils";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const newsletterMutation = clientApi.newsletter.subscribe.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "Successfully subscribed!");
      // e.currentTarget.reset(); // Cannot access form directly here
    },
    onError: (error) => {
      toast.error(error.message || "Subscription failed. Please try again.");
    },
  });

  const handleNewsletterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    newsletterMutation.mutate({ email });
    e.currentTarget.reset(); // Reset form after attempting submission
  };

  return (
    <footer className={cn(
        "bg-card text-card-foreground border-t border-border", // Use card as footer bg, similar to sample
        "dark:bg-background dark:text-foreground" // Dark mode specifics from sample_landing_page (darker footer)
    )}>
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-12 mb-10 md:mb-14">
          {/* Column 1: About/Brand */}
          <div className="sm:col-span-2 lg:col-span-1"> {/* Span 2 on small, 1 on large */}
            <Link href="/" className="inline-block mb-4">
              <span className="text-2xl font-bold font-head text-primary dark:text-primary">The Scent</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4 pr-4">
              Crafting natural aromatherapy experiences for your mind, body, and spirit. Inspired by nature's harmony.
            </p>
            <div className="flex space-x-4">
              <Link href="#" aria-label="Facebook" className="text-muted-foreground hover:text-primary transition-colors"><FaFacebookF size={18}/></Link>
              <Link href="#" aria-label="Instagram" className="text-muted-foreground hover:text-primary transition-colors"><FaInstagram size={18}/></Link>
              <Link href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary transition-colors"><FaTwitter size={18}/></Link>
            </div>
          </div>

          {/* Column 2: Shop Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase text-foreground tracking-wider mb-4 font-accent">Shop</h3>
            <ul className="space-y-2.5">
              <li><Link href="/products" className="text-sm text-muted-foreground hover:text-primary transition-colors">All Products</Link></li>
              <li><Link href="/collections/new-arrivals" className="text-sm text-muted-foreground hover:text-primary transition-colors">New Arrivals</Link></li>
              <li><Link href="/collections/best-sellers" className="text-sm text-muted-foreground hover:text-primary transition-colors">Best Sellers</Link></li>
              <li><Link href="/quiz" className="text-sm text-muted-foreground hover:text-primary transition-colors">Scent Quiz</Link></li>
              <li><Link href="/gift-cards" className="text-sm text-muted-foreground hover:text-primary transition-colors">Gift Cards</Link></li>
            </ul>
          </div>

          {/* Column 3: Customer Service */}
          <div>
            <h3 className="text-sm font-semibold uppercase text-foreground tracking-wider mb-4 font-accent">Support</h3>
            <ul className="space-y-2.5">
              <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link href="/faq" className="text-sm text-muted-foreground hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link href="/account/orders" className="text-sm text-muted-foreground hover:text-primary transition-colors">Order Tracking</Link></li>
              <li><Link href="/shipping-returns" className="text-sm text-muted-foreground hover:text-primary transition-colors">Shipping & Returns</Link></li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h3 className="text-sm font-semibold uppercase text-foreground tracking-wider mb-4 font-accent">Stay Connected</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Subscribe for wellness tips, new arrivals, and exclusive offers.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex items-center">
                <Input 
                    type="email" 
                    name="email" 
                    placeholder="Your email address" 
                    required
                    className="h-10 rounded-r-none focus-visible:ring-offset-0 !border-r-0 flex-1 min-w-0"
                    aria-label="Email for newsletter"
                />
                <Button 
                    type="submit" 
                    className="h-10 rounded-l-none"
                    aria-label="Subscribe to newsletter"
                    isLoading={newsletterMutation.isPending}
                    loadingText="Wait"
                >
                    Subscribe
                </Button>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">
                By subscribing, you agree to our <Link href="/privacy-policy" className="hover:text-primary underline">Privacy Policy</Link>.
            </p>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center md:flex md:justify-between md:items-center">
          <p className="text-sm text-muted-foreground mb-4 md:mb-0">
            &copy; {currentYear} The Scent LLC. All rights reserved.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/terms-of-service" className="text-xs text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="/privacy-policy" className="text-xs text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};