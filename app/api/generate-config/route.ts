import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/config/db";
import { projectTable, screenConfigTable } from "@/config/schema";
import { getOpenRouter, AI_MODEL } from "@/config/openrouter";
import { APP_LAYOUT_CONFIG_PROMPT } from "@/data/prompts";
import { extractMessageText } from "@/lib/ai-content";
import type { LayoutConfigResponse } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { userInput, device, projectId } = await req.json();

    const systemPrompt = APP_LAYOUT_CONFIG_PROMPT.replace(
      /\{deviceType\}/g,
      device ?? "website"
    );

    const completion = await getOpenRouter().chat.send({
      model: AI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userInput },
      ],
      stream: false,
    });

    const raw = extractMessageText(
      completion.choices?.[0]?.message?.content
    ).trim();
    const jsonStr = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "");
    const parsed = JSON.parse(jsonStr) as LayoutConfigResponse;

    await getDb()
      .update(projectTable)
      .set({
        projectName: parsed.projectName,
        theme: parsed.theme,
        projectVisualDescription: parsed.projectVisualDescription,
      })
      .where(
        and(
          eq(projectTable.projectId, projectId),
          eq(projectTable.userId, email)
        )
      );

    for (let i = 0; i < parsed.screens.length; i++) {
      const screen = parsed.screens[i];
      await getDb().insert(screenConfigTable).values({
        projectId,
        screenId: `${projectId.slice(0, 8)}-screen-${i + 1}`,
        screenName: screen.name,
        purpose: screen.purpose,
        screenDescription: screen.layoutDescription,
      });
    }

    return NextResponse.json(parsed);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: "internal server error" },
      { status: 500 }
    );
  }
}
