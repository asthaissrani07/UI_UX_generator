import { toPng } from "html-to-image";

function waitForIframeReady(iframe: HTMLIFrameElement, timeout = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeout;

    const check = () => {
      const doc = iframe.contentDocument;
      if (doc?.body && doc.body.childElementCount > 0) {
        resolve();
        return;
      }
      if (Date.now() > deadline) {
        reject(new Error("Iframe content not ready"));
        return;
      }
      requestAnimationFrame(check);
    };

    if (iframe.contentDocument?.readyState === "complete") {
      check();
    } else {
      iframe.addEventListener("load", () => check(), { once: true });
      setTimeout(check, 300);
    }
  });
}

export async function captureIframe(
  iframe: HTMLIFrameElement
): Promise<string> {
  await waitForIframeReady(iframe);
  const doc = iframe.contentDocument;
  if (!doc?.body) throw new Error("Iframe not ready");

  try {
    return await toPng(doc.body, {
      cacheBust: true,
      pixelRatio: 1.5,
      backgroundColor: "#ffffff",
      skipFonts: true,
    });
  } catch {
    // Fallback: capture visible frame wrapper (includes iframe paint in most browsers)
    const wrapper = iframe.closest("[data-screen-capture]");
    if (wrapper instanceof HTMLElement) {
      return await toPng(wrapper, {
        cacheBust: true,
        pixelRatio: 1.5,
        backgroundColor: "#f4f4f5",
        skipFonts: true,
      });
    }
    throw new Error("Could not capture screen");
  }
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

  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const loaded = await Promise.all(images.map(loadImage));
  const gap = 24;
  const totalWidth = loaded.reduce((w, img) => w + img.width + gap, -gap);
  const maxHeight = Math.max(...loaded.map((i) => i.height));

  const canvas = document.createElement("canvas");
  canvas.width = totalWidth;
  canvas.height = maxHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f4f4f5";
  ctx.fillRect(0, 0, totalWidth, maxHeight);

  let x = 0;
  for (const img of loaded) {
    ctx.drawImage(img, x, 0);
    x += img.width + gap;
  }

  return canvas.toDataURL("image/png");
}
