/** Fast free models first — critical for Vercel Hobby ~10s function limit. */
export const DEFAULT_FREE_MODEL_FALLBACKS = [
  "meta-llama/llama-3.2-3b-instruct:free",
  "openai/gpt-oss-20b:free",
  "google/gemma-4-26b-a4b-it:free",
  "qwen/qwen3-coder:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-4-31b-it:free",
  "openrouter/free",
] as const;

/** Default — fast model to avoid 504 on Vercel Hobby. Override on Vercel for quality. */
export const DEFAULT_AI_MODEL = "meta-llama/llama-3.2-3b-instruct:free";

export const CHEAP_PAID_MODEL = "openai/gpt-4o-mini";

/** Stay under Vercel Hobby 10s wall (ms). */
export const HOBBY_REQUEST_TIMEOUT_MS = 9000;

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

export function pickModelForAttempt(attempt = 0, primary?: string): string {
  const chain = getModelChain(primary);
  return chain[attempt % chain.length];
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

export function isEmptyResponseError(message: string): boolean {
  return /empty response|no content|no choices/i.test(message);
}

export function isTimeoutError(message: string): boolean {
  return /timeout|timed out|AbortError|FUNCTION_INVOCATION|504|deadline/i.test(
    message
  );
}

export function isRetryableModelError(message: string): boolean {
  return (
    isRateLimitError(message) ||
    isModelNotFoundError(message) ||
    isEmptyResponseError(message) ||
    isTimeoutError(message)
  );
}
