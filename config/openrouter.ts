import { OpenRouter } from "@openrouter/sdk";

let _client: OpenRouter | undefined;

export function getOpenRouter() {
  if (!_client) {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) throw new Error("OPENROUTER_API_KEY is not set");
    _client = new OpenRouter({ apiKey: key });
  }
  return _client;
}

export const AI_MODEL =
  process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
