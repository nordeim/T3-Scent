// src/app/unauthorized/page.tsx
import { type Metadata } from "next";
import Link from "next/link";
import { Button } from "~/components/ui/Button";
import { FaExclamationTriangle } from "react-icons/fa";

export const metadata: Metadata = {
  title: "Unauthorized Access - The Scent",
  description: "You do not have permission to access this page.",
};

export default function UnauthorizedPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-12 text-center">
      <FaExclamationTriangle className="mb-6 h-16 w-16 text-destructive" />
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        Access Denied
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Sorry, you do not have the necessary permissions to view this page.
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <Button asChild>
          <Link href="/">Go back home</Link>
        </Button>
        <Button variant="link" asChild>
          <Link href="/contact">Contact support <span aria-hidden="true">&rarr;</span></Link>
        </Button>
      </div>
    </div>
  );
}