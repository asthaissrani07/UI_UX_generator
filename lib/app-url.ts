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

export type AiProvider = "groq" | "gemini" | "openrouter" | "auto";

export function getAiProvider(): AiProvider {
  const p = (env("AI_PROVIDER") ?? "auto").toLowerCase();
  if (p === "groq" || p === "gemini" || p === "openrouter") return p;
  return "auto";
}

export function hasOpenRouterKey(): boolean {
  return Boolean(env("OPENROUTER_API_KEY"));
}

export function hasGeminiKey(): boolean {
  return Boolean(env("GEMINI_API_KEY"));
}

export function hasGroqKey(): boolean {
  return Boolean(env("GROQ_API_KEY"));
}

export function getMissingServerEnv(): string[] {
  const missing: string[] = [];
  const provider = getAiProvider();

  if (!env("DATABASE_URL")) missing.push("DATABASE_URL");

  if (provider === "groq" && !hasGroqKey()) {
    missing.push("GROQ_API_KEY");
  } else if (provider === "gemini" && !hasGeminiKey()) {
    missing.push("GEMINI_API_KEY");
  } else if (provider === "openrouter" && !hasOpenRouterKey()) {
    missing.push("OPENROUTER_API_KEY");
  } else if (!hasGroqKey() && !hasGeminiKey() && !hasOpenRouterKey()) {
    missing.push("GROQ_API_KEY or GEMINI_API_KEY or OPENROUTER_API_KEY");
  }

  if (!env("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY")) {
    missing.push("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
  }
  if (!env("CLERK_SECRET_KEY")) missing.push("CLERK_SECRET_KEY");

  return missing;
}
