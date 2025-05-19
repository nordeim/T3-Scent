// src/app/account/subscriptions/page.tsx
import { type Metadata } from "next";
import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import SubscriptionManager from "~/components/subscription/SubscriptionManager"; // The client component

export const metadata: Metadata = {
  title: "My Subscriptions - The Scent",
  description: "Manage your product subscriptions and recurring deliveries.",
};

export default async function SubscriptionsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/account/subscriptions");
  }

  return (
    <div> {/* No extra card wrapper here, SubscriptionManager might have its own */}
      <SubscriptionManager />
    </div>
  );
}