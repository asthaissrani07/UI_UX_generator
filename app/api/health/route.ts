import { NextResponse } from "next/server";
import {
  getAiProvider,
  getMissingServerEnv,
  hasGeminiKey,
  hasOpenRouterKey,
} from "@/lib/app-url";
import { AI_MODEL } from "@/lib/openrouter-chat";
import { getGeminiModelLabel } from "@/lib/gemini-chat";

/** Deployment sanity check — shows which env vars are missing (no secret values). */
export async function GET() {
  const missing = getMissingServerEnv();
  const aiProvider = getAiProvider();

  return NextResponse.json({
    ok: missing.length === 0,
    missing,
    aiProvider,
    hasGemini: hasGeminiKey(),
    hasOpenRouter: hasOpenRouterKey(),
    openRouterModel: hasOpenRouterKey()
      ? process.env.OPENROUTER_MODEL?.trim() || `(default) ${AI_MODEL}`
      : null,
    geminiModel: hasGeminiKey() ? getGeminiModelLabel() : null,
    hints:
      missing.length > 0
        ? [
            "Add GEMINI_API_KEY at aistudio.google.com/apikey (free, no OpenRouter needed)",
            "Set AI_PROVIDER=gemini if using Gemini only",
            "Enable for Production + Preview in Vercel, then Redeploy",
          ]
        : hasGeminiKey()
          ? ["AI configured — Gemini active"]
          : ["OpenRouter active — add GEMINI_API_KEY as free backup"],
  });
}
