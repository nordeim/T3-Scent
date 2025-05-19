// src/app/shipping-returns/page.tsx
import { type Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shipping & Returns - The Scent",
  description: "Information about our shipping policies, delivery times, and returns process for The Scent products.",
};

export default function ShippingReturnsPage() {
  return (
    <div className="container mx-auto min-h-[calc(100vh-theme(space.32))] px-4 py-12 md:py-16"> {/* Adjust min-h for navbar/footer height */}
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Shipping & Returns
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Everything you need to know about how we get our scents to you, and what to do if things aren't perfect.
        </p>
      </header>

      <div className="prose dark:prose-invert max-w-3xl mx-auto space-y-8">
        <section>
          <h2 className="text-2xl font-semibold">Shipping Policy</h2>
          <p>
            We are committed to delivering your aromatherapy products swiftly and safely. All orders are processed within 1-2 business days. You will receive a notification once your order has shipped.
          </p>
          <h3>Shipping Rates & Delivery Times:</h3>
          <ul>
            <li><strong>Standard Shipping (3-5 business days):</strong> $5.99 (Free for orders over $50)</li>
            <li><strong>Express Shipping (1-2 business days):</strong> $12.99</li>
            <li><strong>International Shipping:</strong> Rates and times vary by destination. Please proceed to checkout to see options for your country.</li>
          </ul>
          <p>
            Please note that delivery times are estimates and may vary due to carrier delays or unforeseen circumstances.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">Returns & Exchanges</h2>
          <p>
            Your satisfaction is our priority. If you're not completely happy with your purchase, we're here to help.
          </p>
          <h3>Our Guarantee:</h3>
          <p>
            We accept returns for most items within 30 days of receipt, provided they are unused and in their original packaging. Due to the nature of our products, some items like opened essential oils may not be eligible for return unless defective.
          </p>
          <h3>How to Initiate a Return:</h3>
          <ol>
            <li>Contact our support team at <Link href="mailto:support@thescent.example.com" className="text-primary hover:underline">support@thescent.example.com</Link> with your order number and reason for return.</li>
            <li>Our team will provide you with a return authorization and shipping instructions.</li>
            <li>Once we receive and inspect your returned item(s), we will process your refund or exchange.</li>
          </ol>
          <p>
            Customers are typically responsible for return shipping costs unless the item is defective or an error occurred on our part.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">Damaged or Incorrect Items</h2>
          <p>
            If you receive a damaged or incorrect item, please contact us immediately (within 7 days of receipt) with photos of the issue. We will arrange for a replacement or refund at no additional cost to you.
          </p>
        </section>
        
        <p className="text-center text-sm">
            For any further questions, please don't hesitate to <Link href="/contact" className="text-primary hover:underline">contact us</Link>.
        </p>
      </div>
    </div>
  );
}