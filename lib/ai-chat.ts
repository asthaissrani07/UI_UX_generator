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

function getProvider(): "openrouter" | "gemini" | "auto" {
  const p = (process.env.AI_PROVIDER ?? "auto").trim().toLowerCase();
  if (p === "gemini" || p === "openrouter") return p;
  return "auto";
}

export function hasAiProvider(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY);
}

/** One AI call per HTTP request — OpenRouter with Gemini fallback. */
export async function aiChatForAttempt(
  messages: ChatMessage[],
  modelAttempt = 0,
  maxTokens = 4096,
  timeoutMs = HOBBY_REQUEST_TIMEOUT_MS
): Promise<{ text: string; model: string }> {
  const provider = getProvider();
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasOpenRouter = Boolean(process.env.OPENROUTER_API_KEY);

  if (provider === "gemini") {
    const text = await geminiChat(messages, { maxTokens, timeoutMs });
    return { text, model: getGeminiModelLabel() };
  }

  if (provider === "openrouter" || !hasGemini) {
    return openRouterChatForAttempt(messages, modelAttempt, maxTokens, timeoutMs);
  }

  // auto: after 2 OpenRouter attempts, switch to Gemini for this screen
  if (hasGemini && modelAttempt >= 2) {
    const text = await geminiChat(messages, { maxTokens, timeoutMs });
    return { text, model: getGeminiModelLabel() };
  }

  if (!hasOpenRouter && hasGemini) {
    const text = await geminiChat(messages, { maxTokens, timeoutMs });
    return { text, model: getGeminiModelLabel() };
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
    if (hasGemini && isRetryableModelError(errMsg)) {
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
