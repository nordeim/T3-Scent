// src/app/contact/page.tsx
import { type Metadata } from "next";
import ContactForm from "./ContactFormClient"; // Client component for the form

export const metadata: Metadata = {
  title: "Contact Us - The Scent",
  description: "Get in touch with The Scent customer support team. We're here to help with your inquiries.",
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Get In Touch</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            We'd love to hear from you! Whether you have a question about our products, an order, or just want to share your scent story, reach out to us.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Contact Information */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Our Office</h2>
              <p className="text-muted-foreground">
                123 Aroma Lane<br />
                Wellness City, SC 12345<br />
                United States
              </p>
              {/* <p className="text-sm text-muted-foreground mt-1">(Visits by appointment only)</p> */}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Email Us</h2>
              <a href="mailto:support@thescent.example.com" className="text-primary hover:underline">
                support@thescent.example.com
              </a>
              <p className="text-sm text-muted-foreground mt-1">We typically respond within 24 hours.</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Call Us</h2>
              <a href="tel:+18005550199" className="text-primary hover:underline">
                +1 (800) 555-0199
              </a>
              <p className="text-sm text-muted-foreground mt-1">Mon - Fri, 9am - 5pm EST</p>
            </div>
            {/* Optional: Social Media Links */}
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Send Us a Message</h2>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}