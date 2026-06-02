/** Base URL for OpenRouter referer header (required for production API calls). */
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
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function getAiProvider(): "auto" | "openrouter" | "gemini" {
  const p = (env("AI_PROVIDER") ?? "auto").toLowerCase();
  if (p === "gemini" || p === "openrouter") return p;
  return "auto";
}

export function hasOpenRouterKey(): boolean {
  return Boolean(env("OPENROUTER_API_KEY"));
}

export function hasGeminiKey(): boolean {
  return Boolean(env("GEMINI_API_KEY"));
}

export function getMissingServerEnv(): string[] {
  const missing: string[] = [];
  const provider = getAiProvider();

  if (!env("DATABASE_URL")) missing.push("DATABASE_URL");

  if (provider === "gemini") {
    if (!hasGeminiKey()) {
      missing.push(
        "GEMINI_API_KEY (get free key at aistudio.google.com/apikey)"
      );
    }
  } else if (provider === "openrouter") {
    if (!hasOpenRouterKey()) {
      missing.push("OPENROUTER_API_KEY");
    }
  } else if (!hasOpenRouterKey() && !hasGeminiKey()) {
    missing.push(
      "GEMINI_API_KEY (free — aistudio.google.com/apikey) OR OPENROUTER_API_KEY"
    );
  }

  if (!env("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY")) {
    missing.push("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
  }
  if (!env("CLERK_SECRET_KEY")) missing.push("CLERK_SECRET_KEY");

  return missing;
}
