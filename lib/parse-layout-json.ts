import type { LayoutConfigResponse } from "@/types";

export function extractJsonObject(raw: string): string {
  let text = raw.trim();
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI response did not contain valid JSON");
  }

  return text.slice(start, end + 1);
}

export function parseLayoutConfig(raw: string): LayoutConfigResponse {
  const jsonStr = extractJsonObject(raw);
  const parsed = JSON.parse(jsonStr) as LayoutConfigResponse;

  if (!parsed.projectName || typeof parsed.projectName !== "string") {
    throw new Error("AI response missing projectName");
  }
  if (!Array.isArray(parsed.screens) || parsed.screens.length === 0) {
    throw new Error("AI response missing screens array");
  }

  return {
    projectName: parsed.projectName,
    theme: parsed.theme ?? "Polar Mint",
    projectVisualDescription: parsed.projectVisualDescription ?? "",
    screens: parsed.screens.map((screen, i) => ({
      screenId: String(screen.screenId ?? i + 1),
      name: screen.name ?? `Screen ${i + 1}`,
      purpose: screen.purpose ?? "",
      layoutDescription: screen.layoutDescription ?? "",
    })),
  };
}
