import { getAppUrl } from "@/lib/app-url";
import { extractMessageText } from "@/lib/ai-content";
import {
  DEFAULT_AI_MODEL,
  HOBBY_REQUEST_TIMEOUT_MS,
  getModelChain,
  isModelNotFoundError,
  isRateLimitError,
  isRetryableModelError,
  pickModelForAttempt,
} from "@/config/models";

export const AI_MODEL =
  process.env.OPENROUTER_MODEL?.trim() || DEFAULT_AI_MODEL;

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatOnceOptions = {
  maxTokens?: number;
  timeoutMs?: number;
};

export async function openRouterChatOnce(
  messages: ChatMessage[],
  model: string,
  options: ChatOnceOptions = {}
): Promise<string> {
  const maxTokens = options.maxTokens ?? 4096;
  const timeoutMs = options.timeoutMs ?? HOBBY_REQUEST_TIMEOUT_MS;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
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
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error(`OpenRouter timeout (${model}) after ${timeoutMs}ms`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }

  const body = (await res.json()) as {
    error?: { message?: string; code?: number };
    choices?: Array<{
      message?: { content?: string | unknown[] };
      finish_reason?: string;
    }>;
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
    throw new Error(`OpenRouter error (${model}): ${body.error.message}`);
  }

  const choice = body.choices?.[0];
  const text = extractMessageText(choice?.message?.content).trim();

  if (!text) {
    const reason = choice?.finish_reason ?? "unknown";
    throw new Error(
      `OpenRouter returned an empty response (${model}, finish: ${reason})`
    );
  }

  return text;
}

/** One model per call — use modelAttempt on client to rotate (fits Vercel Hobby 10s). */
export async function openRouterChatForAttempt(
  messages: ChatMessage[],
  modelAttempt = 0,
  maxTokens = 4096,
  timeoutMs = HOBBY_REQUEST_TIMEOUT_MS
): Promise<{ text: string; model: string }> {
  const model = pickModelForAttempt(modelAttempt);
  const text = await openRouterChatOnce(messages, model, { maxTokens, timeoutMs });
  return { text, model };
}

/** Full chain in one request — only for config / local dev with long timeouts. */
export async function openRouterChat(
  messages: ChatMessage[],
  model = AI_MODEL,
  maxTokens = 4096
): Promise<string> {
  const chain = getModelChain(model);
  let lastError: Error | null = null;

  for (const candidate of chain.slice(0, 3)) {
    try {
      return await openRouterChatOnce(messages, candidate, {
        maxTokens,
        timeoutMs: HOBBY_REQUEST_TIMEOUT_MS,
      });
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      if (isRetryableModelError(errMsg) && chain.indexOf(candidate) < chain.length - 1) {
        console.warn(`[OpenRouter] ${candidate} failed: ${errMsg}`);
        lastError = e instanceof Error ? e : new Error(errMsg);
        continue;
      }
      throw e;
    }
  }

  throw (
    lastError ??
    new Error(
      "All AI models failed. Wait and retry, or add $5 OpenRouter credits (openai/gpt-4o-mini)."
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
  if (/empty response/i.test(errMsg)) {
    return "AI returned empty output — auto-retrying with another model usually fixes this.";
  }
  if (isRateLimitError(errMsg) || /All AI models failed/i.test(errMsg)) {
    return "Free AI limit reached. Wait 1–2 hours, or add $5 OpenRouter credits for gpt-4o-mini.";
  }
  if (/DATABASE_URL|connection|ECONNREFUSED/i.test(errMsg)) {
    return "Database connection failed. Check DATABASE_URL on Vercel.";
  }
  if (/relation .* does not exist|no such table/i.test(errMsg)) {
    return "Database tables missing. Run npm run db:push on production DATABASE_URL.";
  }
  if (/timeout|ETIMEDOUT|FUNCTION_INVOCATION_TIMEOUT|504|Gateway Timeout/i.test(errMsg)) {
    return "Request timed out (Vercel Hobby ≈10s limit). Retrying automatically — or upgrade Vercel Pro for 60s.";
  }
  if (/value too long|character varying/i.test(errMsg)) {
    return "Database field limit exceeded. Retry — this build truncates long values.";
  }
  if (/404|No endpoints found|model not found/i.test(errMsg)) {
    return "Invalid OPENROUTER_MODEL. Try: meta-llama/llama-3.2-3b-instruct:free or qwen/qwen3-coder:free";
  }
  if (errMsg.includes("OpenRouter")) {
    return errMsg.slice(0, 220);
  }

  return `Generation failed: ${errMsg.slice(0, 180)}`;
}
