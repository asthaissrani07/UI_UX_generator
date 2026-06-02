import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/config/db";
import { screenConfigTable } from "@/config/schema";
import { GENERATE_SCREEN_PROMPT, EDIT_SCREEN_PROMPT } from "@/data/prompts";
import { getMissingServerEnv } from "@/lib/app-url";
import { formatServerError, openRouterChat } from "@/lib/openrouter-chat";

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

    let code = await openRouterChat([
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ]);

    code = code.replace(/^```html?\s*/i, "").replace(/```\s*$/i, "");

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
    return NextResponse.json(
      { message: formatServerError(e).replace("Config generation", "Screen generation") },
      { status: 500 }
    );
  }
}
