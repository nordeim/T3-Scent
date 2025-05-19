// src/app/privacy-policy/page.tsx
import { type Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy - The Scent",
  description: "Read The Scent's privacy policy to understand how we collect, use, and protect your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto min-h-[calc(100vh-theme(space.32))] px-4 py-12 md:py-16">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Your privacy is important to us. This policy explains how we handle your personal data.
        </p>
         <p className="text-xs text-muted-foreground mt-2">Last Updated: October 27, 2023</p>
      </header>

      <div className="prose dark:prose-invert max-w-3xl mx-auto space-y-6">
        <section>
          <h2 className="text-xl font-semibold">1. Introduction</h2>
          <p>
            Welcome to The Scent. We are committed to protecting your privacy and ensuring that your personal information is handled in a safe and responsible manner. This Privacy Policy outlines how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">2. Information We Collect</h2>
          <p>
            We may collect personal information that you voluntarily provide to us when you register on the website, place an order, subscribe to our newsletter, respond to a survey, fill out a form, or otherwise interact with us. This may include:
          </p>
          <ul>
            <li>Contact Data: Name, email address, postal address, phone number.</li>
            <li>Account Data: Username, password, purchase history.</li>
            <li>Payment Data: Payment card details (processed securely by our payment gateway, Stripe). We do not store full card numbers.</li>
            <li>Usage Data: Information about how you use our website and services, IP address, browser type, operating system.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">3. How We Use Your Information</h2>
          <p>
            We use the information we collect in various ways, including to:
          </p>
          <ul>
            <li>Provide, operate, and maintain our website and services.</li>
            <li>Process your transactions and manage your orders.</li>
            <li>Improve, personalize, and expand our website and services.</li>
            <li>Understand and analyze how you use our website.</li>
            <li>Develop new products, services, features, and functionality.</li>
            <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the website, and for marketing and promotional purposes (with your consent where required).</li>
            <li>Send you emails.</li>
            <li>Find and prevent fraud.</li>
          </ul>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold">4. Sharing Your Information</h2>
          <p>
            We do not sell, trade, or otherwise transfer to outside parties your Personally Identifiable Information unless we provide users with advance notice. This does not include website hosting partners and other parties who assist us in operating our website, conducting our business, or serving our users, so long as those parties agree to keep this information confidential. We may also release information when it's release is appropriate to comply with the law, enforce our site policies, or protect ours or others' rights, property or safety.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">5. Data Security</h2>
          <p>
            We implement a variety of security measures to maintain the safety of your personal information when you place an order or enter, submit, or access your personal information. All sensitive/credit information you supply is encrypted via Secure Socket Layer (SSL) technology and processed through a gateway provider and is not stored or processed on our servers.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold">6. Your Data Rights</h2>
          <p>
            Depending on your location, you may have certain rights regarding your personal data, such as the right to access, correct, delete, or restrict its processing. To exercise these rights, please <Link href="/contact" className="text-primary hover:underline">contact us</Link>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">7. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">8. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please <Link href="/contact" className="text-primary hover:underline">contact us</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}