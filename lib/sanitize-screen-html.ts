/** Replace avatar URLs that break CORS during screenshot capture. */
export function sanitizeScreenHtml(code: string): string {
  return code
    .replace(
      /https?:\/\/i\.pravatar\.cc\/[^"'\s)>]+/gi,
      (match) => {
        const seed =
          match.match(/u=([^&"'\s)>]+)/i)?.[1]?.replace(/\W/g, "") ?? "user";
        return `https://picsum.photos/seed/avatar-${seed}/150/150`;
      }
    )
    .replace(
      /https?:\/\/randomuser\.me\/[^"'\s)>]+/gi,
      "https://picsum.photos/seed/avatar-random/150/150"
    );
}
