// src/app/auth/signin/SignInFormClient.tsx
"use client";
import { signIn, getProviders } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Label } from "~/components/ui/Label";
import { FaGoogle, FaEnvelope, FaLock } from "react-icons/fa";
import { toast } from "react-hot-toast";

interface Provider {
  id: string;
  name: string;
  type: string;
}

interface SignInFormClientProps {
  error?: string;
  callbackUrl?: string;
}

export default function SignInFormClient({ error: initialError, callbackUrl }: SignInFormClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams(); // Alternative way to get error/callbackUrl client-side
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(initialError || null);
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null);

  useEffect(() => {
    const serverError = searchParams?.get("error");
    if (serverError) {
      const errorMessages: { [key: string]: string } = {
        CredentialsSignin: "Invalid email or password. Please try again.",
        OAuthSignin: "Error signing in with OAuth provider.",
        // Add more specific error messages as needed
      };
      setAuthError(errorMessages[serverError] || "An unknown authentication error occurred.");
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchProviders() {
      const res = await getProviders();
      setProviders(res);
    }
    fetchProviders().catch(console.error);
  }, []);

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);
    try {
      const result = await signIn("credentials", {
        redirect: false, // Handle redirect manually for better UX
        email,
        password,
        callbackUrl: callbackUrl || "/",
      });
      if (result?.error) {
        setAuthError(result.error === "CredentialsSignin" ? "Invalid email or password." : result.error);
        toast.error(result.error === "CredentialsSignin" ? "Invalid email or password." : result.error);
      } else if (result?.ok && result.url) {
        toast.success("Signed in successfully!");
        router.push(result.url); // Navigate to callbackUrl or dashboard
      } else {
        // Should not happen if no error and no url
        setAuthError("Sign in failed. Please try again.");
      }
    } catch (err) {
      setAuthError("An unexpected error occurred during sign in.");
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = (providerId: string) => {
    setIsLoading(true); // Set loading for OAuth as well
    signIn(providerId, { callbackUrl: callbackUrl || "/" }).catch(err => {
        setIsLoading(false);
        toast.error(`Failed to sign in with ${providerId}.`);
        console.error("OAuth sign in error", err);
    });
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
      {authError && (
        <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-center text-sm text-destructive">
          {authError}
        </div>
      )}
      <form onSubmit={handleCredentialsSignIn} className="space-y-6">
        <div>
          <Label htmlFor="email">Email address</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} leftIcon={<FaEnvelope className="h-4 w-4" />} />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} leftIcon={<FaLock className="h-4 w-4"/>} />
        </div>
        <div className="flex items-center justify-between">
          {/* <div className="flex items-center">
            <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">Remember me</label>
          </div> */}
          <div className="text-sm">
            <a href="/auth/forgot-password" className="font-medium text-primary hover:text-primary/80">
              Forgot your password?
            </a>
          </div>
        </div>
        <Button type="submit" className="w-full" isLoading={isLoading} loadingText="Signing in...">
          Sign in
        </Button>
      </form>

      {providers && Object.values(providers).some(p => p.type === "oauth") && (
         <>
            <div className="my-6">
                <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
                </div>
            </div>
            <div className="space-y-3">
                {Object.values(providers).map((provider) => {
                if (provider.type === "oauth" && provider.id === "google") { // Only show Google for this example
                    return (
                    <Button key={provider.name} variant="outline" className="w-full" onClick={() => handleOAuthSignIn(provider.id)} disabled={isLoading}>
                        <FaGoogle className="mr-2 h-4 w-4" /> Sign in with {provider.name}
                    </Button>
                    );
                }
                return null;
                })}
            </div>
         </>
      )}
    </div>
  );
}