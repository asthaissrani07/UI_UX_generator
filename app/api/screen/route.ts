import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/config/db";
import { projectTable, screenConfigTable } from "@/config/schema";
import { hasPremiumAccess } from "@/lib/auth";
import { groqChat } from "@/lib/groq-chat";

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

    const raw = await groqChat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userInput },
      ],
      1024
    );

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
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
