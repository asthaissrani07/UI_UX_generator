import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/config/db";
import { projectTable, screenConfigTable } from "@/config/schema";
import { hasPremiumAccess } from "@/lib/auth";

async function getEmail() {
  const user = await currentUser();
  return user?.primaryEmailAddress?.emailAddress ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const email = await getEmail();
    if (!email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const projectId = req.nextUrl.searchParams.get("projectId");

    if (!projectId) {
      const projects = await getDb()
        .select()
        .from(projectTable)
        .where(eq(projectTable.userId, email))
        .orderBy(desc(projectTable.id));
      return NextResponse.json(projects);
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

    const screenConfig = await getDb()
      .select()
      .from(screenConfigTable)
      .where(eq(screenConfigTable.projectId, projectId));

    return NextResponse.json({ projectDetail: project, screenConfig });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const email = await getEmail();
    if (!email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { userInput, device, projectId } = await req.json();

    if (process.env.ENABLE_BILLING_LIMITS === "true") {
      const premium = await hasPremiumAccess();
      const existing = await getDb()
        .select()
        .from(projectTable)
        .where(eq(projectTable.userId, email));

      if (!premium && existing.length >= 2) {
        return NextResponse.json({ message: "limit exceeded" });
      }
    }

    await getDb().insert(projectTable).values({
      projectId,
      userId: email,
      userInput,
      device,
    });

    return NextResponse.json({ success: true, projectId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const email = await getEmail();
    if (!email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, projectName, theme, screenshot } = body;

    const [updated] = await getDb()
      .update(projectTable)
      .set({
        ...(projectName !== undefined && { projectName }),
        ...(theme !== undefined && { theme }),
        ...(screenshot !== undefined && { screenshot }),
      })
      .where(
        and(
          eq(projectTable.projectId, projectId),
          eq(projectTable.userId, email)
        )
      )
      .returning();

    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
