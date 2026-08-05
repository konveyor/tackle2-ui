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
 * How long an explicit "follow again" (send, jump-to-bottom) outranks the
 * reader-moved-it check -- long enough to cover MessageBox's smooth
 * scroll animation, which would otherwise land short of a tail that kept
 * growing underneath it and immediately release the pin again.
 */
const FORCE_FOLLOW_MS = 500;

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

/**
 * Keeps the transcript pinned to the newest content while the agent
 * streams, and lets go the moment the reader scrolls up.
 *
 * Two things make this different from MessageBox's own smart scroll:
 *
 * - The pin is driven by DOM mutations, not React renders. Streamed text,
 *   markdown that lays out a beat after its chunk arrives and tool output
 *   expanding all move the tail, and only some of those are renders.
 * - Reader intent is read synchronously, by noticing that the scroll
 *   position is no longer where the last pin left it. Waiting to be told --
 *   MessageBox's state-backed `isSmartScrollActive`, or even a plain scroll
 *   listener -- leaves a window between the reader's scroll and the
 *   notification; a chunk landing in that window scrolls them back down,
 *   which at streaming rates is most of the time.
 */
export function useChatAutoScroll(): {
  messageBoxRef: RefObject<MessageBoxHandle | null>;
  /** Follow the tail again (sending a message, jump-to-bottom). */
  pinToBottom: () => void;
} {
  const messageBoxRef = useRef<MessageBoxHandle | null>(null);
  const scrollerRef = useRef<HTMLElement | null>(null);
  const pinnedRef = useRef(true);
  /** Where the last pin left the scroll position. */
  const pinnedTopRef = useRef(0);
  const forceUntilRef = useRef(0);

  const getScroller = useCallback((): HTMLElement | null => {
    const cached = scrollerRef.current;
    if (cached?.isConnected && isScrollable(cached)) return cached;
    const found = findScroller(messageBoxRef.current);
    if (found !== cached) {
      // Scrolling moved to a different element (see findScroller), so the
      // position we last pinned describes the old one. Adopt the new
      // element's position: a layout change is not the reader scrolling.
      pinnedTopRef.current = found?.scrollTop ?? 0;
      scrollerRef.current = found;
    }
    return found;
  }, []);

  const pin = useCallback((scroller: HTMLElement) => {
    // Direct assignment instead of the handle's scrollToBottom(): that
    // defers to requestAnimationFrame, which is suspended in hidden tabs,
    // wedging its internal scroll queue.
    scroller.scrollTop = scroller.scrollHeight;
    pinnedTopRef.current = scroller.scrollTop;
  }, []);

  const pinToBottom = useCallback(() => {
    pinnedRef.current = true;
    forceUntilRef.current = Date.now() + FORCE_FOLLOW_MS;
    const scroller = getScroller();
    if (scroller) pin(scroller);
  }, [getScroller, pin]);

  useEffect(() => {
    const box = messageBoxRef.current;
    if (!box) return;

    /**
     * Content or the viewport changed. Re-read where the reader is before
     * deciding whether to follow: a position we did not write means they
     * moved it themselves.
     */
    const follow = () => {
      const scroller = getScroller();
      if (!scroller) return;
      const { scrollTop, scrollHeight, clientHeight } = scroller;
      const movedByReader = Math.abs(scrollTop - pinnedTopRef.current) > 1;
      if (movedByReader && Date.now() > forceUntilRef.current) {
        // Also re-arms when they scroll back down to the tail, and copes
        // with the browser clamping scrollTop when the transcript shrinks.
        pinnedRef.current =
          scrollHeight - scrollTop - clientHeight <= AT_BOTTOM_PX;
      }
      if (pinnedRef.current) pin(scroller);
    };

    // Scroll events don't bubble, but they do reach capture-phase listeners
    // on ancestors -- so one listener covers whichever element is scrolling.
    // This only sharpens the response: returning to the tail re-arms the pin
    // right away instead of on the next chunk.
    const onScroll = (event: Event) => {
      if (Date.now() <= forceUntilRef.current) return;
      const scroller = event.target as HTMLElement | null;
      if (!scroller?.scrollHeight) return;
      const { scrollTop, scrollHeight, clientHeight } = scroller;
      pinnedRef.current =
        scrollHeight - scrollTop - clientHeight <= AT_BOTTOM_PX;
      pinnedTopRef.current = scrollTop;
    };

    const root = box.closest(".pf-chatbot") ?? box;
    root.addEventListener("scroll", onScroll, { capture: true, passive: true });

    // Content grew: a streamed chunk, a new message, markdown finishing.
    const contentObserver = new MutationObserver(follow);
    contentObserver.observe(box, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // The viewport grew or shrank: window resize, details panel collapsing.
    const sizeObserver = new ResizeObserver(follow);
    sizeObserver.observe(box);

    return () => {
      root.removeEventListener("scroll", onScroll, { capture: true });
      contentObserver.disconnect();
      sizeObserver.disconnect();
    };
  }, [getScroller, pin]);

  return { messageBoxRef, pinToBottom };
}
