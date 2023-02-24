import {
  DrawerActions,
  DrawerCloseButton,
  DrawerHead,
} from "@patternfly/react-core";
import * as React from "react";
import * as ReactDOM from "react-dom";

const usePageDrawerState = () => {
  const [isDrawerExpanded, setIsDrawerExpanded] = React.useState(false);
  const drawerPanelRef = React.useRef(document.createElement("div"));
  const drawerFocusRef = React.useRef(document.createElement("span"));
  return {
    isDrawerExpanded,
    setIsDrawerExpanded,
    drawerPanelRef: drawerPanelRef as typeof drawerPanelRef | null,
    drawerFocusRef: drawerFocusRef as typeof drawerFocusRef | null,
  };
};

export type PageDrawerState = ReturnType<typeof usePageDrawerState>;

export const PageDrawerContext = React.createContext<PageDrawerState>({
  isDrawerExpanded: false,
  setIsDrawerExpanded: () => {},
  drawerPanelRef: null,
  drawerFocusRef: null,
});

export const PageDrawerContextProvider: React.FunctionComponent<{
  children: React.ReactNode;
}> = ({ children }) => {
  const pageDrawerState = usePageDrawerState();
  return (
    <PageDrawerContext.Provider value={pageDrawerState}>
      {children}
    </PageDrawerContext.Provider>
  );
};

export interface IPageDrawerContentPortalProps {
  isExpanded: boolean;
  onCloseClick: () => void;
  children: React.ReactNode;
}

export const PageDrawerContentPortal: React.FunctionComponent<
  IPageDrawerContentPortalProps
> = ({ isExpanded: localIsExpandedProp, onCloseClick, children }) => {
  const {
    isDrawerExpanded,
    setIsDrawerExpanded,
    drawerPanelRef,
    drawerFocusRef,
  } = React.useContext(PageDrawerContext);

  // Lift the value of isExpanded out to the context, but derive it from deeper state such as the presence of a selected table row
  React.useEffect(() => {
    setIsDrawerExpanded(localIsExpandedProp);
    return () => {
      setIsDrawerExpanded(false);
    };
  }, [localIsExpandedProp]);

  return drawerPanelRef?.current
    ? ReactDOM.createPortal(
        <DrawerHead>
          <span tabIndex={0} ref={drawerFocusRef}>
            {children}
          </span>
          <DrawerActions>
            <DrawerCloseButton
              // We call onCloseClick here instead of setIsDrawerExpanded
              // because we want the isExpanded prop here to be the source of truth.
              // (state driven from the parent of the PageDrawerContentPortal, not from the context)
              onClick={onCloseClick}
            />
          </DrawerActions>
        </DrawerHead>,
        drawerPanelRef?.current
      )
    : null;
};
