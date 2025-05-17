// src/components/layout/Footer.tsx
import Link from "next/link";
import React from "react";
// import { FaFacebook, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa'; // Example icons

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/60 dark:bg-muted/30 border-t border-border">
      <div className="container py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-8">
          {/* Column 1: About/Brand */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">The Scent</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Discover handcrafted aromatherapy for wellness and self-care.
            </p>
            {/* Social Icons Placeholder 
            <div className="flex space-x-3 mt-4">
              <a href="#" aria-label="Facebook" className="text-muted-foreground hover:text-primary"><FaFacebook size={20}/></a>
              <a href="#" aria-label="Instagram" className="text-muted-foreground hover:text-primary"><FaInstagram size={20}/></a>
              <a href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary"><FaTwitter size={20}/></a>
            </div>
            */}
          </div>

          {/* Column 2: Shop Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase text-foreground tracking-wider mb-3">Shop</h3>
            <ul className="space-y-2">
              <li><Link href="/products" className="text-sm text-muted-foreground hover:text-primary">All Products</Link></li>
              <li><Link href="/collections/new-arrivals" className="text-sm text-muted-foreground hover:text-primary">New Arrivals</Link></li>
              <li><Link href="/collections/best-sellers" className="text-sm text-muted-foreground hover:text-primary">Best Sellers</Link></li>
              <li><Link href="/quiz" className="text-sm text-muted-foreground hover:text-primary">Scent Quiz</Link></li>
            </ul>
          </div>

          {/* Column 3: Customer Service */}
          <div>
            <h3 className="text-sm font-semibold uppercase text-foreground tracking-wider mb-3">Support</h3>
            <ul className="space-y-2">
              <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-primary">Contact Us</Link></li>
              <li><Link href="/faq" className="text-sm text-muted-foreground hover:text-primary">FAQ</Link></li>
              <li><Link href="/shipping-returns" className="text-sm text-muted-foreground hover:text-primary">Shipping & Returns</Link></li>
              <li><Link href="/privacy-policy" className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Column 4: Newsletter (Placeholder) */}
          <div>
            <h3 className="text-sm font-semibold uppercase text-foreground tracking-wider mb-3">Newsletter</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Subscribe for updates and exclusive offers.
            </p>
            {/* <NewsletterForm /> // Placeholder for NewsletterForm component */}
            <form onSubmit={(e) => e.preventDefault()} className="flex">
                <input type="email" placeholder="Your email" className="flex-grow rounded-l-md border-border p-2 text-sm focus:ring-primary focus:border-primary" />
                <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-r-md text-sm hover:bg-primary/90">
                    Subscribe
                </button>
            </form>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} The Scent. All rights reserved.
          </p>
          {/* Optional: payment icons, etc. */}
        </div>
      </div>
    </footer>
  );
};