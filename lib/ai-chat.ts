import { HOBBY_REQUEST_TIMEOUT_MS } from "@/config/models";
import { groqChat, getGroqModelLabel } from "@/lib/groq-chat";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function aiChatForAttempt(
  messages: ChatMessage[],
  _modelAttempt = 0,
  maxTokens = 3200,
  timeoutMs = HOBBY_REQUEST_TIMEOUT_MS
): Promise<{ text: string; model: string }> {
  const text = await groqChat(messages, maxTokens, timeoutMs);
  return { text, model: getGroqModelLabel() };
}

export function formatServerError(e: unknown): string {
  const msg =
    e instanceof Error ? e.message : typeof e === "string" ? e : "Unknown error";

  if (/GROQ_API_KEY/i.test(msg)) {
    return "Add GROQ_API_KEY on Vercel (console.groq.com/keys), then redeploy.";
  }
  if (/Groq error \(401\)|Groq error \(403\)|invalid.*key/i.test(msg)) {
    return "Invalid GROQ_API_KEY. Create a new key at console.groq.com/keys";
  }
  if (/Groq rate limit|429/i.test(msg)) {
    return `${msg.slice(0, 200)} — wait a minute and try again.`;
  }
  if (/timeout|504|timed out/i.test(msg)) {
    return "AI request timed out. Retry — or upgrade Vercel Pro for longer runs.";
  }
  if (/DATABASE_URL|connection/i.test(msg)) {
    return "Database connection failed. Check DATABASE_URL on Vercel.";
  }
  if (/relation .* does not exist/i.test(msg)) {
    return "Database tables missing. Run npm run db:push on production DATABASE_URL.";
  }

  return msg.slice(0, 240);
}
