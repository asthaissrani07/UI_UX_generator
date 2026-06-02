import { getAppUrl } from "@/lib/app-url";
import { extractMessageText } from "@/lib/ai-content";

export const AI_MODEL =
  process.env.OPENROUTER_MODEL ?? "openrouter/free";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function openRouterChat(
  messages: ChatMessage[],
  model = AI_MODEL,
  maxTokens = 8192
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

  if (!res.ok) {
    const detail = body.error?.message ?? res.statusText;
    if (res.status === 401 || res.status === 403) {
      throw new Error(`OpenRouter auth failed (${res.status}): ${detail}`);
    }
    if (res.status === 402) {
      throw new Error(`OpenRouter credits exhausted: ${detail}`);
    }
    throw new Error(`OpenRouter error (${res.status}): ${detail}`);
  }

  if (body.error?.message) {
    throw new Error(`OpenRouter error: ${body.error.message}`);
  }

  const text = extractMessageText(body.choices?.[0]?.message?.content).trim();
  if (!text) {
    throw new Error("OpenRouter returned an empty response");
  }

  return text;
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
    return "OpenRouter credits exhausted. Add credits at openrouter.ai";
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
  if (/404|No endpoints found/i.test(errMsg)) {
    return "Model not found on OpenRouter. Set OPENROUTER_MODEL to openrouter/free or qwen/qwen3-coder:free on Vercel.";
  }
  if (errMsg.includes("OpenRouter error")) {
    return errMsg;
  }

  return `Config generation failed: ${errMsg.slice(0, 180)}`;
}
