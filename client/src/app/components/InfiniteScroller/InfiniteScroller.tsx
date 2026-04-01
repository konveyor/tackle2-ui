import { ReactNode, useEffect, useState } from "react";
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
  pageSize: number;
}

export const InfiniteScroller = ({
  children,
  fetchMore,
  hasMore,
  itemCount,
  pageSize,
}: InfiniteScrollerProps) => {
  const { t } = useTranslation();
  const [readyForFetch, setReadyForFetch] = useState(false);
  const { visible: isSentinelVisible, nodeRef: sentinelRef } =
    useVisibilityTracker({
      enable: hasMore,
    });
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- derived flag from visibility tracker
    setReadyForFetch(!!isSentinelVisible);
  }, [isSentinelVisible]);

  useEffect(() => {
    if (readyForFetch) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear flag after fetch request
      setReadyForFetch(!fetchMore());
    }
    // reference to fetchMore() changes based on query state and ensures that the effect is triggered in the right moment
    // i.e. after fetch triggered by the previous fetchMore() call finished
  }, [fetchMore, readyForFetch]);

  return (
    <div>
      {children}
      {hasMore && (
        <div
          ref={sentinelRef}
          // re-create the node with every page change to force new Intersection observer
          key={Math.ceil(itemCount / pageSize)}
          className="infinite-scroll-sentinel"
        >
          {t("message.loadingTripleDot")}
        </div>
      )}
    </div>
  );
};
