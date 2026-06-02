export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export function env(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v || undefined;
}

export function hasGroqKey(): boolean {
  return Boolean(env("GROQ_API_KEY"));
}

export function getMissingServerEnv(): string[] {
  const missing: string[] = [];

  if (!env("DATABASE_URL")) missing.push("DATABASE_URL");
  if (!hasGroqKey()) missing.push("GROQ_API_KEY");

  if (!env("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY")) {
    missing.push("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
  }
  if (!env("CLERK_SECRET_KEY")) missing.push("CLERK_SECRET_KEY");

  return missing;
}
