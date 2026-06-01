import { SignIn } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/clerk-config";

export default function SignInPage() {
  if (!isClerkConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center">
        <p>
          Set <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and{" "}
          <code>CLERK_SECRET_KEY</code> in <code>.env.local</code>
        </p>
      </div>
    );
  }
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
