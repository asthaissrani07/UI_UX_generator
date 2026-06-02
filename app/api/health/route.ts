import { NextResponse } from "next/server";
import { getMissingServerEnv } from "@/lib/app-url";
import { AI_MODEL } from "@/lib/openrouter-chat";
import { getGeminiModelLabel } from "@/lib/gemini-chat";

/** Deployment sanity check — shows which env vars are missing (no secret values). */
export async function GET() {
  const missing = getMissingServerEnv();
  const aiProvider = process.env.AI_PROVIDER?.trim() || "auto";
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasOpenRouter = Boolean(process.env.OPENROUTER_API_KEY);

  return NextResponse.json({
    ok: missing.length === 0,
    missing,
    aiProvider,
    hasGemini,
    hasOpenRouter,
    openRouterModel: hasOpenRouter
      ? process.env.OPENROUTER_MODEL?.trim() || `(default) ${AI_MODEL}`
      : null,
    geminiModel: hasGemini ? getGeminiModelLabel() : null,
    hints:
      missing.length > 0
        ? [
            "Add OPENROUTER_API_KEY and/or GEMINI_API_KEY (Gemini is free at aistudio.google.com/apikey)",
            "Redeploy after saving env vars",
          ]
        : hasGemini
          ? [
              "Gemini fallback active — works when OpenRouter free limit is hit",
              "Set AI_PROVIDER=gemini to use only Gemini",
            ]
          : [
              "OpenRouter free limit hit? Add GEMINI_API_KEY from aistudio.google.com/apikey",
            ],
  });
}
