// src/app/terms-of-service/page.tsx
import { type Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service - The Scent",
  description: "Read the Terms of Service for using The Scent website and purchasing our products.",
};

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto min-h-[calc(100vh-theme(space.32))] px-4 py-12 md:py-16">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Please read these terms carefully before using our services.
        </p>
        <p className="text-xs text-muted-foreground mt-2">Last Updated: October 27, 2023</p>
      </header>

      <div className="prose dark:prose-invert max-w-3xl mx-auto space-y-6">
        <section>
          <h2 className="text-xl font-semibold">1. Agreement to Terms</h2>
          <p>
            By accessing or using our website and services, you agree to be bound by these Terms of Service and our <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>. If you do not agree to all the terms and conditions, then you may not access the website or use any services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">2. Use of Our Service</h2>
          <p>
            The Scent grants you a limited, non-exclusive, non-transferable, and revocable license to use our service for your personal, non-commercial use, subject to these Terms. You agree not to reproduce, duplicate, copy, sell, resell or exploit any portion of the Service, use of the Service, or access to the Service without express written permission by us.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold">3. Products or Services</h2>
          <p>
            Certain products or services may be available exclusively online through the website. These products or services may have limited quantities and are subject to return or exchange only according to our <Link href="/shipping-returns" className="text-primary hover:underline">Return Policy</Link>. We have made every effort to display as accurately as possible the colors and images of our products. We cannot guarantee that your computer monitor's display of any color will be accurate.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">4. Accuracy of Billing and Account Information</h2>
          <p>
            We reserve the right to refuse any order you place with us. We may, in our sole discretion, limit or cancel quantities purchased per person, per household or per order. You agree to provide current, complete and accurate purchase and account information for all purchases made at our store.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold">5. Intellectual Property</h2>
          <p>
            The Service and its original content, features and functionality are and will remain the exclusive property of The Scent and its licensors.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">6. Limitation of Liability</h2>
          <p>
            In no case shall The Scent, our directors, officers, employees, affiliates, agents, contractors, interns, suppliers, service providers or licensors be liable for any injury, loss, claim, or any direct, indirect, incidental, punitive, special, or consequential damages of any kind... (Standard legal boilerplate).
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold">7. Governing Law</h2>
          <p>
            These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed in accordance with the laws of [Your State/Country].
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">8. Changes to Terms of Service</h2>
          <p>
            You can review the most current version of the Terms of Service at any time at this page. We reserve the right, at our sole discretion, to update, change or replace any part of these Terms of Service by posting updates and changes to our website.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold">9. Contact Information</h2>
          <p>
            Questions about the Terms of Service should be sent to us at <Link href="mailto:legal@thescent.example.com" className="text-primary hover:underline">legal@thescent.example.com</Link> or through our <Link href="/contact" className="text-primary hover:underline">contact page</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}