import { useEffect, useRef, useState } from "react";

export function useVisibilityTracker({ enable }: { enable: boolean }) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const node = nodeRef.current;

  useEffect(() => {
    if (!enable || !node) {
      console.log("useVisibilityTracker - disabled");
      return undefined;
    }

    // Observer with default options - the whole view port used.
    // Note that if root element is used then it needs to be the ancestor of the target.
    // In case of infinite scroller the target is always withing the (scrollable!)parent
    // even if the node is technically hidden from the user.
    // https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API#root
    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) =>
        entries.forEach(({ isIntersecting, ...rest }) => {
          if (isIntersecting) {
            setVisible(true);
            console.log("useVisibilityTracker - intersection", rest);
          } else {
            setVisible(false);
            console.log("useVisibilityTracker - out-of-box", rest);
          }
        })
    );
    observer.observe(node);

    console.log("useVisibilityTracker - observe");

    return () => {
      observer.disconnect();
      setVisible(false);
      console.log("useVisibilityTracker - disconnect");
    };
  }, [enable, node]);

  return {
    /**
     * Is the node referenced via `nodeRef` currently visible on the page?
     */
    visible,
    /**
     * A ref to a node whose visibility will be tracked.  This should be set as a ref to a
     * relevant dom element by the component using this hook.
     */
    nodeRef,
  };
}
