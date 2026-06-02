import { env, getAiProvider, hasGeminiKey, hasOpenRouterKey } from "@/lib/app-url";
import { HOBBY_REQUEST_TIMEOUT_MS, isRetryableModelError } from "@/config/models";
import { geminiChat, getGeminiModelLabel } from "@/lib/gemini-chat";
import {
  formatServerError as formatOpenRouterError,
  openRouterChatForAttempt,
} from "@/lib/openrouter-chat";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export function hasAiProvider(): boolean {
  return hasOpenRouterKey() || hasGeminiKey();
}

/** One AI call per HTTP request — OpenRouter with Gemini fallback. */
export async function aiChatForAttempt(
  messages: ChatMessage[],
  modelAttempt = 0,
  maxTokens = 4096,
  timeoutMs = HOBBY_REQUEST_TIMEOUT_MS
): Promise<{ text: string; model: string }> {
  const provider = getAiProvider();

  if (provider === "gemini") {
    if (!hasGeminiKey()) {
      throw new Error(
        "GEMINI_API_KEY is not set. Add it in Vercel → Environment Variables (aistudio.google.com/apikey)"
      );
    }
    const text = await geminiChat(messages, { maxTokens, timeoutMs });
    return { text, model: getGeminiModelLabel() };
  }

  if (provider === "openrouter") {
    return openRouterChatForAttempt(messages, modelAttempt, maxTokens, timeoutMs);
  }

  // auto mode
  if (hasGeminiKey() && modelAttempt >= 2) {
    const text = await geminiChat(messages, { maxTokens, timeoutMs });
    return { text, model: getGeminiModelLabel() };
  }

  if (!hasOpenRouterKey()) {
    if (hasGeminiKey()) {
      const text = await geminiChat(messages, { maxTokens, timeoutMs });
      return { text, model: getGeminiModelLabel() };
    }
    throw new Error(
      "No AI key configured. Add GEMINI_API_KEY on Vercel (free at aistudio.google.com/apikey)"
    );
  }

  try {
    return await openRouterChatForAttempt(
      messages,
      modelAttempt,
      maxTokens,
      timeoutMs
    );
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    if (hasGeminiKey() && isRetryableModelError(errMsg)) {
      console.warn("[AI] OpenRouter failed, using Gemini:", errMsg.slice(0, 120));
      const text = await geminiChat(messages, { maxTokens, timeoutMs });
      return { text, model: getGeminiModelLabel() };
    }
    throw e;
  }
}

export function formatServerError(e: unknown): string {
  const errMsg =
    e instanceof Error ? e.message : typeof e === "string" ? e : "Unknown error";

  if (/Gemini rate limit/i.test(errMsg)) {
    return "Gemini free limit reached. Wait a few minutes or get a key at aistudio.google.com/apikey";
  }
  if (/GEMINI_API_KEY/i.test(errMsg)) {
    return "Add GEMINI_API_KEY from aistudio.google.com/apikey (free, separate from OpenRouter limits)";
  }
  if (/Gemini error \(403\)|API key not valid/i.test(errMsg)) {
    return "Invalid GEMINI_API_KEY. Create one at aistudio.google.com/apikey";
  }

  return formatOpenRouterError(e);
}
