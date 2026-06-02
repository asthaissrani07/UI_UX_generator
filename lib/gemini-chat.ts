import { HOBBY_REQUEST_TIMEOUT_MS } from "@/config/models";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const DEFAULT_GEMINI_MODEL =
  process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";

type GeminiOptions = {
  maxTokens?: number;
  timeoutMs?: number;
};

export async function geminiChat(
  messages: ChatMessage[],
  options: GeminiOptions = {}
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const maxTokens = options.maxTokens ?? 4096;
  const timeoutMs = options.timeoutMs ?? HOBBY_REQUEST_TIMEOUT_MS;
  const model = DEFAULT_GEMINI_MODEL;

  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");

  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: system
          ? { parts: [{ text: system }] }
          : undefined,
        contents,
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.7,
        },
      }),
    });

    const body = (await res.json()) as {
      error?: { message?: string; code?: number };
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
        finishReason?: string;
      }>;
    };

    if (!res.ok) {
      const detail = body.error?.message ?? res.statusText;
      if (res.status === 429) {
        throw new Error(`Gemini rate limit: ${detail}`);
      }
      throw new Error(`Gemini error (${res.status}): ${detail}`);
    }

    const parts = body.candidates?.[0]?.content?.parts ?? [];
    const text = parts.map((p) => p.text ?? "").join("").trim();

    if (!text) {
      const reason = body.candidates?.[0]?.finishReason ?? "unknown";
      throw new Error(`Gemini returned an empty response (finish: ${reason})`);
    }

    return text;
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error(`Gemini timeout after ${timeoutMs}ms`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export function getGeminiModelLabel(): string {
  return DEFAULT_GEMINI_MODEL;
}
