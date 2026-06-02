import { NextResponse } from "next/server";
import {
  getAiProvider,
  getMissingServerEnv,
  hasGeminiKey,
  hasGroqKey,
  hasOpenRouterKey,
} from "@/lib/app-url";

export async function GET() {
  const missing = getMissingServerEnv();

  return NextResponse.json({
    ok: missing.length === 0,
    missing,
    aiProvider: getAiProvider(),
    hasGroq: hasGroqKey(),
    hasGemini: hasGeminiKey(),
    hasOpenRouter: hasOpenRouterKey(),
    diagnoseUrl: "/api/diagnose-ai",
    fix:
      "If Gemini fails: set AI_PROVIDER=groq + GROQ_API_KEY. Remove quotes from keys on Vercel. Redeploy.",
  });
}
