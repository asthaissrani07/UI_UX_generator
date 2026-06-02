/** Verified free models on OpenRouter (Jun 2026). */
export const DEFAULT_FREE_MODEL_FALLBACKS = [
  "qwen/qwen3-coder:free",
  "google/gemma-4-31b-it:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "openai/gpt-oss-20b:free",
  "google/gemma-4-26b-a4b-it:free",
  "openrouter/free",
] as const;

export const DEFAULT_AI_MODEL = "qwen/qwen3-coder:free";

/** Very cheap paid model — good for testing (~$0.01–0.05 per full project). */
export const CHEAP_PAID_MODEL = "openai/gpt-4o-mini";

export function getModelChain(primary?: string): string[] {
  const primaryModel =
    primary?.trim() ||
    process.env.OPENROUTER_MODEL?.trim() ||
    DEFAULT_AI_MODEL;

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

export function isModelNotFoundError(message: string): boolean {
  return /404|no endpoints found|model not found|does not exist|not a valid model/i.test(
    message
  );
}

export function isRetryableModelError(message: string): boolean {
  return isRateLimitError(message) || isModelNotFoundError(message);
}
