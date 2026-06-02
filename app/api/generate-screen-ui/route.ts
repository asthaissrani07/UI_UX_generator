import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/config/db";
import { screenConfigTable } from "@/config/schema";
import { GENERATE_SCREEN_PROMPT, EDIT_SCREEN_PROMPT } from "@/data/prompts";
import { HOBBY_REQUEST_TIMEOUT_MS } from "@/config/models";
import { getMissingServerEnv } from "@/lib/app-url";
import {
  formatServerError,
  openRouterChatForAttempt,
} from "@/lib/openrouter-chat";
import { cleanScreenHtml, isScreenCodeComplete } from "@/lib/validate-screen-html";
import { sanitizeScreenHtml } from "@/lib/sanitize-screen-html";

export const maxDuration = 60;

/** Keep low for speed on Vercel Hobby (~10s total per request). */
const SCREEN_MAX_TOKENS = 3200;

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
      modelAttempt = 0,
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

    const { text: raw, model } = await openRouterChatForAttempt(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      Number(modelAttempt) || 0,
      SCREEN_MAX_TOKENS,
      HOBBY_REQUEST_TIMEOUT_MS
    );

    let code = sanitizeScreenHtml(cleanScreenHtml(raw));

    if (!isScreenCodeComplete(code)) {
      return NextResponse.json(
        {
          message: `Incomplete HTML from ${model}. Retry will use the next free model.`,
          model,
          incomplete: true,
        },
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
    const message = formatServerError(e).replace(
      "Config generation",
      "Screen generation"
    );
    const status = /timeout|504|timed out/i.test(message) ? 504 : 500;
    return NextResponse.json({ message }, { status });
  }
}
