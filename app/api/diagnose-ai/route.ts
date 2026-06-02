import { NextResponse } from "next/server";
import {
  getAiProvider,
  hasGeminiKey,
  hasGroqKey,
  hasOpenRouterKey,
} from "@/lib/app-url";
import { geminiChat } from "@/lib/gemini-chat";
import { groqChat } from "@/lib/groq-chat";

/** Public diagnostic — tests each configured AI key (no auth). */
export async function GET() {
  const provider = getAiProvider();
  const tests: Record<string, { ok: boolean; error?: string }> = {};

  const ping = [
    { role: "user" as const, content: "Reply with exactly: OK" },
  ];

  if (hasGroqKey()) {
    try {
      const t = await groqChat(ping, 16, 15000);
      tests.groq = { ok: t.includes("OK") || t.length > 0 };
    } catch (e) {
      tests.groq = {
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  } else {
    tests.groq = { ok: false, error: "GROQ_API_KEY not set" };
  }

  if (hasGeminiKey()) {
    try {
      const t = await geminiChat(ping, 16, 15000);
      tests.gemini = { ok: t.includes("OK") || t.length > 0 };
    } catch (e) {
      tests.gemini = {
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  } else {
    tests.gemini = { ok: false, error: "GEMINI_API_KEY not set" };
  }

  return NextResponse.json({
    aiProvider: provider,
    hasGroq: hasGroqKey(),
    hasGemini: hasGeminiKey(),
    hasOpenRouter: hasOpenRouterKey(),
    tests,
    recommendation:
      !tests.groq?.ok && hasGroqKey()
        ? "Fix GROQ_API_KEY"
        : !tests.groq?.ok
          ? "Add GROQ_API_KEY from console.groq.com and AI_PROVIDER=groq"
          : "Use AI_PROVIDER=groq",
  });
}
