import { THEME_LIST, themeToCssVariables, type ThemeColors } from "@/data/themes";

export function getThemeColors(themeName: string): ThemeColors {
  return THEME_LIST.find((t) => t.name === themeName) ?? THEME_LIST[0];
}

function tailwindConfigScript(theme: ThemeColors): string {
  return `<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          background: '${theme.background}',
          foreground: '${theme.foreground}',
          primary: { DEFAULT: '${theme.primary}', foreground: '${theme.primaryForeground}' },
          secondary: { DEFAULT: '${theme.secondary}', foreground: '${theme.secondaryForeground}' },
          accent: { DEFAULT: '${theme.accent}', foreground: '${theme.accentForeground}' },
          muted: { DEFAULT: '${theme.muted}', foreground: '${theme.mutedForeground}' },
          card: { DEFAULT: '${theme.card}', foreground: '${theme.cardForeground}' },
          popover: { DEFAULT: '${theme.popover}', foreground: '${theme.popoverForeground}' },
          border: '${theme.border}',
        }
      }
    }
  };
</script>`;
}

/** Overrides hardcoded Tailwind grays/blues so theme changes apply to all AI-generated screens */
function themeForceStyles(theme: ThemeColors): string {
  return `
    html, body {
      background-color: ${theme.background} !important;
      color: ${theme.foreground} !important;
    }
    .bg-background { background-color: ${theme.background} !important; }
    .text-foreground { color: ${theme.foreground} !important; }
    .bg-primary { background-color: ${theme.primary} !important; }
    .text-primary { color: ${theme.primary} !important; }
    .text-primary-foreground { color: ${theme.primaryForeground} !important; }
    .bg-secondary { background-color: ${theme.secondary} !important; }
    .text-secondary-foreground { color: ${theme.secondaryForeground} !important; }
    .bg-accent { background-color: ${theme.accent} !important; }
    .text-accent-foreground { color: ${theme.accentForeground} !important; }
    .bg-muted { background-color: ${theme.muted} !important; }
    .text-muted-foreground { color: ${theme.mutedForeground} !important; }
    .bg-card { background-color: ${theme.card} !important; }
    .text-card-foreground { color: ${theme.cardForeground} !important; }
    .border-border, .border { border-color: ${theme.border} !important; }
    .bg-white, .bg-gray-50, .bg-slate-50 { background-color: ${theme.card} !important; }
    .bg-gray-100, .bg-slate-100 { background-color: ${theme.muted} !important; }
    .bg-gray-900, .bg-gray-950, .bg-slate-900, .bg-black { background-color: ${theme.background} !important; }
    .bg-gray-800, .bg-slate-800 { background-color: ${theme.secondary} !important; }
    .text-gray-900, .text-slate-900, .text-black { color: ${theme.foreground} !important; }
    .text-gray-600, .text-gray-500, .text-slate-500 { color: ${theme.mutedForeground} !important; }
    .text-white { color: ${theme.foreground} !important; }
    .bg-blue-500, .bg-blue-600, .bg-indigo-600, .bg-teal-600, .bg-emerald-600,
    .bg-violet-600, .bg-purple-600, .bg-red-600, .bg-green-600 {
      background-color: ${theme.primary} !important;
    }
    .from-primary, .to-accent {
      --tw-gradient-from: ${theme.primary} var(--tw-gradient-from-position) !important;
      --tw-gradient-to: ${theme.accent} var(--tw-gradient-to-position) !important;
    }
  `;
}

const IFRAME_HEAD = `<!DOCTYPE html>
<html lang="en" data-theme="THEME_NAME">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=VIEWPORT_WIDTH, initial-scale=1, maximum-scale=1, user-scalable=no" />
  TAILWIND_CONFIG_SCRIPT
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://code.iconify.design/3/3.1.1/iconify.min.js"></script>
  <style id="theme-vars">
    THEME_CSS
    THEME_FORCE_CSS
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: VIEWPORT_HEIGHTpx;
      min-height: VIEWPORT_HEIGHTpx;
      overflow: hidden !important;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }
    #screen-root {
      box-sizing: border-box;
      width: 100%;
      min-height: VIEWPORT_HEIGHTpx;
    }
  </style>
</head>
<body>`;

const IFRAME_TAIL = `<script>
  (function initScreen() {
    var vh = VIEWPORT_HEIGHT;

    function applyFit() {
      var root = document.getElementById("screen-root");
      if (!root) return;

      root.style.transform = "none";
      root.style.width = "100%";

      var sh = Math.max(
        root.scrollHeight,
        root.offsetHeight,
        root.getBoundingClientRect().height
      );

      if (sh > vh + 2) {
        var scale = vh / sh;
        root.style.transformOrigin = "top left";
        root.style.transform = "scale(" + scale + ")";
        root.style.width = (100 / scale) + "%";
      }
    }

    window.applyScreenFit = applyFit;

    function scheduleFit() {
      requestAnimationFrame(function () {
        requestAnimationFrame(applyFit);
      });
    }

    function refreshTailwind() {
      if (typeof tailwind !== "undefined" && tailwind.refresh) {
        tailwind.refresh();
        scheduleFit();
        setTimeout(scheduleFit, 150);
        setTimeout(scheduleFit, 500);
        setTimeout(scheduleFit, 1200);
        setTimeout(scheduleFit, 2500);
      } else {
        setTimeout(refreshTailwind, 50);
      }
    }

    refreshTailwind();

    var root = document.getElementById("screen-root");
    if (root && window.ResizeObserver) {
      new ResizeObserver(scheduleFit).observe(root);
    }

    document.body.addEventListener("load", scheduleFit, true);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scheduleFit);
    }
  })();
</script>
</body></html>`;

function wrapBodyWithRoot(bodyHtml: string): string {
  const trimmed = bodyHtml.trim();
  if (!trimmed) {
    return `<div id="screen-root"><p class="p-4 text-muted-foreground">Loading…</p></div>`;
  }

  if (/id=["']screen-root["']/i.test(trimmed)) {
    return trimmed;
  }

  const rootMatch = trimmed.match(/^<([a-zA-Z][\w-]*)(\s[^>]*)?>[\s\S]*<\/\1>\s*$/);
  if (rootMatch) {
    const tag = rootMatch[1];
    if (rootMatch[2]?.match(/\bid=/i)) {
      return `<div id="screen-root">${trimmed}</div>`;
    }
    return trimmed.replace(/^<([a-zA-Z][\w-]*)/, '<$1 id="screen-root"');
  }

  return `<div id="screen-root">${trimmed}</div>`;
}

export function wrapScreenHtml(
  bodyHtml: string,
  themeName: string,
  viewportHeight = 844,
  viewportWidth = 390
): string {
  const theme = getThemeColors(themeName);
  const themeCss = themeToCssVariables(themeName);
  const forceCss = themeForceStyles(theme);
  const configScript = tailwindConfigScript(theme);

  const trimmed = bodyHtml.trim();
  const inner = wrapBodyWithRoot(trimmed);

  return IFRAME_HEAD.replace("THEME_NAME", themeName)
    .replace("TAILWIND_CONFIG_SCRIPT", configScript)
    .replace("THEME_CSS", themeCss)
    .replace("THEME_FORCE_CSS", forceCss)
    .replace(/VIEWPORT_HEIGHT/g, String(Math.round(viewportHeight)))
    .replace(/VIEWPORT_WIDTH/g, String(Math.round(viewportWidth)))
    .concat(inner, IFRAME_TAIL.replace(/VIEWPORT_HEIGHT/g, String(Math.round(viewportHeight))));
}
