import { toPng } from "html-to-image";

const CAPTURE_OPTS = {
  cacheBust: true,
  pixelRatio: 1.25,
  backgroundColor: "#ffffff",
  skipFonts: true,
  filter: (node: HTMLElement) => {
    if (node.tagName === "SCRIPT") return false;
    if (node.tagName === "LINK") return false;
    if (node.tagName === "IMG") {
      const src = (node as HTMLImageElement).src;
      if (src && !src.startsWith("data:") && !src.startsWith("blob:")) {
        return false;
      }
    }
    return true;
  },
} as const;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load captured image"));
    img.src = src;
  });
}

function waitForIframeReady(
  iframe: HTMLIFrameElement,
  timeout = 8000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeout;

    const check = () => {
      const doc = iframe.contentDocument;
      if (doc?.body && doc.body.childElementCount > 0) {
        resolve();
        return;
      }
      if (Date.now() > deadline) {
        reject(new Error("Screen content not ready yet"));
        return;
      }
      requestAnimationFrame(check);
    };

    if (iframe.contentDocument?.readyState === "complete") {
      setTimeout(check, 200);
    } else {
      iframe.addEventListener("load", () => setTimeout(check, 200), {
        once: true,
      });
      setTimeout(check, 400);
    }
  });
}

async function captureNode(node: HTMLElement): Promise<string> {
  return toPng(node, CAPTURE_OPTS);
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const safeName = filename.replace(/[^\w\s.-]/g, "_").trim() || "screenshot";
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = safeName.endsWith(".png") ? safeName : `${safeName}.png`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function compressDataUrlForStorage(
  dataUrl: string,
  maxWidth = 720,
  quality = 0.75
): Promise<string> {
  const img = await loadImage(dataUrl);
  const scale = img.width > maxWidth ? maxWidth / img.width : 1;
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not compress screenshot");

  ctx.fillStyle = "#f4f4f5";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

export async function captureIframe(
  iframe: HTMLIFrameElement
): Promise<string> {
  await waitForIframeReady(iframe);
  const doc = iframe.contentDocument;
  if (!doc?.body) throw new Error("Screen preview not ready");

  const targets = [doc.body, doc.documentElement].filter(
    (node): node is HTMLElement => node instanceof HTMLElement
  );

  for (const target of targets) {
    try {
      return await captureNode(target);
    } catch {
      /* try next target */
    }
  }

  const wrapper = iframe.closest("[data-screen-capture]");
  if (wrapper instanceof HTMLElement) {
    try {
      return await toPng(wrapper, {
        ...CAPTURE_OPTS,
        backgroundColor: "#f4f4f5",
      });
    } catch {
      /* fall through */
    }
  }

  throw new Error("Could not capture this screen. Try again in a moment.");
}

export function getScreenIframes(): HTMLIFrameElement[] {
  const nodes = document.querySelectorAll<HTMLIFrameElement>(
    "iframe[data-screen-capture-iframe]"
  );
  return Array.from(nodes).filter((iframe) => {
    const doc = iframe.contentDocument;
    return doc?.body && doc.body.childElementCount > 0;
  });
}

export async function captureAllIframes(
  iframes?: (HTMLIFrameElement | null)[]
): Promise<string> {
  const valid =
    iframes?.filter((f): f is HTMLIFrameElement => {
      if (!f?.contentDocument?.body) return false;
      return f.contentDocument.body.childElementCount > 0;
    }) ?? getScreenIframes();

  if (valid.length === 0) {
    throw new Error(
      "No screens ready to capture. Wait until all mockups finish loading."
    );
  }

  const images: string[] = [];
  for (const frame of valid) {
    images.push(await captureIframe(frame));
  }

  const loaded = await Promise.all(images.map(loadImage));
  const gap = 24;
  const totalWidth = loaded.reduce((w, img) => w + img.width + gap, -gap);
  const maxHeight = Math.max(...loaded.map((i) => i.height));

  const canvas = document.createElement("canvas");
  canvas.width = totalWidth;
  canvas.height = maxHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not build canvas image");

  ctx.fillStyle = "#f4f4f5";
  ctx.fillRect(0, 0, totalWidth, maxHeight);

  let x = 0;
  for (const img of loaded) {
    ctx.drawImage(img, x, 0);
    x += img.width + gap;
  }

  return canvas.toDataURL("image/png");
}
