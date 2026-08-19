import { useCallback, useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { MessageBoxHandle } from "@patternfly/chatbot";

/**
 * Distance from the bottom (px) still counted as "reading the tail". Wide
 * enough to survive sub-pixel rounding and a growing last line, narrow
 * enough that a deliberate scroll up releases the pin.
 */
const AT_BOTTOM_PX = 40;

/**
 * After input that scrolls AWAY from the tail, how long a scroll event that
 * still reads "at the bottom" is ignored: the first scroll events of a wheel
 * or touch gesture land within AT_BOTTOM_PX of where it started, and
 * re-arming on them would drag the reader straight back.
 */
const AWAY_GRACE_MS = 400;

function isScrollable(el: Element): boolean {
  const { overflowY } = window.getComputedStyle(el);
  return (
    el.scrollHeight > el.clientHeight &&
    (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay")
  );
}

/**
 * The element that actually scrolls. Normally MessageBox itself -- but PF
 * hands scrolling to the chatbot container under
 * `@media (max-height: 518px)` (short windows, 200% zoom), where a pin
 * written to MessageBox would silently do nothing.
 */
function findScroller(box: HTMLElement | null): HTMLElement | null {
  for (let el: HTMLElement | null = box; el; el = el.parentElement) {
    if (isScrollable(el)) return el;
    if (el.classList.contains("pf-chatbot")) break;
  }
  return null;
}

function atBottom(el: HTMLElement): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= AT_BOTTOM_PX;
}

/**
 * Keeps the transcript pinned to the newest content while the agent
 * streams, and lets go the moment the reader scrolls up.
 *
 * Two things make this different from MessageBox's own smart scroll:
 *
 * - The pin is driven by DOM mutations, not React renders. Streamed text,
 *   markdown that lays out a beat after its chunk arrives and tool output
 *   expanding all move the tail, and only some of those are renders.
 * - Reader intent is read from INPUT -- a wheel/touch/key scroll up, or a
 *   drag on the scrollbar -- never inferred from the scroll position.
 *   Positions drift without any reader: the browser's scroll anchoring
 *   shifts scrollTop when content above the viewport grows, and a clamped
 *   pin reads back a pixel or two off; treating that as "the reader
 *   moved" released the pin for good on the first big message. Scrolling
 *   back to the tail (by any means, including the jump button) re-arms it.
 *
 * Each scroll container is wired once: MessageBox remounts when the panel
 * toggles full screen (it is portaled out), so the listeners and observers
 * follow the element the ref currently points at.
 */
export function useChatAutoScroll(): {
  messageBoxRef: RefObject<MessageBoxHandle | null>;
  /** Follow the tail again (sending a message, jump-to-bottom). */
  pinToBottom: () => void;
} {
  const messageBoxRef = useRef<MessageBoxHandle | null>(null);
  const scrollerRef = useRef<HTMLElement | null>(null);
  const pinnedRef = useRef(true);
  const draggingRef = useRef(false);
  /** Until when scroll events must not re-arm the pin (see AWAY_GRACE_MS). */
  const awayUntilRef = useRef(0);
  const wiredBoxRef = useRef<HTMLElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const getScroller = useCallback((): HTMLElement | null => {
    const cached = scrollerRef.current;
    if (cached?.isConnected && isScrollable(cached)) return cached;
    const found = findScroller(messageBoxRef.current);
    scrollerRef.current = found;
    return found;
  }, []);

  const pin = useCallback((scroller: HTMLElement) => {
    // Direct assignment instead of the handle's scrollToBottom(): that
    // defers to requestAnimationFrame, which is suspended in hidden tabs,
    // wedging its internal scroll queue.
    scroller.scrollTop = scroller.scrollHeight;
  }, []);

  const pinToBottom = useCallback(() => {
    pinnedRef.current = true;
    const scroller = getScroller();
    if (scroller) pin(scroller);
  }, [getScroller, pin]);

  const attach = useCallback(() => {
    const box = messageBoxRef.current;
    if (!box || box === wiredBoxRef.current) return;
    cleanupRef.current?.();
    wiredBoxRef.current = box;
    scrollerRef.current = null;

    // Content grew or the viewport changed: follow if still pinned.
    const follow = () => {
      const scroller = getScroller();
      if (scroller && pinnedRef.current && !draggingRef.current) pin(scroller);
    };

    // Input that scrolls away from the tail releases the pin ...
    const away = () => {
      pinnedRef.current = false;
      awayUntilRef.current = Date.now() + AWAY_GRACE_MS;
    };
    const onWheel = (event: WheelEvent) => {
      if (event.deltaY < 0) away();
    };
    const onTouchMove = away;
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "ArrowUp" ||
        event.key === "PageUp" ||
        event.key === "Home"
      ) {
        away();
      }
    };
    // ... and so does grabbing the scrollbar (a click past clientWidth is
    // on the bar, not on content); the pin stays off while dragging.
    const onMouseDown = (event: MouseEvent) => {
      const scroller = getScroller();
      if (
        scroller &&
        event.target === scroller &&
        event.offsetX >= scroller.clientWidth
      ) {
        draggingRef.current = true;
        pinnedRef.current = false;
      }
    };
    const onMouseUp = () => {
      draggingRef.current = false;
    };
    // ... while arriving back at the tail, by any means, re-arms it.
    // Scroll events don't bubble, but they do reach capture-phase listeners
    // on ancestors -- so one listener covers whichever element is scrolling.
    const onScroll = (event: Event) => {
      const scroller = event.target as HTMLElement | null;
      if (!scroller?.scrollHeight) return;
      if (Date.now() < awayUntilRef.current) return;
      if (atBottom(scroller)) pinnedRef.current = true;
    };

    const root = (box.closest(".pf-chatbot") as HTMLElement | null) ?? box;
    root.addEventListener("wheel", onWheel, { capture: true, passive: true });
    root.addEventListener("touchmove", onTouchMove, {
      capture: true,
      passive: true,
    });
    root.addEventListener("keydown", onKeyDown, { capture: true });
    root.addEventListener("mousedown", onMouseDown, { capture: true });
    window.addEventListener("mouseup", onMouseUp);
    root.addEventListener("scroll", onScroll, { capture: true, passive: true });

    // Content grew: a streamed chunk, a new message, markdown finishing.
    const contentObserver = new MutationObserver(follow);
    contentObserver.observe(box, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    // The viewport grew or shrank: window resize, details panel collapsing,
    // the panel expanding to full screen.
    const sizeObserver = new ResizeObserver(follow);
    sizeObserver.observe(box);

    cleanupRef.current = () => {
      root.removeEventListener("wheel", onWheel, { capture: true });
      root.removeEventListener("touchmove", onTouchMove, { capture: true });
      root.removeEventListener("keydown", onKeyDown, { capture: true });
      root.removeEventListener("mousedown", onMouseDown, { capture: true });
      window.removeEventListener("mouseup", onMouseUp);
      root.removeEventListener("scroll", onScroll, { capture: true });
      contentObserver.disconnect();
      sizeObserver.disconnect();
      if (wiredBoxRef.current === box) wiredBoxRef.current = null;
    };

    // A freshly (re)mounted box starts at the top; land on the tail if we
    // were following it.
    follow();
  }, [getScroller, pin]);

  // Wire on mount; re-wire whenever the panel re-renders with a new box
  // (attach is idempotent for the same element). Detach on unmount.
  useEffect(() => {
    attach();
  });
  useEffect(() => () => cleanupRef.current?.(), []);

  return { messageBoxRef, pinToBottom };
}
