// src/app/auth/signin/page.tsx
import { type Metadata } from "next";
import Link from "next/link"; 
import SignInFormClient from "./SignInFormClient"; 

export const metadata: Metadata = {
  title: "Sign In - The Scent",
  description: "Sign in to your The Scent account.",
};

interface SignInPageProps {
  searchParams?: { // searchParams itself is optional at the page level
    callbackUrl?: string;
    error?: string; 
  };
}

export default async function SignInPage(props: SignInPageProps) {
  // Adhering to the pattern of accessing searchParams from props for clarity with Next.js dynamic rendering.
  // Note: `props.searchParams` in Server Components is an object, not a promise.
  // The `async` nature of the Page component is key for Next.js.
  const searchParams = props.searchParams; 
  const error = searchParams?.error;
  const callbackUrl = searchParams?.callbackUrl;

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-muted/30 px-4 py-12 sm:px-6 lg:px-8 dark:bg-background">
      <div className="w-full max-w-md space-y-8">
        <div>
          <Link href="/" className="flex justify-center mb-6">
            <span className="text-2xl font-bold text-foreground">The Scent</span>
          </Link>
          <h2 className="text-center text-3xl font-bold tracking-tight text-foreground">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Or{' '}
            <Link href="/auth/signup" className="font-medium text-primary hover:text-primary/80">
              create a new account
            </Link>
          </p>
        </div>
        <SignInFormClient error={error} callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}