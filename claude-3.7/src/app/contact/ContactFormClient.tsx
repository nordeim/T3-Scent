// src/app/contact/ContactFormClient.tsx
"use client";

import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Textarea } from "~/components/ui/Textarea"; // Assuming Textarea UI component
import { Label } from "~/components/ui/Label"; // Assuming Label UI component
import { toast } from "react-hot-toast";
// import { api as clientApi } from "~/trpc/react"; // If submitting via tRPC

export default function ContactForm() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Placeholder for tRPC mutation
  // const contactMutation = clientApi.messaging.sendContactForm.useMutation({
  //   onSuccess: () => {
  //     toast.success("Your message has been sent! We'll get back to you soon.");
  //     setFormData({ name: "", email: "", subject: "", message: "" });
  //   },
  //   onError: (error) => {
  //     toast.error(error.message || "Failed to send message. Please try again.");
  //   },
  //   onSettled: () => {
  //     setIsSubmitting(false);
  //   }
  // });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    // contactMutation.mutate(formData);
    // Placeholder logic:
    await new Promise(res => setTimeout(res, 1000));
    console.log("Contact form submitted:", formData);
    toast.success("Message sent (placeholder)! We'll get back to you soon.");
    setFormData({ name: "", email: "", subject: "", message: "" });
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required disabled={isSubmitting} />
      </div>
      <div>
        <Label htmlFor="email">Email Address</Label>
        <Input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required disabled={isSubmitting} />
      </div>
      <div>
        <Label htmlFor="subject">Subject</Label>
        <Input type="text" name="subject" id="subject" value={formData.subject} onChange={handleChange} required disabled={isSubmitting} />
      </div>
      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea name="message" id="message" rows={5} value={formData.message} onChange={handleChange} required disabled={isSubmitting} />
      </div>
      <div>
        <Button type="submit" className="w-full" isLoading={isSubmitting} loadingText="Sending...">
          Send Message
        </Button>
      </div>
    </form>
  );
}