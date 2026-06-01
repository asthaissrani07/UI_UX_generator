"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Point = { x: number; y: number };

type Options = {
  initial: Point;
  scale: number;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onPositionChange?: (point: Point) => void;
};

export function useSmoothDrag({
  initial,
  scale,
  onDragStart,
  onDragEnd,
  onPositionChange,
}: Options) {
  const [position, setPosition] = useState<Point>(initial);
  const [isDragging, setIsDragging] = useState(false);

  const positionRef = useRef(initial);
  const scaleRef = useRef(scale);
  const rafRef = useRef<number | null>(null);
  const dragRef = useRef({
    active: false,
    pointerId: -1,
    startClient: { x: 0, y: 0 },
    startPos: { x: 0, y: 0 },
  });

  scaleRef.current = scale > 0 ? scale : 1;

  useEffect(() => {
    positionRef.current = initial;
    setPosition(initial);
  }, [initial.x, initial.y]);

  const flushPosition = useCallback(() => {
    rafRef.current = null;
    const next = positionRef.current;
    setPosition(next);
    onPositionChange?.(next);
  }, [onPositionChange]);

  const schedulePositionUpdate = useCallback(
    (next: Point) => {
      const x = Number.isFinite(next.x) ? next.x : 0;
      const y = Number.isFinite(next.y) ? next.y : 0;
      positionRef.current = { x, y };

      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(flushPosition);
      }
    },
    [flushPosition]
  );

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      dragRef.current = {
        active: true,
        pointerId: e.pointerId,
        startClient: { x: e.clientX, y: e.clientY },
        startPos: { ...positionRef.current },
      };

      setIsDragging(true);
      onDragStart?.();
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [onDragStart]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!dragRef.current.active || dragRef.current.pointerId !== e.pointerId) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();

      const s = scaleRef.current;
      const dx = (e.clientX - dragRef.current.startClient.x) / s;
      const dy = (e.clientY - dragRef.current.startClient.y) / s;

      schedulePositionUpdate({
        x: dragRef.current.startPos.x + dx,
        y: dragRef.current.startPos.y + dy,
      });
    },
    [schedulePositionUpdate]
  );

  const endDrag = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!dragRef.current.active || dragRef.current.pointerId !== e.pointerId) {
        return;
      }
      dragRef.current.active = false;
      setIsDragging(false);
      onDragEnd?.();

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      flushPosition();

      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    },
    [onDragEnd, flushPosition]
  );

  return {
    position,
    isDragging,
    handleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
  };
}
