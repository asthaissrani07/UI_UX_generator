"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { wrapScreenHtml } from "@/lib/iframe-html";
import { sanitizeScreenHtml } from "@/lib/sanitize-screen-html";
import { MOBILE_CHROME, DESKTOP_CHROME } from "@/lib/canvas-layout";
import { useSmoothDrag } from "@/hooks/use-smooth-drag";
import { Skeleton } from "@/components/ui/skeleton";
import ScreenHandler from "./screen-handler";
import type { ProjectType, ScreenConfig } from "@/types";

type Props = {
  screen: ScreenConfig;
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  contentHeight?: number;
  projectDetail: ProjectType;
  activeTheme: string;
  canvasScale: number;
  iframeRefCallback: (index: number, el: HTMLIFrameElement | null) => void;
  onScreenUpdated: (screen: ScreenConfig) => void;
  onScreenDeleted: (screenId: string) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onPositionChange: (index: number, pos: { x: number; y: number }) => void;
};

export default function ScreenFrame({
  screen,
  index,
  x,
  y,
  width,
  height,
  contentHeight: contentHeightProp,
  projectDetail,
  activeTheme,
  canvasScale,
  iframeRefCallback,
  onScreenUpdated,
  onScreenDeleted,
  onDragStart,
  onDragEnd,
  onPositionChange,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const theme = activeTheme || projectDetail.theme || "Polar Mint";
  const isMobile = projectDetail.device === "mobile";

  const safeW = Number.isFinite(width) && width > 0 ? width : 280;
  const safeH = Number.isFinite(height) && height > 0 ? height : 680;
  const chrome = isMobile ? MOBILE_CHROME : DESKTOP_CHROME;
  const viewportH =
    contentHeightProp && contentHeightProp > 0
      ? contentHeightProp
      : safeH - chrome;

  const { position, isDragging, handleProps } = useSmoothDrag({
    initial: { x, y },
    scale: canvasScale,
    onDragStart,
    onDragEnd,
    onPositionChange: (pos) => onPositionChange(index, pos),
  });

  const applyThemeToIframe = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe || !screen.code) return;
    iframe.srcdoc = wrapScreenHtml(
      sanitizeScreenHtml(screen.code),
      theme,
      viewportH,
      safeW
    );
  }, [screen.code, theme, viewportH, safeW]);

  useEffect(() => {
    applyThemeToIframe();
  }, [applyThemeToIframe]);

  const frameShell = (body: ReactNode) => (
    <div
      data-screen-frame-root
      data-screen-index={index}
      className={`screen-frame absolute select-none ${
        isDragging ? "screen-frame-dragging z-50" : "z-10"
      }`}
      style={{
        left: 0,
        top: 0,
        width: safeW,
        height: safeH,
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        willChange: isDragging ? "transform" : "auto",
      }}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.08)] ring-1 ring-black/[0.04]">
        {isMobile && (
          <div className="flex h-5 shrink-0 items-center justify-center bg-zinc-100">
            <div className="h-1 w-12 rounded-full bg-zinc-300" />
          </div>
        )}
        {body}
      </div>
    </div>
  );

  if (!screen.code) {
    return frameShell(
      <>
        <div className="flex h-11 shrink-0 items-center border-b bg-zinc-50 px-3">
          <Skeleton className="h-4 w-32" />
        </div>
        <div
          className="flex flex-1 flex-col gap-3 overflow-hidden bg-white p-4"
          style={{ height: viewportH, minHeight: viewportH }}
        >
          <Skeleton className="h-8 w-1/2 rounded-lg" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-6 w-3/4 rounded-lg" />
          <Skeleton className="flex-1 w-full rounded-xl" />
        </div>
      </>
    );
  }

  const srcDoc = wrapScreenHtml(
    sanitizeScreenHtml(screen.code),
    theme,
    viewportH,
    safeW
  );

  return frameShell(
    <>
      <ScreenHandler
        screen={screen}
        projectId={projectDetail.projectId}
        device={projectDetail.device}
        theme={theme}
        projectVisualDescription={projectDetail.projectVisualDescription}
        iframeRef={iframeRef}
        onUpdated={onScreenUpdated}
        onDeleted={onScreenDeleted}
        dragHandleProps={handleProps}
        isDragging={isDragging}
      />
      <div
        data-screen-capture
        className="relative shrink-0 overflow-hidden bg-white"
        style={{ height: viewportH, minHeight: viewportH }}
      >
        <iframe
          key={`iframe-${screen.id}-${theme}-${viewportH}`}
          data-screen-capture-iframe
          data-screen-index={index}
          ref={(el) => {
            iframeRef.current = el;
            iframeRefCallback(index, el);
          }}
          title={screen.screenName ?? "Screen"}
          srcDoc={srcDoc}
          sandbox="allow-scripts allow-same-origin"
          scrolling="no"
          className={`screen-iframe block h-full w-full border-0 ${
            isDragging ? "pointer-events-none" : ""
          }`}
        />
      </div>
    </>
  );
}
