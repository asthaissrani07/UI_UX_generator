/** Chrome above the iframe viewport (notch + drag header on mobile). */
export const MOBILE_CHROME = 64;
export const DESKTOP_CHROME = 44;

/** iPhone 14 logical aspect ratio (390 × 844). */
const MOBILE_ASPECT = 844 / 390;
const DESKTOP_ASPECT = 10 / 16;

export type CanvasLayout = {
  cols: number;
  rows: number;
  screenWidth: number;
  /** Total frame height including chrome (notch + header + content). */
  screenHeight: number;
  /** Iframe viewport height only. */
  contentHeight: number;
  gap: number;
  padding: number;
};

function mobileWidthForCount(count: number): number {
  if (count <= 3) return 280;
  if (count <= 6) return 252;
  if (count <= 9) return 228;
  return 208;
}

function desktopWidthForCount(count: number): number {
  if (count <= 3) return 400;
  if (count <= 6) return 360;
  if (count <= 9) return 320;
  return 288;
}

function frameDimensions(count: number, isMobile: boolean) {
  const chrome = isMobile ? MOBILE_CHROME : DESKTOP_CHROME;
  const width = isMobile
    ? mobileWidthForCount(count)
    : desktopWidthForCount(count);
  const aspect = isMobile ? MOBILE_ASPECT : DESKTOP_ASPECT;
  const contentHeight = Math.round(width * aspect);
  return {
    screenWidth: width,
    contentHeight,
    screenHeight: chrome + contentHeight,
  };
}

export function getCanvasLayout(
  count: number,
  isMobile: boolean
): CanvasLayout {
  const padding = 36;

  if (count <= 0) {
    const dims = frameDimensions(1, isMobile);
    return {
      cols: 1,
      rows: 1,
      gap: 20,
      padding,
      ...dims,
    };
  }

  let cols: number;
  if (count === 1) cols = 1;
  else if (count === 2) cols = 2;
  else if (count <= 4) cols = 2;
  else if (count <= 6) cols = 3;
  else if (count <= 9) cols = 3;
  else cols = Math.min(5, Math.ceil(count / 2));

  const rows = Math.ceil(count / cols);
  const dims = frameDimensions(count, isMobile);

  let gap: number;
  if (count <= 3) gap = 24;
  else if (count <= 6) gap = 20;
  else gap = 16;

  return { cols, rows, gap, padding, ...dims };
}

export function gridPosition(
  index: number,
  layout: CanvasLayout
): { x: number; y: number } {
  const col = index % layout.cols;
  const row = Math.floor(index / layout.cols);
  return {
    x: layout.padding + col * (layout.screenWidth + layout.gap),
    y: layout.padding + row * (layout.screenHeight + layout.gap),
  };
}

export function layoutContentBounds(
  count: number,
  layout: CanvasLayout
): { width: number; height: number } {
  if (count <= 0) {
    return {
      width: layout.screenWidth + layout.padding * 2,
      height: layout.screenHeight + layout.padding * 2,
    };
  }

  const cols = Math.min(count, layout.cols);
  const rows = Math.ceil(count / layout.cols);

  return {
    width:
      layout.padding * 2 +
      cols * layout.screenWidth +
      (cols - 1) * layout.gap,
    height:
      layout.padding * 2 +
      rows * layout.screenHeight +
      (rows - 1) * layout.gap,
  };
}
