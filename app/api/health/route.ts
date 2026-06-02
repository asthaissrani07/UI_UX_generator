import { NextResponse } from "next/server";
import { getMissingServerEnv, hasGroqKey } from "@/lib/app-url";
import { groqChat, getGroqModelLabel } from "@/lib/groq-chat";

export async function GET() {
  const missing = getMissingServerEnv();

  let groqOk = false;
  let groqError: string | undefined;

  if (hasGroqKey()) {
    try {
      const reply = await groqChat(
        [{ role: "user", content: "Reply with exactly: OK" }],
        16,
        15000
      );
      groqOk = reply.length > 0;
    } catch (e) {
      groqError = e instanceof Error ? e.message : String(e);
    }
  }

  return NextResponse.json({
    ok: missing.length === 0 && groqOk,
    missing,
    groq: {
      configured: hasGroqKey(),
      model: hasGroqKey() ? getGroqModelLabel() : null,
      working: groqOk,
      error: groqError,
    },
  });
}
