import { NextResponse } from "next/server";
import { hasGroqKey } from "@/lib/app-url";
import { groqChat, getGroqModelLabel } from "@/lib/groq-chat";

/** Public diagnostic — tests Groq API key (no auth). */
export async function GET() {
  const ping = [{ role: "user" as const, content: "Reply with exactly: OK" }];

  if (!hasGroqKey()) {
    return NextResponse.json({
      ok: false,
      model: null,
      error: "GROQ_API_KEY not set",
      recommendation: "Add GROQ_API_KEY from console.groq.com/keys on Vercel, then redeploy.",
    });
  }

  try {
    const reply = await groqChat(ping, 16, 15000);
    const ok = reply.includes("OK") || reply.length > 0;
    return NextResponse.json({
      ok,
      model: getGroqModelLabel(),
      reply: reply.slice(0, 80),
      recommendation: ok
        ? "Groq is working."
        : "Unexpected response — check GROQ_MODEL.",
    });
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    return NextResponse.json({
      ok: false,
      model: getGroqModelLabel(),
      error,
      recommendation: "Fix GROQ_API_KEY at console.groq.com/keys and redeploy.",
    });
  }
}
