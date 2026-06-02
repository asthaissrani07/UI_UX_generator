import { HOBBY_REQUEST_TIMEOUT_MS } from "@/config/models";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const DEFAULT_GROQ_MODEL =
  process.env.GROQ_MODEL?.trim() || "llama-3.1-8b-instant";

export async function groqChat(
  messages: ChatMessage[],
  maxTokens = 3200,
  timeoutMs = HOBBY_REQUEST_TIMEOUT_MS
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_GROQ_MODEL,
        messages,
        max_tokens: maxTokens,
        temperature: 0.6,
      }),
    });

    const body = (await res.json()) as {
      error?: { message?: string };
      choices?: Array<{ message?: { content?: string } }>;
    };

    if (!res.ok) {
      const detail = body.error?.message ?? res.statusText;
      throw new Error(`Groq error (${res.status}): ${detail}`);
    }

    const text = body.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) throw new Error("Groq returned empty text");
    return text;
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error(`Groq timed out after ${timeoutMs}ms`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export function getGroqModelLabel(): string {
  return DEFAULT_GROQ_MODEL;
}
