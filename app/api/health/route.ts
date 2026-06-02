import { NextResponse } from "next/server";
import { getMissingServerEnv } from "@/lib/app-url";
import { AI_MODEL } from "@/lib/openrouter-chat";
import { DEFAULT_FREE_MODEL_FALLBACKS } from "@/config/models";

/** Deployment sanity check — shows which env vars are missing (no secret values). */
export async function GET() {
  const missing = getMissingServerEnv();

  return NextResponse.json({
    ok: missing.length === 0,
    missing,
    openRouterModel: process.env.OPENROUTER_MODEL?.trim() || `(default) ${AI_MODEL}`,
    suggestedFreeModels: DEFAULT_FREE_MODEL_FALLBACKS.slice(0, 4),
    hints:
      missing.length > 0
        ? [
            "Add missing variables in Vercel → Project → Settings → Environment Variables",
            "Redeploy after saving env vars",
            "Run `npm run db:push` against your production DATABASE_URL once",
          ]
        : [
            "OPENROUTER_MODEL must match exactly — e.g. qwen/qwen3-coder:free",
            "Remove quotes/spaces around the model name in Vercel",
          ],
  });
}
