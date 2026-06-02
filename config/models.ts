/** Free OpenRouter models to try when the primary hits rate limits. */
export const DEFAULT_FREE_MODEL_FALLBACKS = [
  "qwen/qwen3-coder:free",
  "google/gemma-4-31b-it:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "qwen/qwen3-4b:free",
  "openrouter/free",
] as const;

/** Very cheap paid model — good for testing (~$0.01–0.05 per full project). */
export const CHEAP_PAID_MODEL = "openai/gpt-4o-mini";

export function getModelChain(primary?: string): string[] {
  const primaryModel =
    primary?.trim() || process.env.OPENROUTER_MODEL?.trim() || "openrouter/free";

  const fromEnv = process.env.OPENROUTER_MODEL_FALLBACKS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const fallbacks = fromEnv?.length ? fromEnv : [...DEFAULT_FREE_MODEL_FALLBACKS];

  return [...new Set([primaryModel, ...fallbacks])];
}

export function isRateLimitError(message: string): boolean {
  return /429|rate.?limit|free model limit|quota|too many requests|capacity|temporarily unavailable|overloaded/i.test(
    message
  );
}
