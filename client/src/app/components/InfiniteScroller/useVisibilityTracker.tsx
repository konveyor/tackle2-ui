import { useEffect, useRef, useState, useCallback } from "react";

export function useVisibilityTracker({ enable }: { enable: boolean }) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState<boolean | undefined>(false);
  const node = nodeRef.current;

  // state is set from IntersectionObserver callbacks which may not align with React lifecycle
  // we can add extra safety by using the same approach as Console's useSafetyFirst() hook
  // https://github.com/openshift/console/blob/9d4a9b0a01b2de64b308f8423a325f1fae5f8726/frontend/packages/console-dynamic-plugin-sdk/src/app/components/safety-first.tsx#L10
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    []
  );
  const setVisibleSafe = useCallback((newValue) => {
    if (mounted.current) {
      setVisible(newValue);
    }
  }, []);

  useEffect(() => {
    if (enable && !node) {
      // use falsy value different than initial value - state change will trigger render()
      // otherwise we need to wait for the next render() to read node ref
      setVisibleSafe(undefined);
      return undefined;
    }

    if (!enable || !node) {
      return undefined;
    }

    // Observer with default options - the whole view port used.
    // Note that if root element is used then it needs to be the ancestor of the target.
    // https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API#root
    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) =>
        entries.forEach(({ isIntersecting }) => {
          if (isIntersecting) {
            setVisibleSafe(true);
          } else {
            setVisibleSafe(false);
          }
        })
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      setVisibleSafe(false);
    };
  }, [enable, node, setVisibleSafe]);

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
