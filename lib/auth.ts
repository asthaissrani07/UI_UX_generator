import { auth, currentUser } from "@clerk/nextjs/server";

export async function getUserEmail(): Promise<string | null> {
  const user = await currentUser();
  return user?.primaryEmailAddress?.emailAddress ?? null;
}

/** Personal/dev build: all features unlocked. Set ENABLE_BILLING_LIMITS=true to restore SaaS gates. */
export async function hasPremiumAccess(): Promise<boolean> {
  if (process.env.ENABLE_BILLING_LIMITS === "true") {
    const { has } = await auth();
    return has({ plan: "unlimited" });
  }
  return true;
}
