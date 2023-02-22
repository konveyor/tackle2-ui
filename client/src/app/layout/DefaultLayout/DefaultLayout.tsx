import React from "react";
import {
  Drawer,
  DrawerActions,
  DrawerCloseButton,
  DrawerContent,
  DrawerContentBody,
  DrawerHead,
  DrawerPanelContent,
  Page,
  SkipToContent,
} from "@patternfly/react-core";
import pageStyles from "@patternfly/react-styles/css/components/Page/page";

import { HeaderApp } from "../HeaderApp";
import { SidebarApp } from "../SidebarApp";
import { Notifications } from "@app/shared/components/Notifications";

export interface DefaultLayoutProps {}

export const DefaultLayout: React.FC<DefaultLayoutProps> = ({ children }) => {
  const pageId = "main-content-page-layout-horizontal-nav";
  const PageSkipToContent = (
    <SkipToContent href={`#${pageId}`}>Skip to content</SkipToContent>
  );

  const drawerRef = React.useRef<HTMLSpanElement>(null);

  const isDrawerExpanded = true; // TODO how to wire this up so it is controlled from the table? context? derive from whether we have drawer content to render?

  const drawerPanelContent = (
    <DrawerPanelContent
      isResizable
      id="app-detail-drawer"
      defaultSize="500px"
      minSize="150px"
    >
      <DrawerHead>
        <span tabIndex={0} ref={drawerRef}>
          TODO - drawer contents here!{" "}
          {/* TODO how to wire this up so it is rendered from the table? portals? context? can we determine expanded state based on whether the portal exists / is rendered? how can we avoid storing JSX in state without duplicating the source of expanded truth? */}
        </span>
        <DrawerActions>
          <DrawerCloseButton onClick={() => alert("TODO")} />
        </DrawerActions>
      </DrawerHead>
    </DrawerPanelContent>
  );

  // TODO how can we prevent rendering all this Drawer boilerplate on pages that don't need a drawer? drive something from route config? some kind of effect on route change?
  // --- start with it always rendered and come back to this later

  return (
    <Page
      header={<HeaderApp />}
      sidebar={<SidebarApp />}
      isManagedSidebar
      skipToContent={PageSkipToContent}
      mainContainerId={pageId}
    >
      <div className={pageStyles.pageDrawer}>
        <Drawer
          isExpanded={true}
          onExpand={() => drawerRef.current && drawerRef.current.focus()}
          position="right"
        >
          <DrawerContent panelContent={drawerPanelContent}>
            <DrawerContentBody>
              {children}
              <Notifications />
            </DrawerContentBody>
          </DrawerContent>
        </Drawer>
      </div>
    </Page>
  );
};
