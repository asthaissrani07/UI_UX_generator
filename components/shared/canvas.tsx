"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  TransformWrapper,
  TransformComponent,
  useControls,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";
import { Plus, Minus, Maximize2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScreenFrame from "./screen-frame";
import { useActiveTheme } from "@/context/setting-context";
import {
  getCanvasLayout,
  gridPosition,
  layoutContentBounds,
} from "@/lib/canvas-layout";
import type { ProjectType, ScreenConfig } from "@/types";

const ANIMATION_MS = 280;
const ANIMATION_TYPE = "easeOutCubic" as const;

type Props = {
  projectDetail: ProjectType;
  screenConfig: ScreenConfig[];
  onScreenUpdated: (screen: ScreenConfig, index: number) => void;
  onScreenDeleted: (screenId: string) => void;
  iframeRefs: React.MutableRefObject<(HTMLIFrameElement | null)[]>;
};

function CanvasControls({
  onFitAll,
  onReset,
}: {
  onFitAll: () => void;
  onReset: () => void;
}) {
  const { zoomIn, zoomOut } = useControls();
  return (
    <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full border px-2 py-1.5 workspace-canvas-controls">
      <Button
        variant="ghost"
        size="icon-sm"
        className="rounded-full"
        onClick={() => zoomOut(0.1, ANIMATION_MS, ANIMATION_TYPE)}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 rounded-full px-3 text-xs font-medium"
        onClick={onFitAll}
      >
        <Maximize2 className="h-3.5 w-3.5" />
        Fit all
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="rounded-full"
        onClick={() => zoomIn(0.1, ANIMATION_MS, ANIMATION_TYPE)}
      >
        <Plus className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="rounded-full"
        onClick={onReset}
        title="Reset zoom"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export default function Canvas({
  projectDetail,
  screenConfig,
  onScreenUpdated,
  onScreenDeleted,
  iframeRefs,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);
  const activeTheme = useActiveTheme(projectDetail.theme ?? "Polar Mint");

  const [canvasScale, setCanvasScale] = useState(1);
  const [isFrameDragging, setIsFrameDragging] = useState(false);
  const [isCanvasPanning, setIsCanvasPanning] = useState(false);
  const [positions, setPositions] = useState<Record<number, { x: number; y: number }>>({});

  const isMobile = projectDetail.device === "mobile";
  const count = screenConfig.length;

  const layout = useMemo(
    () => getCanvasLayout(count, isMobile),
    [count, isMobile]
  );

  const { screenWidth, screenHeight } = layout;

  useEffect(() => {
    setPositions(() => {
      const next: Record<number, { x: number; y: number }> = {};
      for (let i = 0; i < count; i++) {
        next[i] = gridPosition(i, layout);
      }
      return next;
    });
  }, [
    count,
    layout.cols,
    layout.screenWidth,
    layout.screenHeight,
    layout.gap,
    layout.padding,
  ]);

  const contentBounds = useMemo(() => {
    if (count === 0) {
      return layoutContentBounds(0, layout);
    }

    let maxX = layout.padding;
    let maxY = layout.padding;

    screenConfig.forEach((_, i) => {
      const p = positions[i] ?? gridPosition(i, layout);
      maxX = Math.max(maxX, p.x + screenWidth);
      maxY = Math.max(maxY, p.y + screenHeight);
    });

    return {
      width: maxX + layout.padding,
      height: maxY + layout.padding,
    };
  }, [count, layout, positions, screenWidth, screenHeight, screenConfig.length]);

  const fitToView = useCallback(
    (animationTime = ANIMATION_MS) => {
      const api = transformRef.current;
      const container = containerRef.current;
      if (!api || !container || count === 0) return;

      const vw = container.clientWidth;
      const vh = container.clientHeight;
      if (vw <= 0 || vh <= 0) return;

      const margin = 20;
      const scaleX = (vw - margin) / contentBounds.width;
      const scaleY = (vh - margin) / contentBounds.height;
      const scale = Math.min(scaleX, scaleY) * 0.97;
      const clampedScale = Math.max(Math.min(scale, 1.15), 0.15);

      const positionX = (vw - contentBounds.width * clampedScale) / 2;
      const positionY = (vh - contentBounds.height * clampedScale) / 2;

      if (
        !Number.isFinite(clampedScale) ||
        !Number.isFinite(positionX) ||
        !Number.isFinite(positionY)
      ) {
        return;
      }

      api.setTransform(positionX, positionY, clampedScale, animationTime, ANIMATION_TYPE);
    },
    [contentBounds, count]
  );

  useEffect(() => {
    if (count === 0) return;
    const t = setTimeout(() => fitToView(0), 120);
    return () => clearTimeout(t);
  }, [count, contentBounds.width, contentBounds.height, fitToView]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || count === 0) return;

    const observer = new ResizeObserver(() => {
      fitToView(0);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [count, fitToView]);

  return (
    <div
      ref={containerRef}
      className={`canvas-workspace workspace-canvas relative h-[min(88vh,980px)] min-h-[520px] w-full min-w-0 flex-1 overflow-hidden rounded-xl border ${
        isCanvasPanning ? "canvas-panning" : ""
      }`}
    >
      <TransformWrapper
        ref={transformRef}
        onInit={(ref) => {
          transformRef.current = ref;
          setTimeout(() => fitToView(0), 100);
        }}
        onTransformed={(_, state) => {
          if (Number.isFinite(state.scale)) setCanvasScale(state.scale);
        }}
        onPanningStart={() => setIsCanvasPanning(true)}
        onPanningStop={() => setIsCanvasPanning(false)}
        initialScale={1}
        minScale={0.12}
        maxScale={2.5}
        limitToBounds={false}
        centerOnInit={false}
        smooth
        wheel={{ step: 0.035, smoothStep: 0.002 }}
        panning={{
          disabled: isFrameDragging,
          velocityDisabled: false,
          excluded: ["drag-handle", "screen-frame", "screen-frame-dragging"],
        }}
        pinch={{ step: 0.05 }}
        doubleClick={{ disabled: true }}
        zoomAnimation={{ animationTime: ANIMATION_MS, animationType: ANIMATION_TYPE }}
        alignmentAnimation={{ animationTime: ANIMATION_MS, animationType: ANIMATION_TYPE }}
        velocityAnimation={{
          disabled: false,
          animationTime: 300,
          sensitivity: 1,
        }}
      >
        {() => (
          <>
            <TransformComponent
              wrapperClass="!w-full !h-full canvas-surface"
              contentClass="!w-auto !h-auto"
              wrapperStyle={{
                width: "100%",
                height: "100%",
              }}
              contentStyle={{
                width: contentBounds.width,
                height: contentBounds.height,
                backgroundColor: "#d8e0e8",
                backgroundImage:
                  "radial-gradient(circle, rgba(42, 64, 96, 0.08) 1px, transparent 1px)",
                backgroundSize: "16px 16px",
              }}
            >
              <div
                className="relative"
                style={{
                  width: contentBounds.width,
                  height: contentBounds.height,
                }}
              >
                {screenConfig.map((screen, index) => {
                  const pos = positions[index] ?? gridPosition(index, layout);
                  return (
                    <ScreenFrame
                      key={`frame-${screen.id}-${index}`}
                      screen={screen}
                      index={index}
                      x={pos.x}
                      y={pos.y}
                      width={screenWidth}
                      height={layout.screenHeight}
                      contentHeight={layout.contentHeight}
                      projectDetail={projectDetail}
                      activeTheme={activeTheme}
                      canvasScale={canvasScale}
                      iframeRefCallback={(i, el) => {
                        iframeRefs.current[i] = el;
                      }}
                      onScreenUpdated={(s) => onScreenUpdated(s, index)}
                      onScreenDeleted={onScreenDeleted}
                      onDragStart={() => setIsFrameDragging(true)}
                      onDragEnd={() => setIsFrameDragging(false)}
                      onPositionChange={(i, p) => {
                        setPositions((prev) => ({ ...prev, [i]: p }));
                      }}
                    />
                  );
                })}
              </div>
            </TransformComponent>
            <CanvasControls
              onFitAll={() => fitToView(ANIMATION_MS)}
              onReset={() => fitToView(ANIMATION_MS)}
            />
          </>
        )}
      </TransformWrapper>
    </div>
  );
}
