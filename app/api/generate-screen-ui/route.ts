import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/config/db";
import { screenConfigTable } from "@/config/schema";
import { getOpenRouter, AI_MODEL } from "@/config/openrouter";
import { GENERATE_SCREEN_PROMPT, EDIT_SCREEN_PROMPT } from "@/data/prompts";
import { extractMessageText } from "@/lib/ai-content";
import { getMissingServerEnv } from "@/lib/app-url";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const missing = getMissingServerEnv();
    if (missing.length > 0) {
      return NextResponse.json(
        {
          message: `Server misconfigured. Missing: ${missing.join(", ")}`,
          missing,
        },
        { status: 503 }
      );
    }

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      projectId,
      screenId,
      screenName,
      purpose,
      screenDescription,
      projectVisualDescription,
      device,
      editPrompt,
    } = body;

    if (!projectId || !screenId) {
      return NextResponse.json(
        { message: "Missing projectId or screenId" },
        { status: 400 }
      );
    }

    const userContent = editPrompt
      ? `Edit request: ${editPrompt}\n\nScreen: ${screenName}\nPurpose: ${purpose}\nDescription: ${screenDescription}\nProject context: ${projectVisualDescription ?? ""}`
      : `Device: ${device ?? "website"}\nScreen name: ${screenName}\nPurpose: ${purpose}\nLayout: ${screenDescription}\nProject visual: ${projectVisualDescription ?? ""}`;

    const systemPrompt = editPrompt ? EDIT_SCREEN_PROMPT : GENERATE_SCREEN_PROMPT;

    const completion = await getOpenRouter().chat.send({
      model: AI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      stream: false,
    });

    let code = extractMessageText(
      completion.choices?.[0]?.message?.content
    ).trim();
    code = code.replace(/^```html?\s*/i, "").replace(/```\s$/, "").replace(/```\s*$/i, "");

    if (!code) {
      return NextResponse.json(
        { message: "AI returned empty HTML. Check OpenRouter credits." },
        { status: 502 }
      );
    }

    const [updated] = await getDb()
      .update(screenConfigTable)
      .set({ code })
      .where(
        and(
          eq(screenConfigTable.projectId, projectId),
          eq(screenConfigTable.screenId, String(screenId))
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json(
        { message: "Screen not found in database" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (e) {
    console.error("generate-screen-ui error:", e);
    const errMsg = e instanceof Error ? e.message : String(e);
    let message = "Screen generation failed on the server";

    if (errMsg.includes("OPENROUTER")) {
      message = "OpenRouter API key is not configured";
    } else if (/401|403|unauthorized|invalid.*key/i.test(errMsg)) {
      message = "OpenRouter rejected the API key. Check credits on openrouter.ai";
    } else if (/timeout|ETIMEDOUT|FUNCTION_INVOCATION_TIMEOUT/i.test(errMsg)) {
      message = "Generation timed out. Try again or use a faster model.";
    }

    return NextResponse.json({ message }, { status: 500 });
  }
}
