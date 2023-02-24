import {
  DrawerActions,
  DrawerCloseButton,
  DrawerHead,
} from "@patternfly/react-core";
import * as React from "react";

const usePageDrawerState = () => {
  const [isDrawerExpanded, setIsDrawerExpanded] = React.useState(false);
  const [drawerChildren, setDrawerChildren] =
    React.useState<React.ReactNode>(null);
  const drawerFocusRef = React.useRef(document.createElement("span"));
  return {
    isDrawerExpanded,
    setIsDrawerExpanded,
    drawerChildren,
    setDrawerChildren,
    drawerFocusRef: drawerFocusRef as typeof drawerFocusRef | null,
  };
};

export type PageDrawerState = ReturnType<typeof usePageDrawerState>;

export const PageDrawerContext = React.createContext<PageDrawerState>({
  isDrawerExpanded: false,
  setIsDrawerExpanded: () => {},
  drawerChildren: null,
  setDrawerChildren: () => {},
  drawerFocusRef: null,
});

export const PageDrawerContextProvider: React.FunctionComponent<{
  children: React.ReactNode;
}> = ({ children }) => (
  <PageDrawerContext.Provider value={usePageDrawerState()}>
    {children}
  </PageDrawerContext.Provider>
);

export interface IPageDrawerContentPortalProps {
  isExpanded: boolean;
  onCloseClick: () => void;
  children: React.ReactNode;
}

export const PageDrawerContent: React.FunctionComponent<
  IPageDrawerContentPortalProps
> = ({ isExpanded: localIsExpandedProp, onCloseClick, children }) => {
  const { setIsDrawerExpanded, drawerFocusRef, setDrawerChildren } =
    React.useContext(PageDrawerContext);

  // Lift the value of isExpanded out to the context, but derive it from deeper state such as the presence of a selected table row
  React.useEffect(() => {
    setIsDrawerExpanded(localIsExpandedProp);
    return () => {
      setIsDrawerExpanded(false);
    };
  }, [localIsExpandedProp]);

  React.useEffect(() => {
    setDrawerChildren(
      <DrawerHead>
        <span tabIndex={0} ref={drawerFocusRef}>
          {children}
        </span>
        <DrawerActions>
          <DrawerCloseButton
            // We call onCloseClick here instead of setIsDrawerExpanded
            // because we want the isExpanded prop here to be the source of truth.
            // (state driven from the parent of the PageDrawerContent, not from the context)
            onClick={onCloseClick}
          />
        </DrawerActions>
      </DrawerHead>
    );
  }, [children]);
  return null;
};
