import React, { ReactNode, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useInfiniteScroll } from "./useInfiniteScroller";
import "./InfiniteScroller.css";

export interface InfiniteScrollerProps<T> {
  children: ReactNode;
  className: string;
  fetchMore: () => undefined;
  entities: T[];
  hasMore: boolean;
}

export const InfiniteScroller = <T,>({
  children,
  className,
  fetchMore,
  entities,
  hasMore,
}: InfiniteScrollerProps<T>) => {
  const { t } = useTranslation();
  // Handle the infinite scroll and pagination
  const [page, sentinelRef, scrollerRef] = useInfiniteScroll({
    hasMore,
    distance: 0,
  });

  useEffect(() => {
    // parent will not display this component until the first page of data is loaded
    if (page > 0) {
      fetchMore();
    }
  }, [page, fetchMore]);

  useEffect(() => {
    if (!scrollerRef.current || !sentinelRef.current) {
      return;
    }

    //
    // If a page fetch doesn't pull enough entities to push the sentinel out of view
    // underlying IntersectionObserver doesn't fire another event, and the scroller
    // gets stuck.  Manually check if the sentinel is in view, and if it is, fetch
    // more data.  The effect is only run when the `vms` part of the redux store is
    // updated.
    //
    const scrollRect = scrollerRef.current.getBoundingClientRect();
    const scrollVisibleTop = scrollRect.y;
    const scrollVisibleBottom = scrollRect.y + scrollRect.height;

    const sentinelRect = sentinelRef.current.getBoundingClientRect();
    const sentinelTop = sentinelRect.y;
    const sentinelBottom = sentinelRect.y + sentinelRect.height;

    const sentinelStillInView =
      sentinelBottom >= scrollVisibleTop && sentinelTop <= scrollVisibleBottom;
    if (sentinelStillInView) {
      fetchMore();
    }
  }, [entities, scrollerRef, sentinelRef, fetchMore]);

  return (
    <div ref={scrollerRef} className={className}>
      {children}
      {hasMore && (
        <div ref={sentinelRef} className={"infinite-scroll-sentinel"}>
          {t("loadingTripleDot")}
        </div>
      )}
    </div>
  );
};
