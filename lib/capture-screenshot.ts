import { toPng } from "html-to-image";

const CAPTURE_PIXEL_RATIO = 2;

const CAPTURE_OPTS = {
  cacheBust: true,
  pixelRatio: CAPTURE_PIXEL_RATIO,
  backgroundColor: "#ffffff",
  skipFonts: true,
  filter: (node: HTMLElement) => {
    if (node.tagName === "SCRIPT") return false;
    if (node.tagName === "LINK") return false;
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

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function triggerIframeFit(iframe: HTMLIFrameElement) {
  const win = iframe.contentWindow as
    | (Window & { applyScreenFit?: () => void })
    | null;
  win?.applyScreenFit?.();
}

async function waitForIframeLayout(
  iframe: HTMLIFrameElement,
  timeout = 12000
): Promise<void> {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const doc = iframe.contentDocument;
    const root = doc?.getElementById("screen-root");
    if (root && root.childElementCount > 0) {
      triggerIframeFit(iframe);
      await sleep(350);
      triggerIframeFit(iframe);
      await sleep(200);

      const text = root.textContent?.trim() ?? "";
      const hasHeight = root.getBoundingClientRect().height > 40;
      if (text.length > 0 && hasHeight) return;
    }
    await sleep(250);
  }

  throw new Error("Screen content not ready yet");
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

/** Captures exactly what is visible inside the iframe frame. */
export async function captureIframe(
  iframe: HTMLIFrameElement
): Promise<string> {
  await waitForIframeLayout(iframe);
  const doc = iframe.contentDocument;
  if (!doc?.body) throw new Error("Screen preview not ready");

  const w = iframe.clientWidth;
  const h = iframe.clientHeight;
  if (w <= 0 || h <= 0) {
    throw new Error("Screen frame has no size");
  }

  triggerIframeFit(iframe);
  await sleep(150);

  const root = doc.getElementById("screen-root");
  if (root) {
    try {
      return await toPng(doc.body, {
        ...CAPTURE_OPTS,
        width: w,
        height: h,
        canvasWidth: Math.round(w * CAPTURE_PIXEL_RATIO),
        canvasHeight: Math.round(h * CAPTURE_PIXEL_RATIO),
      });
    } catch {
      /* fall through */
    }
  }

  const wrapper = iframe.closest("[data-screen-capture]");
  if (wrapper instanceof HTMLElement) {
    return await toPng(wrapper, {
      ...CAPTURE_OPTS,
      width: w,
      height: h,
      canvasWidth: Math.round(w * CAPTURE_PIXEL_RATIO),
      canvasHeight: Math.round(h * CAPTURE_PIXEL_RATIO),
      backgroundColor: "#ffffff",
    });
  }

  throw new Error("Could not capture this screen. Try again in a moment.");
}

export function getScreenIframes(): HTMLIFrameElement[] {
  const nodes = document.querySelectorAll<HTMLIFrameElement>(
    "iframe[data-screen-capture-iframe]"
  );
  return Array.from(nodes).filter((iframe) => {
    const root = iframe.contentDocument?.getElementById("screen-root");
    return root && root.childElementCount > 0;
  });
}

export async function captureAllIframes(
  iframes?: (HTMLIFrameElement | null)[]
): Promise<string> {
  const valid =
    iframes?.filter((f): f is HTMLIFrameElement => {
      const root = f?.contentDocument?.getElementById("screen-root");
      return Boolean(root && root.childElementCount > 0);
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
