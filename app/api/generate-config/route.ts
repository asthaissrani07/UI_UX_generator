import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/config/db";
import { projectTable, screenConfigTable } from "@/config/schema";
import { APP_LAYOUT_CONFIG_PROMPT } from "@/data/prompts";
import { THEME_LIST } from "@/data/themes";
import { parseLayoutConfig } from "@/lib/parse-layout-json";
import { getMissingServerEnv } from "@/lib/app-url";
import { formatServerError, openRouterChatForAttempt } from "@/lib/openrouter-chat";
import { HOBBY_REQUEST_TIMEOUT_MS } from "@/config/models";

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

function clip(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
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

    const { userInput, device, projectId, modelAttempt = 0 } = await req.json();

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

    const { text: raw } = await openRouterChatForAttempt(
      [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Product idea: ${userInput}\n\nDevice type: ${deviceType}`,
        },
      ],
      Number(modelAttempt) || 0,
      2048,
      HOBBY_REQUEST_TIMEOUT_MS
    );

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
      return NextResponse.json(
        { message: "Project not found. Create a new project and try again." },
        { status: 404 }
      );
    }

    await getDb()
      .update(projectTable)
      .set({
        projectName: clip(parsed.projectName, 255),
        theme: clip(theme, 100),
        projectVisualDescription: parsed.projectVisualDescription,
      })
      .where(eq(projectTable.projectId, projectId));

    await getDb()
      .delete(screenConfigTable)
      .where(eq(screenConfigTable.projectId, projectId));

    for (let i = 0; i < parsed.screens.length; i++) {
      const screen = parsed.screens[i];
      await getDb().insert(screenConfigTable).values({
        projectId,
        screenId: `${projectId.slice(0, 8)}-screen-${i + 1}`,
        screenName: clip(screen.name, 255),
        purpose: clip(screen.purpose, 500),
        screenDescription: screen.layoutDescription,
      });
    }

    return NextResponse.json({ ...parsed, theme });
  } catch (e) {
    console.error("generate-config error:", e);
    return NextResponse.json(
      { message: formatServerError(e) },
      { status: 500 }
    );
  }
}
