import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/config/db";
import { screenConfigTable } from "@/config/schema";
import { getOpenRouter, AI_MODEL } from "@/config/openrouter";
import {
  GENERATE_SCREEN_PROMPT,
  EDIT_SCREEN_PROMPT,
} from "@/data/prompts";
import { extractMessageText } from "@/lib/ai-content";

export async function POST(req: NextRequest) {
  try {
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

    const userContent = editPrompt
      ? `Edit request: ${editPrompt}\n\nScreen: ${screenName}\nPurpose: ${purpose}\nDescription: ${screenDescription}\nProject context: ${projectVisualDescription ?? ""}`
      : `Device: ${device ?? "website"}\nScreen name: ${screenName}\nPurpose: ${purpose}\nLayout: ${screenDescription}\nProject visual: ${projectVisualDescription ?? ""}`;

    const systemPrompt = editPrompt
      ? EDIT_SCREEN_PROMPT
      : GENERATE_SCREEN_PROMPT;

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

    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: "internal server error" },
      { status: 500 }
    );
  }
}
