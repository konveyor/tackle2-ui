import React, { ReactNode, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useVisibilityTracker } from "./useVisibilityTracker";
import "./InfiniteScroller.css";

export interface InfiniteScrollerProps {
  // content to display
  children: ReactNode;
  // function triggered if sentinel node is visible to load more items
  // returns false if call was rejected by the scheduler
  fetchMore: () => boolean;
  hasMore: boolean;
  // number of items currently displayed/known
  itemCount: number;
}

export const InfiniteScroller = ({
  children,
  fetchMore,
  hasMore,
  itemCount,
}: InfiniteScrollerProps) => {
  const { t } = useTranslation();
  // Track how many items were known at time of triggering the fetch.
  // This allows to detect edge case when second(or more) fetchMore() is triggered before
  // IntersectionObserver is able to detect out-of-view event.
  // Initializing with zero ensures that the effect will be triggered immediately
  // (parent is expected to display empty state until some items are available).
  const itemCountRef = useRef(0);
  const { visible: isSentinelVisible, nodeRef: sentinelRef } =
    useVisibilityTracker({
      enable: hasMore,
    });

  useEffect(
    () => {
      if (
        isSentinelVisible &&
        itemCountRef.current !== itemCount &&
        fetchMore() // fetch may be blocked if background refresh is in progress (or other manual fetch)
      ) {
        // fetchMore call was triggered (it may fail but will be subject to React Query retry policy)
        itemCountRef.current = itemCount;
      }
    },
    // reference to fetchMore() changes based on query state and ensures that the effect is triggered in the right moment
    // i.e. after fetch triggered by the previous fetchMore() call finished
    [isSentinelVisible, fetchMore, itemCount]
  );

  return (
    <div>
      {children}
      {hasMore && (
        <div ref={sentinelRef} className="infinite-scroll-sentinel">
          {t("message.loadingTripleDot")}
        </div>
      )}
    </div>
  );
};
