import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import type { Point } from '../types';

/** Movement under this many pixels is a click, not a drag. */
const CLICK_SLOP_PX = 4;

/** How much of a dragged element must stay on screen, so it cannot be lost. */
const KEEP_VISIBLE_PX = 40;

const STORAGE_PREFIX = 'vyom:drag:';

function load(key: string): Point {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return { x: 0, y: 0 };
    const parsed = JSON.parse(raw) as Partial<Point>;
    return { x: Number(parsed.x) || 0, y: Number(parsed.y) || 0 };
  } catch {
    return { x: 0, y: 0 };
  }
}

function save(key: string, point: Point) {
  try {
    if (point.x === 0 && point.y === 0) localStorage.removeItem(STORAGE_PREFIX + key);
    else localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(point));
  } catch {
    // Storage is a convenience; a private window still gets a draggable panel.
  }
}

/**
 * Makes a fixed-position element movable by dragging a handle.
 *
 * The element keeps its stylesheet position and is offset from it with a
 * transform, so the rules that already place the dev panels and their reopen
 * buttons go on working; the drag only adds to them. The offset is remembered
 * per `key`, and a double-click on the handle puts the element back.
 *
 * Attach `style` to the element being moved and `handleProps` to the part of
 * it that is grabbed — the whole button when collapsed, the header when open.
 * A click on the handle still goes through unless the pointer actually moved,
 * so a collapsed button can be both picked up and pressed.
 */
export function useDraggable(key: string) {
  const [offset, setOffset] = useState<Point>(() => load(key));
  const elementRef = useRef<HTMLElement | null>(null);
  const drag = useRef<{ pointerId: number; start: Point; base: Point; moved: boolean } | null>(
    null,
  );
  const suppressClick = useRef(false);

  useEffect(() => {
    save(key, offset);
  }, [key, offset]);

  /** Keeps at least a corner of the element on screen. */
  const clamp = useCallback((next: Point): Point => {
    const element = elementRef.current;
    if (!element) return next;
    const rect = element.getBoundingClientRect();
    // Where the element would be with no offset at all.
    const left = rect.left - offset.x;
    const top = rect.top - offset.y;
    const minX = KEEP_VISIBLE_PX - rect.width - left;
    const maxX = window.innerWidth - KEEP_VISIBLE_PX - left;
    const minY = -top;
    const maxY = window.innerHeight - KEEP_VISIBLE_PX - top;
    return {
      x: Math.min(Math.max(next.x, minX), maxX),
      y: Math.min(Math.max(next.y, minY), maxY),
    };
  }, [offset.x, offset.y]);

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      // Controls inside a header — the close button, say — keep their own job.
      const target = event.target as HTMLElement;
      if (target !== event.currentTarget && target.closest('button, input, select, a, textarea')) {
        return;
      }
      elementRef.current = event.currentTarget.closest<HTMLElement>('[data-draggable]');
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = {
        pointerId: event.pointerId,
        start: { x: event.clientX, y: event.clientY },
        base: offset,
        moved: false,
      };
    },
    [offset],
  );

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const state = drag.current;
      if (!state || state.pointerId !== event.pointerId) return;
      const dx = event.clientX - state.start.x;
      const dy = event.clientY - state.start.y;
      if (!state.moved && Math.hypot(dx, dy) < CLICK_SLOP_PX) return;
      state.moved = true;
      setOffset(clamp({ x: state.base.x + dx, y: state.base.y + dy }));
    },
    [clamp],
  );

  const onPointerUp = useCallback((event: PointerEvent<HTMLElement>) => {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    drag.current = null;
    suppressClick.current = state.moved;
  }, []);

  // The click that follows a drag's pointer-up would otherwise open or close
  // the panel; it is swallowed here, at capture, before any handler sees it.
  const onClickCapture = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const onDoubleClick = useCallback(() => setOffset({ x: 0, y: 0 }), []);

  const style: CSSProperties =
    offset.x === 0 && offset.y === 0
      ? {}
      : { transform: `translate(${offset.x}px, ${offset.y}px)` };

  const handleProps = {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
    onClickCapture,
    onDoubleClick,
    style: { touchAction: 'none' } as CSSProperties,
    title: 'Drag to move · double-click to reset',
  };

  return {
    /** For the element being moved. */
    hostProps: { 'data-draggable': key, style },
    /** For the part of it that is grabbed. */
    handleProps,
    /** For an element that is both — a collapsed button. */
    collapsedProps: {
      ...handleProps,
      'data-draggable': key,
      style: { ...handleProps.style, ...style },
    },
  };
}
