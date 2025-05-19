// src/app/account/profile/page.tsx
import { type Metadata } from "next";
import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
// import UserProfileClient from "./UserProfileClient"; // Component to handle form and updates

export const metadata: Metadata = {
  title: "My Profile - The Scent",
  description: "View and update your personal information and preferences.",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/account/profile");
  }

  // const serverApi = await createServerActionClient();
  // const userProfile = await serverApi.users.getProfile.query(); // Assuming this procedure exists

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-foreground mb-6">My Profile</h2>
      {/* <UserProfileClient initialProfile={userProfile} /> */}
      <div className="space-y-4">
        <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="text-foreground">{session.user.name || "Not set"}</p>
        </div>
        <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="text-foreground">{session.user.email || "Not set"}</p>
        </div>
        <div>
            <p className="text-sm text-muted-foreground">Role</p>
            <p className="text-foreground capitalize">{session.user.role?.toLowerCase() || "Customer"}</p>
        </div>
        <p className="text-sm text-muted-foreground pt-4">
            (Profile editing form placeholder. This page would typically render a client component 
            for form interactions and tRPC mutations to update profile data.)
        </p>
      </div>
    </div>
  );
}