const MIN_SCREEN_CODE_LENGTH = 180;

export function cleanScreenHtml(raw: string): string {
  return raw.replace(/^```html?\s*/i, "").replace(/```\s*$/i, "").trim();
}

export function isScreenCodeComplete(code: string): boolean {
  const trimmed = code.trim();
  if (trimmed.length < MIN_SCREEN_CODE_LENGTH) return false;
  if (!/<\w+/i.test(trimmed)) return false;
  if (trimmed.split("<").length < 4) return false;
  return true;
}

export { MIN_SCREEN_CODE_LENGTH };
