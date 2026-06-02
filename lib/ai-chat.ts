import {
  getAiProvider,
  hasGeminiKey,
  hasGroqKey,
  hasOpenRouterKey,
} from "@/lib/app-url";
import { HOBBY_REQUEST_TIMEOUT_MS } from "@/config/models";
import { geminiChat, getGeminiModelLabel } from "@/lib/gemini-chat";
import { groqChat, getGroqModelLabel } from "@/lib/groq-chat";
import {
  formatServerError as formatOpenRouterError,
  openRouterChatForAttempt,
} from "@/lib/openrouter-chat";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

async function runGroq(
  messages: ChatMessage[],
  maxTokens: number,
  timeoutMs: number
) {
  const text = await groqChat(messages, maxTokens, timeoutMs);
  return { text, model: `groq:${getGroqModelLabel()}` };
}

async function runGemini(
  messages: ChatMessage[],
  maxTokens: number,
  timeoutMs: number
) {
  const text = await geminiChat(messages, maxTokens, timeoutMs);
  return { text, model: `gemini:${getGeminiModelLabel()}` };
}

/**
 * ONE provider per HTTP request.
 * modelAttempt 0 = Groq, 1 = Gemini, 2+ = OpenRouter (stops retry spam on one API).
 */
export async function aiChatForAttempt(
  messages: ChatMessage[],
  modelAttempt = 0,
  maxTokens = 3200,
  timeoutMs = HOBBY_REQUEST_TIMEOUT_MS
): Promise<{ text: string; model: string }> {
  const provider = getAiProvider();
  const attempt = Number(modelAttempt) || 0;

  if (provider === "groq") {
    if (!hasGroqKey()) throw new Error("GROQ_API_KEY is not set on the server");
    return runGroq(messages, maxTokens, timeoutMs);
  }

  if (provider === "gemini") {
    if (!hasGeminiKey()) {
      throw new Error("GEMINI_API_KEY is not set on the server");
    }
    return runGemini(messages, maxTokens, timeoutMs);
  }

  if (provider === "openrouter") {
    return openRouterChatForAttempt(messages, attempt, maxTokens, timeoutMs);
  }

  // auto — rotate provider by attempt (never hit same API 5 times)
  if (attempt === 0 && hasGroqKey()) {
    try {
      return await runGroq(messages, maxTokens, timeoutMs);
    } catch (e) {
      console.warn("[AI] Groq:", e instanceof Error ? e.message : e);
    }
  }

  if (attempt === 1 && hasGeminiKey()) {
    try {
      return await runGemini(messages, maxTokens, timeoutMs);
    } catch (e) {
      console.warn("[AI] Gemini:", e instanceof Error ? e.message : e);
    }
  }

  if (hasOpenRouterKey()) {
    try {
      return await openRouterChatForAttempt(
        messages,
        attempt,
        maxTokens,
        timeoutMs
      );
    } catch (e) {
      console.warn("[AI] OpenRouter:", e instanceof Error ? e.message : e);
    }
  }

  if (hasGroqKey()) return runGroq(messages, maxTokens, timeoutMs);
  if (hasGeminiKey()) return runGemini(messages, maxTokens, timeoutMs);

  throw new Error("No AI key works. Add GROQ_API_KEY (console.groq.com) — recommended.");
}

export function formatServerError(e: unknown): string {
  const msg =
    e instanceof Error ? e.message : typeof e === "string" ? e : "Unknown error";

  if (/Groq|GROQ/i.test(msg)) return msg.slice(0, 260);
  if (/Gemini|GEMINI/i.test(msg)) return msg.slice(0, 260);

  return formatOpenRouterError(e);
}
