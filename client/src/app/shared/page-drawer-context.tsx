import {
  DrawerActions,
  DrawerCloseButton,
  DrawerHead,
} from "@patternfly/react-core";
import * as React from "react";
import * as ReactDOM from "react-dom";

export const PAGE_DRAWER_CONTENT_ID = "page-drawer-content";

const usePageDrawerState = () => {
  const [isDrawerExpanded, setIsDrawerExpanded] = React.useState(false);
  const drawerFocusRef = React.useRef(document.createElement("span"));
  return {
    isDrawerExpanded,
    setIsDrawerExpanded,
    drawerFocusRef: drawerFocusRef as typeof drawerFocusRef | null,
  };
};

export type PageDrawerState = ReturnType<typeof usePageDrawerState>;

export const PageDrawerContext = React.createContext<PageDrawerState>({
  isDrawerExpanded: false,
  setIsDrawerExpanded: () => {},
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

export const PageDrawerContentPortal: React.FunctionComponent<
  IPageDrawerContentPortalProps
> = ({ isExpanded: localIsExpandedProp, onCloseClick, children }) => {
  const { setIsDrawerExpanded, drawerFocusRef } =
    React.useContext(PageDrawerContext);

  // Lift the value of isExpanded out to the context, but derive it from deeper state such as the presence of a selected table row
  React.useEffect(() => {
    setIsDrawerExpanded(localIsExpandedProp);
    return () => {
      setIsDrawerExpanded(false);
    };
  }, [localIsExpandedProp]);

  const drawerPanelMainElement = document.querySelector(
    `#${PAGE_DRAWER_CONTENT_ID} .pf-c-drawer__panel-main`
  );

  return drawerPanelMainElement
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
        drawerPanelMainElement
      )
    : null;
};
