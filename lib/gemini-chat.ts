import { HOBBY_REQUEST_TIMEOUT_MS } from "@/config/models";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const MODELS = [
  process.env.GEMINI_MODEL?.trim(),
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-2.0-flash",
].filter((m): m is string => Boolean(m));

export async function geminiChat(
  messages: ChatMessage[],
  maxTokens = 3200,
  timeoutMs = HOBBY_REQUEST_TIMEOUT_MS
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

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

  let lastErr = "Unknown Gemini error";

  for (const model of [...new Set(MODELS)]) {
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
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.6 },
        }),
      });

      const body = (await res.json()) as {
        error?: { message?: string; status?: string };
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
          finishReason?: string;
        }>;
      };

      if (!res.ok) {
        const detail =
          body.error?.message ??
          body.error?.status ??
          res.statusText;
        lastErr = `Gemini ${res.status} (${model}): ${detail}`;
        if (res.status === 403) {
          throw new Error(
            `${lastErr} — Create an unrestricted key at aistudio.google.com/apikey`
          );
        }
        continue;
      }

      const text = (body.candidates?.[0]?.content?.parts ?? [])
        .map((p) => p.text ?? "")
        .join("")
        .trim();

      if (text) return text;
      lastErr = `Gemini empty (${model}, ${body.candidates?.[0]?.finishReason})`;
    } catch (e) {
      if (e instanceof Error && /403|key/i.test(e.message)) throw e;
      if (e instanceof Error && e.name === "AbortError") {
        lastErr = `Gemini timeout (${model})`;
      } else if (e instanceof Error) {
        lastErr = e.message;
      }
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error(lastErr);
}

export function getGeminiModelLabel(): string {
  return MODELS[0] ?? "gemini-2.0-flash-lite";
}
