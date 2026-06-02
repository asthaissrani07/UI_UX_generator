import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/config/db";
import { projectTable, screenConfigTable } from "@/config/schema";
import { getOpenRouter, AI_MODEL } from "@/config/openrouter";
import { APP_LAYOUT_CONFIG_PROMPT } from "@/data/prompts";
import { THEME_LIST } from "@/data/themes";
import { extractMessageText } from "@/lib/ai-content";
import { parseLayoutConfig } from "@/lib/parse-layout-json";
import { getMissingServerEnv } from "@/lib/app-url";

function resolveTheme(name: string | undefined): string {
  if (!name) return "Polar Mint";
  const match = THEME_LIST.find(
    (t) => t.name.toLowerCase() === name.trim().toLowerCase()
  );
  return match?.name ?? "Polar Mint";
}

function normalizeDevice(device: unknown): "website" | "mobile" {
  const value = String(device ?? "website").toLowerCase();
  return value === "mobile" ? "mobile" : "website";
}

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

    const { userInput, device, projectId } = await req.json();

    if (!projectId || !userInput?.trim()) {
      return NextResponse.json(
        { message: "Missing projectId or prompt" },
        { status: 400 }
      );
    }

    const deviceType = normalizeDevice(device);
    const systemPrompt = APP_LAYOUT_CONFIG_PROMPT.replace(
      /\{deviceType\}/g,
      deviceType
    );

    const completion = await getOpenRouter().chat.send({
      model: AI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Product idea: ${userInput}\n\nDevice type: ${deviceType}`,
        },
      ],
      stream: false,
    });

    const raw = extractMessageText(
      completion.choices?.[0]?.message?.content
    ).trim();

    if (!raw) {
      return NextResponse.json(
        { message: "AI returned an empty response. Check OpenRouter credits." },
        { status: 502 }
      );
    }

    let parsed;
    try {
      parsed = parseLayoutConfig(raw);
    } catch (parseError) {
      console.error("Layout JSON parse failed:", raw.slice(0, 500), parseError);
      return NextResponse.json(
        { message: "AI returned invalid layout JSON. Please try again." },
        { status: 502 }
      );
    }

    const theme = resolveTheme(parsed.theme);

    await getDb()
      .update(projectTable)
      .set({
        projectName: parsed.projectName,
        theme,
        projectVisualDescription: parsed.projectVisualDescription,
      })
      .where(
        and(
          eq(projectTable.projectId, projectId),
          eq(projectTable.userId, email)
        )
      );

    await getDb()
      .delete(screenConfigTable)
      .where(eq(screenConfigTable.projectId, projectId));

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

    return NextResponse.json({ ...parsed, theme });
  } catch (e) {
    console.error("generate-config error:", e);
    const errMsg = e instanceof Error ? e.message : String(e);
    let message = "Config generation failed on the server";

    if (errMsg.includes("OPENROUTER")) {
      message = "OpenRouter API key is missing or invalid";
    } else if (errMsg.includes("DATABASE_URL")) {
      message = "DATABASE_URL is not configured on the server";
    } else if (/401|403|unauthorized|invalid.*key/i.test(errMsg)) {
      message = "OpenRouter rejected the API key. Check credits and key on Vercel.";
    } else if (/timeout|ETIMEDOUT|ECONNRESET/i.test(errMsg)) {
      message = "AI service timed out. Please try again.";
    }

    return NextResponse.json({ message }, { status: 500 });
  }
}
