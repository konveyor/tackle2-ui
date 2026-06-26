import { useCallback, useEffect, useState } from "react";

export function useVisibilityTracker({ enable }: { enable: boolean }) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const nodeRef = useCallback((el: HTMLDivElement | null) => setNode(el), []);
  const [visible, setVisible] = useState<boolean | undefined>(false);

  useEffect(() => {
    if (!enable || !node) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) =>
        entries.forEach(({ isIntersecting }) => {
          setVisible(isIntersecting);
        })
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      setVisible(false);
    };
  }, [enable, node]);

  return {
    /**
     * Is the node referenced via `nodeRef` currently visible on the page?
     */
    visible,
    /**
     * A callback ref to a node whose visibility will be tracked. This should
     * be set as a ref to a relevant DOM element by the component using this hook.
     */
    nodeRef,
  };
}
