import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/config/db";
import { projectTable, screenConfigTable } from "@/config/schema";
import { hasPremiumAccess } from "@/lib/auth";
import { getOpenRouter, AI_MODEL } from "@/config/openrouter";
import { extractMessageText } from "@/lib/ai-content";

export async function POST(req: NextRequest) {
  try {
    const email = (await currentUser())?.primaryEmailAddress?.emailAddress;
    if (!email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { projectId, userInput } = await req.json();

    if (
      process.env.ENABLE_BILLING_LIMITS === "true" &&
      !(await hasPremiumAccess())
    ) {
      return NextResponse.json(
        { message: "premium required" },
        { status: 403 }
      );
    }

    const [project] = await getDb()
      .select()
      .from(projectTable)
      .where(
        and(
          eq(projectTable.projectId, projectId),
          eq(projectTable.userId, email)
        )
      );

    if (!project) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const systemPrompt = `Add ONE new screen to an existing ${project.device} app.
Project: ${project.projectName}. Visual style: ${project.projectVisualDescription}.
Theme: ${project.theme}.
Return ONLY valid JSON: { "screenId": "unique", "name": "", "purpose": "", "layoutDescription": "" }`;

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
    const screen = JSON.parse(jsonStr);

    const [inserted] = await getDb()
      .insert(screenConfigTable)
      .values({
        projectId,
        screenId: String(screen.screenId),
        screenName: screen.name,
        purpose: screen.purpose,
        screenDescription: screen.layoutDescription,
      })
      .returning();

    return NextResponse.json(inserted);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { projectId, screenId } = await req.json();

    await getDb()
      .delete(screenConfigTable)
      .where(
        and(
          eq(screenConfigTable.projectId, projectId),
          eq(screenConfigTable.screenId, String(screenId))
        )
      );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
