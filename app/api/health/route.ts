import { NextResponse } from "next/server";
import { getMissingServerEnv } from "@/lib/app-url";

/** Deployment sanity check — shows which env vars are missing (no secret values). */
export async function GET() {
  const missing = getMissingServerEnv();

  return NextResponse.json({
    ok: missing.length === 0,
    missing,
    hints:
      missing.length > 0
        ? [
            "Add missing variables in Vercel → Project → Settings → Environment Variables",
            "Redeploy after saving env vars",
            "Run `npm run db:push` against your production DATABASE_URL once",
          ]
        : [],
  });
}
