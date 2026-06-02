import { getAppUrl } from "@/lib/app-url";
import { extractMessageText } from "@/lib/ai-content";
import {
  DEFAULT_AI_MODEL,
  getModelChain,
  isModelNotFoundError,
  isRateLimitError,
  isRetryableModelError,
} from "@/config/models";

export const AI_MODEL =
  process.env.OPENROUTER_MODEL?.trim() || DEFAULT_AI_MODEL;

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

async function openRouterChatOnce(
  messages: ChatMessage[],
  model: string,
  maxTokens: number
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": getAppUrl(),
      "X-Title": "UIUX Mock Generator",
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      max_tokens: maxTokens,
    }),
  });

  const body = (await res.json()) as {
    error?: { message?: string; code?: number };
    choices?: Array<{ message?: { content?: string | unknown[] } }>;
  };

  const detail = body.error?.message ?? res.statusText;

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error(`OpenRouter auth failed (${res.status}): ${detail}`);
    }
    if (res.status === 402) {
      throw new Error(`OpenRouter credits exhausted: ${detail}`);
    }
    if (res.status === 429 || isRateLimitError(detail)) {
      throw new Error(`OpenRouter rate limit (${model}): ${detail}`);
    }
    if (res.status === 404 || isModelNotFoundError(detail)) {
      throw new Error(`OpenRouter model not found (${model}): ${detail}`);
    }
    throw new Error(`OpenRouter error (${res.status}): ${detail}`);
  }

  if (body.error?.message) {
    if (isRateLimitError(body.error.message)) {
      throw new Error(`OpenRouter rate limit (${model}): ${body.error.message}`);
    }
    if (isModelNotFoundError(body.error.message)) {
      throw new Error(`OpenRouter model not found (${model}): ${body.error.message}`);
    }
    throw new Error(`OpenRouter error: ${body.error.message}`);
  }

  const text = extractMessageText(body.choices?.[0]?.message?.content).trim();
  if (!text) {
    throw new Error("OpenRouter returned an empty response");
  }

  return text;
}

/** Tries primary model, then free fallbacks when rate-limited. */
export async function openRouterChat(
  messages: ChatMessage[],
  model = AI_MODEL,
  maxTokens = 8192
): Promise<string> {
  const chain = getModelChain(model);
  let lastError: Error | null = null;

  for (const candidate of chain) {
    try {
      return await openRouterChatOnce(messages, candidate, maxTokens);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      if (isRetryableModelError(errMsg) && chain.indexOf(candidate) < chain.length - 1) {
        console.warn(`[OpenRouter] ${candidate} unavailable — trying next model`);
        lastError = e instanceof Error ? e : new Error(errMsg);
        continue;
      }
      throw e;
    }
  }

  throw (
    lastError ??
    new Error(
      "All free models are rate-limited. Wait an hour, switch OPENROUTER_MODEL, or add $5 credits at openrouter.ai"
    )
  );
}

export function formatServerError(e: unknown): string {
  const errMsg =
    e instanceof Error
      ? e.message
      : typeof e === "string"
        ? e
        : "Unknown error";

  if (errMsg.includes("OPENROUTER_API_KEY")) {
    return "OpenRouter API key is not configured on Vercel";
  }
  if (/OpenRouter auth failed|401|403|invalid.*key/i.test(errMsg)) {
    return "OpenRouter rejected the API key. Check OPENROUTER_API_KEY on Vercel.";
  }
  if (/402|credits exhausted|insufficient/i.test(errMsg)) {
    return "OpenRouter credits exhausted. Add ~$5 at openrouter.ai/settings/credits and set OPENROUTER_MODEL=openai/gpt-4o-mini";
  }
  if (isRateLimitError(errMsg) || /All free models are rate-limited/i.test(errMsg)) {
    return "Free AI limit reached on all fallback models. Wait 1–2 hours, set OPENROUTER_MODEL=qwen/qwen3-coder:free, or add $5 OpenRouter credits for gpt-4o-mini.";
  }
  if (/DATABASE_URL|connection|ECONNREFUSED/i.test(errMsg)) {
    return "Database connection failed. Check DATABASE_URL on Vercel.";
  }
  if (/relation .* does not exist|no such table/i.test(errMsg)) {
    return "Database tables missing. Run npm run db:push on production DATABASE_URL.";
  }
  if (/timeout|ETIMEDOUT|FUNCTION_INVOCATION_TIMEOUT|504|Gateway Timeout/i.test(errMsg)) {
    return "AI request timed out. Vercel Hobby limits functions to ~10s — retrying usually works, or upgrade Vercel Pro for 60s timeouts.";
  }
  if (/value too long|character varying/i.test(errMsg)) {
    return "Database field limit exceeded. Retry — this build truncates long values.";
  }
  if (/404|No endpoints found|model not found/i.test(errMsg)) {
    return `Invalid OPENROUTER_MODEL on Vercel. Set exactly: qwen/qwen3-coder:free (no quotes, no spaces). Old IDs like google/gemma-3-27b-it:free no longer work.`;
  }
  if (errMsg.includes("OpenRouter error")) {
    return errMsg;
  }

  return `Config generation failed: ${errMsg.slice(0, 180)}`;
}
